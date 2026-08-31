import { ClientSession } from 'mongoose';
import mongoose from 'mongoose';

/**
 * Transaction Handler for multi-document ACID operations
 *
 * PROBLEM: Without transactions, concurrent operations on related documents
 * (expenses, splits, family balances) can lead to inconsistency.
 *
 * WHEN: Any operation touching multiple documents:
 * - Creating expense with splits
 * - Updating family members + balance
 * - Settling splits
 *
 * IMPACT: Data corruption, orphaned documents, split calculations wrong
 */

export class TransactionHandler {
  /**
   * Execute operation within MongoDB transaction
   * Automatically rollback on error
   */
  static async executeInTransaction<T>(
    operation: (session: ClientSession) => Promise<T>
  ): Promise<T> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await operation(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Get session for manual control
   */
  static async getSession(): Promise<ClientSession> {
    const session = await mongoose.startSession();
    session.startTransaction();
    return session;
  }

  /**
   * Commit transaction
   */
  static async commit(session: ClientSession): Promise<void> {
    await session.commitTransaction();
    await session.endSession();
  }

  /**
   * Abort transaction on error
   */
  static async abort(session: ClientSession): Promise<void> {
    await session.abortTransaction();
    await session.endSession();
  }
}

/**
 * Retry logic for transient failures (network, locks)
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  backoffMs: number = 100
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Don't retry validation errors or authorization errors
      if (error.statusCode === 400 || error.statusCode === 403 || error.statusCode === 404) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        break;
      }

      // Exponential backoff
      const delay = backoffMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Operation failed after retries');
}
