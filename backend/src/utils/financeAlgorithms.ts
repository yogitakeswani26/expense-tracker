/**
 * financeAlgorithms.ts
 * ---------------------------------------------------------------------------
 * Pure, framework-free algorithms that power the advanced features:
 *  - statistics helpers (mean, std-dev, z-score, linear regression, forecast)
 *  - settlement/debt-simplification (minimize # of payment transactions)
 *  - recurring-expense pattern detection
 *
 * Kept dependency-free and side-effect-free on purpose so they can be unit
 * tested without touching Mongo (see backend/tests/advanced-features.test.ts)
 * and reused across services (expenseOptimizationService, settlementService,
 * smartRecommendationService, ...).
 */

// =============================================================================
// BASIC STATISTICS
// =============================================================================

export function mean(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** Sample standard deviation (n-1 denominator). Returns 0 for < 2 samples. */
export function stdDev(nums: number[], precomputedMean?: number): number {
  if (nums.length < 2) return 0;
  const m = precomputedMean ?? mean(nums);
  const variance = nums.reduce((sum, v) => sum + (v - m) ** 2, 0) / (nums.length - 1);
  return Math.sqrt(variance);
}

export function zScore(value: number, avg: number, sd: number): number {
  if (sd === 0) return 0;
  return (value - avg) / sd;
}

/** Ordinary least-squares regression over evenly spaced points (x = 0..n-1). */
export function linearRegression(y: number[]): { slope: number; intercept: number } {
  const n = y.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  if (n === 1) return { slope: 0, intercept: y[0] };

  const xMean = (n - 1) / 2;
  const yMean = mean(y);
  let num = 0;
  let den = 0;
  for (let x = 0; x < n; x++) {
    num += (x - xMean) * (y[x] - yMean);
    den += (x - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  return { slope, intercept };
}

/**
 * Forecasts the next value in a time series using Holt's linear (double)
 * exponential smoothing: a "level" that tracks the smoothed current value
 * and a "trend" that tracks the smoothed rate of change, extrapolated one
 * step forward. Unlike a plain EWMA — which structurally lags behind a
 * sustained trend and can forecast *below* the most recent value even on a
 * steadily rising series — Holt's method explicitly carries the trend
 * forward, so a steady rise keeps rising in the forecast. Clamped at 0
 * (spend can't be negative).
 *
 * alpha = level smoothing factor, beta = trend smoothing factor (both 0-1).
 */
export function forecastNextValue(series: number[], alpha = 0.5, beta = 0.3): number {
  if (series.length === 0) return 0;
  if (series.length === 1) return Math.max(0, Math.round(series[0] * 100) / 100);

  let level = series[0];
  let trend = series[1] - series[0];

  for (let i = 1; i < series.length; i++) {
    const prevLevel = level;
    level = alpha * series[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }

  const forecast = level + trend;
  return Math.max(0, Math.round(forecast * 100) / 100);
}

// =============================================================================
// SETTLEMENT OPTIMIZATION (minimize number of payment transactions)
// =============================================================================

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export interface RawDebt {
  from: string;
  to: string;
  amount: number;
}

/**
 * Greedy debt simplification: repeatedly match the largest creditor with the
 * largest debtor. O(n log n), produces at most (participants - 1)
 * transactions. This is the standard real-world approach (the same idea
 * Splitwise-style apps use) and matches the true minimum in the overwhelming
 * majority of real balance distributions.
 *
 * NOTE: the *globally* minimal transaction count is an NP-hard problem
 * (equivalent to partitioning balances into zero-sum subsets), so for very
 * small groups where an exact answer matters, use `minimizeTransactionsExact`.
 */
export function minimizeTransactions(balances: Record<string, number>, epsilon = 0.01): Settlement[] {
  const entries = Object.entries(balances)
    .map(([id, amt]) => [id, Math.round(amt * 100) / 100] as [string, number])
    .filter(([, amt]) => Math.abs(amt) > epsilon);

  const creditors = entries.filter(([, amt]) => amt > 0).sort((a, b) => b[1] - a[1]);
  const debtors = entries.filter(([, amt]) => amt < 0).sort((a, b) => a[1] - b[1]);

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const settleAmount = Math.round(Math.min(-debtor[1], creditor[1]) * 100) / 100;

    if (settleAmount > epsilon) {
      settlements.push({ from: debtor[0], to: creditor[0], amount: settleAmount });
    }

    debtor[1] = Math.round((debtor[1] + settleAmount) * 100) / 100;
    creditor[1] = Math.round((creditor[1] - settleAmount) * 100) / 100;

    if (Math.abs(debtor[1]) <= epsilon) i++;
    if (Math.abs(creditor[1]) <= epsilon) j++;
  }

  return settlements;
}

/**
 * Exact minimum-transaction solver via backtracking (same idea as
 * "Optimal Account Balancing" / LeetCode 465). Guarantees the true minimum
 * number of transactions, at the cost of worst-case factorial time — only
 * safe for small participant counts (guarded at 12, which comfortably covers
 * a family/roommate group).
 */
export function minimizeTransactionsExact(balances: Record<string, number>, epsilon = 0.01): Settlement[] {
  const entries = Object.entries(balances)
    .map(([id, amt]) => [id, Math.round(amt * 100)] as [string, number]) // work in integer cents to avoid FP drift
    .filter(([, cents]) => Math.abs(cents) > epsilon * 100);

  const ids = entries.map((e) => e[0]);
  const amounts = entries.map((e) => e[1]);
  const n = amounts.length;

  if (n > 12) {
    throw new Error(
      'minimizeTransactionsExact supports at most 12 participants with outstanding balances; use minimizeTransactions (greedy) for larger groups.'
    );
  }

  let bestCount = Infinity;
  let bestPlan: Settlement[] = [];
  const path: Settlement[] = [];

  function dfs(start: number) {
    while (start < n && amounts[start] === 0) start++;
    if (start === n) {
      if (path.length < bestCount) {
        bestCount = path.length;
        bestPlan = [...path];
      }
      return;
    }
    if (path.length + 1 >= bestCount) return; // prune: can't possibly beat the best found so far

    for (let k = start + 1; k < n; k++) {
      if (amounts[k] !== 0 && (amounts[k] < 0) !== (amounts[start] < 0)) {
        const settleCents = Math.abs(amounts[start]);
        const settlement: Settlement =
          amounts[start] < 0
            ? { from: ids[start], to: ids[k], amount: settleCents / 100 }
            : { from: ids[k], to: ids[start], amount: settleCents / 100 };

        amounts[k] += amounts[start];
        const saved = amounts[start];
        amounts[start] = 0;
        path.push(settlement);

        dfs(start + 1);

        path.pop();
        amounts[start] = saved;
        amounts[k] -= saved;
      }
    }
  }

  dfs(0);
  return bestPlan;
}

/**
 * Nets a list of raw pairwise IOUs (which may form chains, e.g. A owes B,
 * B owes C) into net balances and produces the minimal settlement plan.
 * This is what actually "collapses" a chain like A -> B -> C into a direct
 * A -> C transfer.
 */
export function simplifyDebtChain(debts: RawDebt[], preferExact = true): Settlement[] {
  const balances: Record<string, number> = {};
  for (const d of debts) {
    balances[d.from] = (balances[d.from] || 0) - d.amount;
    balances[d.to] = (balances[d.to] || 0) + d.amount;
  }

  const participantCount = Object.values(balances).filter((b) => Math.abs(b) > 0.01).length;
  if (preferExact && participantCount <= 12) {
    return minimizeTransactionsExact(balances);
  }
  return minimizeTransactions(balances);
}

// =============================================================================
// RECURRING EXPENSE DETECTION
// =============================================================================

export type RecurrencePattern = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null;

export interface RecurrenceCandidate {
  isRecurring: boolean;
  pattern: RecurrencePattern;
  confidence: number; // 0-1
  avgIntervalDays: number;
  avgAmount: number;
  amountVariability: number; // coefficient of variation of the amount
  occurrences: number;
}

const INTERVAL_BANDS: [RecurrencePattern, number, number][] = [
  ['daily', 0.5, 1.5],
  ['weekly', 6, 8],
  ['biweekly', 12, 16],
  ['monthly', 26, 34],
  ['yearly', 350, 380],
];

function classifyInterval(days: number): RecurrencePattern {
  for (const [label, lo, hi] of INTERVAL_BANDS) {
    if (days >= lo && days <= hi) return label;
  }
  return null;
}

/**
 * Given a list of same-merchant/description occurrences, decides whether
 * they look like a recurring charge (subscription, bill, EMI, ...) and, if
 * so, what cadence and how confident we are.
 *
 * Confidence blends:
 *  - interval consistency (low variance in days-between-occurrences)
 *  - amount consistency (low variance in charged amount)
 *  - sample size (more occurrences = more confidence, caps out at 6)
 */
export function detectRecurrencePattern(occurrences: { date: Date; amount: number }[]): RecurrenceCandidate {
  if (occurrences.length < 3) {
    return {
      isRecurring: false,
      pattern: null,
      confidence: 0,
      avgIntervalDays: 0,
      avgAmount: Math.round(mean(occurrences.map((o) => o.amount)) * 100) / 100,
      amountVariability: 0,
      occurrences: occurrences.length,
    };
  }

  const sorted = [...occurrences].sort((a, b) => a.date.getTime() - b.date.getTime());
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    intervals.push((sorted[i].date.getTime() - sorted[i - 1].date.getTime()) / (1000 * 60 * 60 * 24));
  }

  const avgInterval = mean(intervals);
  const intervalStd = stdDev(intervals, avgInterval);
  const intervalCV = avgInterval > 0 ? intervalStd / avgInterval : 1;

  const amounts = sorted.map((o) => o.amount);
  const avgAmount = mean(amounts);
  const amountStd = stdDev(amounts, avgAmount);
  const amountCV = avgAmount > 0 ? amountStd / avgAmount : 1;

  const pattern = classifyInterval(avgInterval);

  const intervalScore = Math.max(0, 1 - intervalCV);
  const amountScore = Math.max(0, 1 - amountCV);
  const sampleScore = Math.min(1, sorted.length / 6);
  const confidence = pattern ? intervalScore * 0.5 + amountScore * 0.3 + sampleScore * 0.2 : 0;

  return {
    isRecurring: pattern !== null && confidence >= 0.55,
    pattern,
    confidence: Math.round(confidence * 100) / 100,
    avgIntervalDays: Math.round(avgInterval * 10) / 10,
    avgAmount: Math.round(avgAmount * 100) / 100,
    amountVariability: Math.round(amountCV * 100) / 100,
    occurrences: sorted.length,
  };
}
