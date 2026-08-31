import { Expense } from '../models/Expense';
import { TransactionHandler } from '../middleware/transactionHandler';

/**
 * PROBLEM: Recurring expense service has race conditions
 * - Two cron jobs execute simultaneously
 * - Both create duplicate expenses
 * - Database gets corrupted
 *
 * SOLUTION: Use MongoDB distributed locks
 */

export class RecurringServiceOptimized {
  private static readonly LOCK_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly LOCK_KEY = 'recurring-process-lock';

  /**
   * Process recurring expenses with distributed lock
   *
   * PROBLEM: Without locking, concurrent cron jobs create duplicates
   * SOLUTION: First lock wins, others wait or skip
   */
  async processRecurringExpensesWithLock() {
    const lockKey = `${RecurringServiceOptimized.LOCK_KEY}-${new Date().toISOString().split('T')[0]}`;

    try {
      // Try to acquire lock
      const acquired = await this.acquireLock(lockKey);

      if (!acquired) {
        console.log('⏭️  Recurring expense process already running, skipping...');
        return;
      }

      await this.processRecurringExpenses();
    } finally {
      await this.releaseLock(lockKey);
    }
  }

  /**
   * Process recurring expenses using transactions
   */
  private async processRecurringExpenses() {
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Use cursor to handle large datasets without loading all into memory
      const cursor = Expense.find({
        isRecurring: true,
        date: { $lte: yesterday },
      }).cursor();

      let processed = 0;
      let errors = 0;

      for await (const expense of cursor) {
        try {
          const nextDate = this.getNextDate(expense.date, expense.recurrencePattern);

          if (nextDate <= now) {
            // Use transaction for data consistency
            await TransactionHandler.executeInTransaction(async (session) => {
              const newExpense = new Expense({
                ...expense.toObject(),
                _id: undefined,
                date: nextDate,
              });

              await newExpense.save({ session });
            });

            processed++;

            if (processed % 100 === 0) {
              console.log(`📊 Processed ${processed} recurring expenses...`);
            }
          }
        } catch (error) {
          errors++;
          console.error(`❌ Error processing recurring expense ${expense._id}:`, error);
          // Don't stop processing, continue with next expense
        }
      }

      console.log(`✅ Recurring expense processing complete: ${processed} processed, ${errors} errors`);
    } catch (error) {
      console.error('❌ Error in recurring expense processing:', error);
      throw error;
    }
  }

  /**
   * Acquire distributed lock
   * PROBLEM: Simple approach - in production, use Redis for distributed locks
   */
  private async acquireLock(lockKey: string): Promise<boolean> {
    try {
      // Try to create a lock document
      // If it exists and not expired, return false
      const Lock = require('../models/Lock'); // Assuming we have a Lock model

      const lock = new Lock({
        key: lockKey,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + RecurringServiceOptimized.LOCK_TTL),
      });

      await lock.save();
      return true;
    } catch (error: any) {
      // Duplicate key error means lock already exists
      if (error.code === 11000) {
        // Check if lock expired
        const Lock = require('../models/Lock');
        const existingLock = await Lock.findOne({ key: lockKey });

        if (existingLock && new Date() > existingLock.expiresAt) {
          // Lock expired, try to delete and acquire
          await Lock.deleteOne({ key: lockKey });
          return this.acquireLock(lockKey);
        }

        return false;
      }

      throw error;
    }
  }

  /**
   * Release distributed lock
   */
  private async releaseLock(lockKey: string): Promise<void> {
    try {
      const Lock = require('../models/Lock');
      await Lock.deleteOne({ key: lockKey });
    } catch (error) {
      console.error(`⚠️  Could not release lock ${lockKey}:`, error);
      // Don't throw - lock will expire anyway
    }
  }

  /**
   * Settlement with transaction safety
   *
   * PROBLEM: Settling splits involves updating multiple documents
   * Without transactions, inconsistency can occur
   */
  async settleExpenseSplit(expenseId: string, userId: string) {
    return await TransactionHandler.executeInTransaction(async (session) => {
      const expense = await Expense.findById(expenseId).session(session);

      if (!expense) {
        throw new Error('Expense not found');
      }

      // Find split for this user
      const splitIndex = expense.splits.findIndex(s => s.userId.toString() === userId);

      if (splitIndex === -1) {
        throw new Error('Split not found for this user');
      }

      // Update split status
      expense.splits[splitIndex].status = 'settled';
      expense.updatedAt = new Date();

      await expense.save({ session });

      return expense;
    });
  }

  /**
   * Bulk settle splits for all members
   *
   * PROBLEM: Settling all splits requires multiple updates
   * SOLUTION: Single batch update in transaction
   */
  async settleAllSplits(expenseId: string) {
    return await TransactionHandler.executeInTransaction(async (session) => {
      const expense = await Expense.findByIdAndUpdate(
        expenseId,
        {
          $set: {
            'splits.$[].status': 'settled',
            updatedAt: new Date(),
          },
        },
        { new: true, session }
      );

      return expense;
    });
  }

  /**
   * Detect and fix orphaned expenses
   *
   * PROBLEM: If a recurring expense creation fails midway,
   * parent expense might reference non-existent child
   */
  async detectAndFixOrphans(familyId: string) {
    try {
      // Find expenses with references to non-existent parents
      const orphans = await Expense.find({
        familyId,
        parentExpenseId: { $exists: true },
      });

      let fixed = 0;

      for (const orphan of orphans) {
        const parent = await Expense.findById(orphan.parentExpenseId);

        if (!parent) {
          // Parent doesn't exist - this is an orphan
          orphan.parentExpenseId = undefined;
          await orphan.save();
          fixed++;
        }
      }

      if (fixed > 0) {
        console.log(`🔧 Fixed ${fixed} orphaned expenses in family ${familyId}`);
      }

      return fixed;
    } catch (error) {
      console.error('Error fixing orphans:', error);
      throw error;
    }
  }

  private getNextDate(currentDate: Date, pattern?: string): Date {
    const next = new Date(currentDate);

    switch (pattern) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
      default:
        next.setDate(next.getDate() + 1);
    }

    return next;
  }
}

export const recurringServiceOptimized = new RecurringServiceOptimized();
