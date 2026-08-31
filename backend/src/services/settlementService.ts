/**
 * settlementService.ts
 * ---------------------------------------------------------------------------
 * FEATURE 2: Settlement Optimization
 *  - calculateNetBalances : who is net owed / who net owes, across the family
 *  - getWhoOwesWhom       : raw pairwise debts (pre-simplification view)
 *  - suggestSettlementPlan: minimal-transaction settlement plan (exact for
 *                           small groups, greedy for larger ones)
 *  - recordSettlement     : persists a settlement as a Transaction and marks
 *                           the underlying expense splits as settled
 *  - getSettlementHistory : audit trail of past settlements
 */

import mongoose from 'mongoose';
import { Expense } from '../models/Expense';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { minimizeTransactions, minimizeTransactionsExact, Settlement } from '../utils/financeAlgorithms';

export type SettlementMode = 'auto' | 'exact' | 'fast';

export class SettlementService {
  /**
   * Net balance per user, computed straight from expense splits:
   *   - the payer is credited the full expense amount
   *   - each *pending* split debits that participant
   *   - each *settled* split is removed from the payer's credit (they were
   *     already paid back for that portion)
   * Balances across the family always sum to ~0.
   */
  async calculateNetBalances(familyId: string): Promise<Record<string, number>> {
    if (!mongoose.Types.ObjectId.isValid(familyId)) {
      throw new AppError('INVALID_ID', 'Invalid family ID format', 400);
    }

    const expenses = await Expense.find({ familyId }).select('paidBy amount splits').lean();

    const balances: Record<string, number> = {};
    const touch = (id: string) => {
      if (!(id in balances)) balances[id] = 0;
    };

    for (const exp of expenses) {
      const payerId = exp.paidBy.toString();
      touch(payerId);
      balances[payerId] += exp.amount;

      for (const split of exp.splits || []) {
        const uid = split.userId.toString();
        touch(uid);
        if (split.status === 'pending') {
          balances[uid] -= split.amount;
        } else {
          balances[payerId] -= split.amount;
        }
      }
    }

    for (const id of Object.keys(balances)) {
      balances[id] = Math.round(balances[id] * 100) / 100;
      if (Math.abs(balances[id]) < 0.01) delete balances[id];
    }

    return balances;
  }

  /** Raw, un-simplified view: for every pending split, who owes whom directly. */
  async getWhoOwesWhom(familyId: string) {
    if (!mongoose.Types.ObjectId.isValid(familyId)) {
      throw new AppError('INVALID_ID', 'Invalid family ID format', 400);
    }

    const expenses = await Expense.find({ familyId, 'splits.status': 'pending' })
      .select('paidBy splits description date')
      .populate('paidBy', 'name email')
      .lean();

    const pairMap = new Map<string, { from: string; to: string; amount: number; expenseIds: any[] }>();

    for (const exp of expenses) {
      const payer: any = exp.paidBy;
      const payerId = String(payer?._id ?? payer);

      for (const split of exp.splits) {
        if (split.status !== 'pending') continue;
        const debtorId = split.userId.toString();
        if (debtorId === payerId) continue; // the payer's own share isn't a debt

        const key = `${debtorId}->${payerId}`;
        if (!pairMap.has(key)) {
          pairMap.set(key, { from: debtorId, to: payerId, amount: 0, expenseIds: [] });
        }
        const entry = pairMap.get(key)!;
        entry.amount += split.amount;
        entry.expenseIds.push(exp._id);
      }
    }

    return Array.from(pairMap.values())
      .map((e) => ({ ...e, amount: Math.round(e.amount * 100) / 100 }))
      .sort((a, b) => b.amount - a.amount);
  }

  /**
   * Produces the minimal set of payment transactions that settles the whole
   * family. Uses the exact backtracking solver for small groups (guaranteed
   * true minimum) and falls back to the greedy algorithm for larger ones.
   */
  async suggestSettlementPlan(familyId: string, mode: SettlementMode = 'auto') {
    const balances = await this.calculateNetBalances(familyId);
    const participants = Object.keys(balances).length;
    const useExact = mode === 'exact' || (mode === 'auto' && participants <= 10);

    const plan: Settlement[] = useExact ? minimizeTransactionsExact(balances) : minimizeTransactions(balances);

    const involvedIds = Array.from(new Set(plan.flatMap((p) => [p.from, p.to])));
    const users = involvedIds.length
      ? await User.find({ _id: { $in: involvedIds } }).select('name email').lean()
      : [];
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const rawDebts = await this.getWhoOwesWhom(familyId);

    return {
      balances: Object.entries(balances).map(([userId, amount]) => ({
        userId,
        name: userMap.get(userId)?.name ?? null,
        amount,
        status: amount > 0 ? 'is owed' : 'owes',
      })),
      settlements: plan.map((s) => ({
        from: { userId: s.from, name: userMap.get(s.from)?.name ?? null },
        to: { userId: s.to, name: userMap.get(s.to)?.name ?? null },
        amount: s.amount,
      })),
      stats: {
        transactionsBefore: rawDebts.length,
        transactionsAfter: plan.length,
        transactionsSaved: Math.max(0, rawDebts.length - plan.length),
        algorithm: useExact ? 'exact' : 'greedy',
      },
    };
  }

  /**
   * Records a settlement payment: marks the oldest pending splits owed by
   * `fromUserId` to `toUserId` as settled (splitting a single split if the
   * payment doesn't line up exactly with one bill), then writes an audit
   * Transaction record.
   */
  async recordSettlement(familyId: string, fromUserId: string, toUserId: string, amount: number, _actingUserId: string) {
    if (
      !mongoose.Types.ObjectId.isValid(familyId) ||
      !mongoose.Types.ObjectId.isValid(fromUserId) ||
      !mongoose.Types.ObjectId.isValid(toUserId)
    ) {
      throw new AppError('INVALID_ID', 'Invalid ID format', 400);
    }
    if (!(amount > 0)) {
      throw new AppError('VALIDATION_ERROR', 'Amount must be greater than 0', 400);
    }

    let remaining = Math.round(amount * 100) / 100;
    const expenses = await Expense.find({
      familyId,
      paidBy: toUserId,
      splits: { $elemMatch: { userId: fromUserId, status: 'pending' } },
    }).sort({ date: 1 });

    const touchedExpenses: string[] = [];

    for (const exp of expenses) {
      if (remaining <= 0.009) break;

      const split = exp.splits.find((s) => s.userId.toString() === fromUserId && s.status === 'pending');
      if (!split) continue;

      if (split.amount <= remaining + 0.009) {
        remaining = Math.round((remaining - split.amount) * 100) / 100;
        split.status = 'settled';
        touchedExpenses.push(exp._id.toString());
        await exp.save();
      } else {
        // Payment doesn't cover this whole split — settle the paid portion and
        // leave the remainder pending as a separate split entry.
        const settledAmount = remaining;
        split.amount = Math.round((split.amount - settledAmount) * 100) / 100;
        exp.splits.push({ userId: new mongoose.Types.ObjectId(fromUserId), amount: settledAmount, status: 'settled' } as any);
        touchedExpenses.push(exp._id.toString());
        await exp.save();
        remaining = 0;
      }
    }

    const transaction = await Transaction.create({
      familyId,
      fromUser: fromUserId,
      toUser: toUserId,
      amount,
      relatedExpenses: touchedExpenses,
      status: 'settled',
      settledAt: new Date(),
    });

    return transaction;
  }

  async getSettlementHistory(familyId: string, limit = 50) {
    if (!mongoose.Types.ObjectId.isValid(familyId)) {
      throw new AppError('INVALID_ID', 'Invalid family ID format', 400);
    }
    return Transaction.find({ familyId })
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email')
      .sort({ createdAt: -1 })
      .limit(Math.min(200, Math.max(1, limit)))
      .lean();
  }
}

export const settlementService = new SettlementService();
