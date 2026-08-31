/**
 * Circuit Breaker Pattern
 *
 * PROBLEM: External services can fail (email, SMS, payment gateway, etc.)
 * Without circuit breaker:
 * - Requests pile up waiting for failed service
 * - Server exhausts threads
 * - Cascading failures
 *
 * SOLUTION: Circuit breaker stops sending requests to failing service
 * - Fail fast
 * - Allow recovery time
 * - Graceful degradation
 */

export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Service failing, reject requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

interface CircuitBreakerConfig {
  failureThreshold: number; // Failures before opening (default: 5)
  resetTimeout: number; // Milliseconds before trying again (default: 60000)
  monitoringPeriod: number; // Period for resetting counts (default: 10000)
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private nextAttemptTime: number = 0;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig = {
      failureThreshold: 5,
      resetTimeout: 60000,
      monitoringPeriod: 10000,
    }
  ) {
    this.startMonitoring();
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // If open and not ready to try, fail fast
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error(`CircuitBreaker [${this.name}] is OPEN. Service unavailable.`);
      }

      // Try to recover
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
    }

    try {
      const result = await operation();

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess() {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      // Close after 3 successful attempts during recovery
      if (this.successCount >= 3) {
        console.log(`✅ CircuitBreaker [${this.name}] recovered, state CLOSED`);
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      // Failed during recovery, open again
      console.error(`❌ CircuitBreaker [${this.name}] failed during recovery, reopening`);
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.config.resetTimeout;
    } else if (this.failureCount >= this.config.failureThreshold) {
      // Failure threshold reached, open circuit
      console.error(
        `🔴 CircuitBreaker [${this.name}] opened after ${this.failureCount} failures`
      );
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.config.resetTimeout;
    }
  }

  /**
   * Reset monitoring counters periodically
   */
  private startMonitoring() {
    setInterval(() => {
      if (this.state === CircuitState.CLOSED && this.failureCount > 0) {
        this.failureCount = 0; // Reset if stable
      }
    }, this.config.monitoringPeriod);
  }

  /**
   * Get circuit status
   */
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime) : null,
      nextAttemptTime: this.nextAttemptTime ? new Date(this.nextAttemptTime) : null,
    };
  }

  /**
   * Manually reset circuit
   */
  reset() {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    console.log(`🔄 CircuitBreaker [${this.name}] manually reset`);
  }
}

/**
 * Bulkhead Pattern
 *
 * PROBLEM: One slow endpoint can exhaust thread pool
 * - Other endpoints become slow
 * - Entire system degrades
 *
 * SOLUTION: Separate thread pools per resource
 * - Limit concurrent requests per endpoint
 * - One slow endpoint doesn't affect others
 */

export class Bulkhead {
  private activeRequests: number = 0;
  private queuedRequests: Array<() => void> = [];

  constructor(
    private name: string,
    private maxConcurrent: number = 10,
    private maxQueueSize: number = 100
  ) {}

  /**
   * Execute operation with bulkhead protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.activeRequests >= this.maxConcurrent) {
      if (this.queuedRequests.length >= this.maxQueueSize) {
        throw new Error(
          `Bulkhead [${this.name}] queue full. Max concurrent: ${this.maxConcurrent}`
        );
      }

      // Wait in queue
      await new Promise<void>(resolve => {
        this.queuedRequests.push(resolve);
      });
    }

    this.activeRequests++;

    try {
      return await operation();
    } finally {
      this.activeRequests--;

      // Process next in queue
      if (this.queuedRequests.length > 0) {
        const next = this.queuedRequests.shift();
        next?.();
      }
    }
  }

  /**
   * Get bulkhead status
   */
  getStatus() {
    return {
      name: this.name,
      activeRequests: this.activeRequests,
      maxConcurrent: this.maxConcurrent,
      queueLength: this.queuedRequests.length,
      maxQueueSize: this.maxQueueSize,
    };
  }
}

/**
 * Timeout wrapper
 *
 * PROBLEM: Requests can hang indefinitely
 * SOLUTION: Auto-fail after timeout
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = 30000,
  operationName: string = 'Operation'
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${operationName} timeout after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Retry with exponential backoff
 *
 * PROBLEM: Transient failures cause failures
 * SOLUTION: Retry with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelayMs: number = 100,
  operationName: string = 'Operation'
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Don't retry permanent errors
      if (error.statusCode === 400 || error.statusCode === 403 || error.statusCode === 404) {
        throw error;
      }

      if (attempt < maxAttempts) {
        const delay = initialDelayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error(`${operationName} failed after ${maxAttempts} attempts`);
}

/**
 * Create resilient operation with all protections
 */
export async function withResilience<T>(
  operation: () => Promise<T>,
  {
    circuitBreaker,
    bulkhead,
    timeoutMs = 30000,
    retryAttempts = 3,
    operationName = 'Operation',
  }: {
    circuitBreaker?: CircuitBreaker;
    bulkhead?: Bulkhead;
    timeoutMs?: number;
    retryAttempts?: number;
    operationName?: string;
  }
): Promise<T> {
  let wrappedOp = operation;

  // Apply timeout
  wrappedOp = () => withTimeout(wrappedOp, timeoutMs, operationName);

  // Apply retry
  wrappedOp = () => withRetry(wrappedOp, retryAttempts, 100, operationName);

  // Apply circuit breaker
  if (circuitBreaker) {
    wrappedOp = () => circuitBreaker.execute(wrappedOp);
  }

  // Apply bulkhead
  if (bulkhead) {
    wrappedOp = () => bulkhead.execute(wrappedOp);
  }

  return wrappedOp();
}
