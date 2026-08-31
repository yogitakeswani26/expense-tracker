import {
  mean,
  stdDev,
  zScore,
  linearRegression,
  forecastNextValue,
  minimizeTransactions,
  minimizeTransactionsExact,
  simplifyDebtChain,
  detectRecurrencePattern,
} from '../src/utils/financeAlgorithms';

// These are pure-function tests — no DB/Mongo required — covering the core
// algorithms behind the advanced features (settlement optimization, spending
// pattern analysis, recurring-expense detection).

describe('financeAlgorithms', () => {
  describe('mean / stdDev / zScore', () => {
    it('computes mean correctly', () => {
      expect(mean([10, 20, 30])).toBe(20);
      expect(mean([])).toBe(0);
    });

    it('computes sample standard deviation correctly', () => {
      // Classic textbook example: population SD = 2, sample SD ≈ 2.138
      expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 2);
      expect(stdDev([5])).toBe(0);
    });

    it('computes z-score', () => {
      expect(zScore(80, 50, 10)).toBe(3);
      expect(zScore(50, 50, 0)).toBe(0); // guards against divide-by-zero
    });
  });

  describe('linearRegression', () => {
    it('detects a clear upward trend', () => {
      const { slope } = linearRegression([100, 120, 140, 160, 180]);
      expect(slope).toBeCloseTo(20, 5);
    });

    it('detects a flat series', () => {
      const { slope } = linearRegression([100, 100, 100, 100]);
      expect(slope).toBeCloseTo(0, 5);
    });
  });

  describe('forecastNextValue', () => {
    it('projects roughly the next step of a steadily rising series', () => {
      const forecast = forecastNextValue([1000, 1100, 1200, 1300, 1400]);
      expect(forecast).toBeGreaterThan(1400);
      expect(forecast).toBeLessThan(1700);
    });

    it('never goes negative', () => {
      expect(forecastNextValue([0, 0, 0])).toBeGreaterThanOrEqual(0);
    });
  });

  describe('minimizeTransactions (greedy settlement optimization)', () => {
    it('settles a simple 3-person shared bill with 2 transactions', () => {
      // A fronted ₹300 for a bill split 3 ways -> B and C each owe A ₹100
      const balances = { A: 200, B: -100, C: -100 };
      const settlements = minimizeTransactions(balances);

      expect(settlements).toHaveLength(2);
      expect(settlements.reduce((sum, t) => sum + t.amount, 0)).toBeCloseTo(200, 2);
      for (const t of settlements) expect(t.to).toBe('A');
    });

    it('collapses an A -> B -> C debt chain into a single direct transfer', () => {
      const balances = { A: -50, B: 0, C: 50 };
      const settlements = minimizeTransactions(balances);

      expect(settlements).toHaveLength(1);
      expect(settlements[0]).toMatchObject({ from: 'A', to: 'C', amount: 50 });
    });
  });

  describe('minimizeTransactionsExact (exact settlement optimization)', () => {
    it('finds the true minimum transaction count for a 4-person group', () => {
      const balances = { A: 5, B: 5, C: -3, D: -7 };
      const settlements = minimizeTransactionsExact(balances);

      // Verified by exhaustive check: no 2-person subset of {5,5,-3,-7} sums to
      // zero, so 3 transactions is provably optimal for this input.
      expect(settlements).toHaveLength(3);

      // Reconstruct original balances from the settlements: each debtor's
      // contribution is negative (they paid out), each creditor's is
      // positive (they received) — summed, this must equal the original
      // balances exactly for a fully-settling plan.
      const net: Record<string, number> = {};
      for (const t of settlements) {
        net[t.from] = (net[t.from] || 0) - t.amount;
        net[t.to] = (net[t.to] || 0) + t.amount;
      }
      expect(net.A).toBeCloseTo(5, 2);
      expect(net.B).toBeCloseTo(5, 2);
      expect(net.C).toBeCloseTo(-3, 2);
      expect(net.D).toBeCloseTo(-7, 2);
    });

    it('throws for groups larger than the supported exact-search size', () => {
      const balances: Record<string, number> = {};
      for (let i = 0; i < 13; i++) balances[`user${i}`] = i % 2 === 0 ? 10 : -10;
      expect(() => minimizeTransactionsExact(balances)).toThrow();
    });
  });

  describe('simplifyDebtChain (raw IOUs -> minimal settlements)', () => {
    it('nets an A -> B -> C chain into a single A -> C transfer', () => {
      const debts = [
        { from: 'A', to: 'B', amount: 40 },
        { from: 'B', to: 'C', amount: 40 },
      ];
      expect(simplifyDebtChain(debts)).toEqual([{ from: 'A', to: 'C', amount: 40 }]);
    });

    it('fully cancels a circular chain (A -> B -> C -> A)', () => {
      const debts = [
        { from: 'A', to: 'B', amount: 30 },
        { from: 'B', to: 'C', amount: 30 },
        { from: 'C', to: 'A', amount: 30 },
      ];
      expect(simplifyDebtChain(debts)).toEqual([]);
    });
  });

  describe('detectRecurrencePattern', () => {
    it('flags a consistent monthly subscription as recurring', () => {
      const occurrences = [
        { date: new Date('2026-03-01'), amount: 499 },
        { date: new Date('2026-04-01'), amount: 499 },
        { date: new Date('2026-05-02'), amount: 499 },
        { date: new Date('2026-06-01'), amount: 499 },
      ];
      const result = detectRecurrencePattern(occurrences);

      expect(result.isRecurring).toBe(true);
      expect(result.pattern).toBe('monthly');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('flags a consistent weekly charge as recurring', () => {
      const occurrences = [
        { date: new Date('2026-06-01'), amount: 250 },
        { date: new Date('2026-06-08'), amount: 250 },
        { date: new Date('2026-06-15'), amount: 260 },
        { date: new Date('2026-06-22'), amount: 245 },
      ];
      const result = detectRecurrencePattern(occurrences);

      expect(result.isRecurring).toBe(true);
      expect(result.pattern).toBe('weekly');
    });

    it('does not flag irregular one-off purchases as recurring', () => {
      const occurrences = [
        { date: new Date('2026-01-05'), amount: 230 },
        { date: new Date('2026-02-19'), amount: 80 },
        { date: new Date('2026-06-30'), amount: 1450 },
      ];
      expect(detectRecurrencePattern(occurrences).isRecurring).toBe(false);
    });

    it('requires at least 3 occurrences to make a call', () => {
      const result = detectRecurrencePattern([
        { date: new Date('2026-01-01'), amount: 100 },
        { date: new Date('2026-02-01'), amount: 100 },
      ]);
      expect(result.isRecurring).toBe(false);
      expect(result.occurrences).toBe(2);
    });
  });
});
