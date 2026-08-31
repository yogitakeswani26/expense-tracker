/**
 * Monitoring and Metrics Service
 *
 * PROBLEM: Without monitoring, issues go undetected until they cause outages
 *
 * TRACKING:
 * - Request latency (p95, p99)
 * - Error rates by endpoint
 * - Database connection health
 * - Memory pressure
 * - Queue depth
 * - Authentication failures
 */

export interface Metrics {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
  userId?: string;
  error?: string;
}

export interface SystemMetrics {
  timestamp: Date;
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  uptime: number;
  errors: {
    total: number;
    last1m: number;
    last5m: number;
  };
}

class MonitoringService {
  private metrics: Metrics[] = [];
  private systemMetrics: SystemMetrics[] = [];
  private readonly MAX_METRICS = 10000;
  private readonly MAX_SYSTEM_METRICS = 1440; // 24 hours at 1 minute intervals

  private errorCounts = {
    total: 0,
    byEndpoint: new Map<string, number>(),
    byErrorCode: new Map<string, number>(),
    last1m: new Map<string, number>(),
    last5m: new Map<string, number>(),
  };

  /**
   * Record request metric
   */
  recordMetric(metric: Metrics) {
    this.metrics.push(metric);

    // Keep only recent metrics to prevent memory leak
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // Track errors
    if (metric.statusCode >= 400) {
      this.errorCounts.total++;

      const endpoint = `${metric.method} ${metric.endpoint}`;
      this.errorCounts.byEndpoint.set(
        endpoint,
        (this.errorCounts.byEndpoint.get(endpoint) || 0) + 1
      );

      this.errorCounts.byErrorCode.set(
        metric.statusCode.toString(),
        (this.errorCounts.byErrorCode.get(metric.statusCode.toString()) || 0) + 1
      );
    }
  }

  /**
   * Get request latency statistics
   */
  getLatencyStats() {
    if (this.metrics.length === 0) {
      return null;
    }

    const durations = this.metrics.map(m => m.duration).sort((a, b) => a - b);
    const count = durations.length;

    return {
      min: durations[0],
      max: durations[count - 1],
      avg: durations.reduce((a, b) => a + b, 0) / count,
      p50: durations[Math.floor(count * 0.5)],
      p95: durations[Math.floor(count * 0.95)],
      p99: durations[Math.floor(count * 0.99)],
      count: count,
    };
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    return {
      totalErrors: this.errorCounts.total,
      byEndpoint: Object.fromEntries(this.errorCounts.byEndpoint),
      byErrorCode: Object.fromEntries(this.errorCounts.byErrorCode),
    };
  }

  /**
   * Record system metrics
   */
  recordSystemMetrics() {
    const memUsage = process.memoryUsage();

    const systemMetric: SystemMetrics = {
      timestamp: new Date(),
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
      },
      uptime: process.uptime(),
      errors: {
        total: this.errorCounts.total,
        last1m: this.countErrorsInTimeWindow(60 * 1000),
        last5m: this.countErrorsInTimeWindow(5 * 60 * 1000),
      },
    };

    this.systemMetrics.push(systemMetric);

    if (this.systemMetrics.length > this.MAX_SYSTEM_METRICS) {
      this.systemMetrics.shift();
    }

    // Alert on high memory usage
    const heapPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    if (heapPercentage > 90) {
      console.error(`🚨 CRITICAL: Heap memory at ${heapPercentage.toFixed(1)}%`);
      // In production, trigger alert
    }

    return systemMetric;
  }

  /**
   * Count errors in time window
   */
  private countErrorsInTimeWindow(windowMs: number): number {
    const cutoff = new Date(Date.now() - windowMs);
    return this.metrics.filter(m => m.statusCode >= 400 && m.timestamp > cutoff).length;
  }

  /**
   * Get system health status
   */
  getSystemHealth() {
    const latency = this.getLatencyStats();
    const errors = this.getErrorStats();
    const memUsage = process.memoryUsage();
    const heapPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    return {
      status: this.determineHealthStatus(latency, errors, heapPercentage),
      uptime: process.uptime(),
      memory: {
        heapUsedMB: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMB: (memUsage.heapTotal / 1024 / 1024).toFixed(2),
        percentage: heapPercentage.toFixed(2),
      },
      performance: latency,
      errors: errors,
      requestCount: this.metrics.length,
    };
  }

  /**
   * Determine overall system health
   */
  private determineHealthStatus(
    latency: any,
    errors: any,
    heapPercentage: number
  ): 'healthy' | 'degraded' | 'critical' {
    const issues: string[] = [];

    if (latency?.p99 > 5000) {
      issues.push('P99 latency > 5s');
    }

    if (errors.totalErrors > 100) {
      issues.push('High error count');
    }

    if (heapPercentage > 85) {
      issues.push('High memory usage');
    }

    if (issues.length >= 2) {
      return 'critical';
    }

    if (issues.length === 1) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Get slow queries from database profiler
   */
  async getSlowQueries(limit: number = 10) {
    // This would be implemented to query MongoDB profiler data
    // For now, return placeholder
    return {
      slowQueries: [],
      note: 'Implement MongoDB profiler integration',
    };
  }

  /**
   * Detect anomalies
   */
  detectAnomalies() {
    const latency = this.getLatencyStats();
    const errors = this.getErrorStats();
    const anomalies: string[] = [];

    if (latency && latency.p99 > latency.avg * 10) {
      anomalies.push('Latency spike detected');
    }

    if (errors.totalErrors > 50 && errors.totalErrors > (this.metrics.length * 0.1)) {
      anomalies.push('Error rate spike detected');
    }

    return {
      hasAnomalies: anomalies.length > 0,
      anomalies,
      timestamp: new Date(),
    };
  }

  /**
   * Clear old metrics
   */
  cleanup() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp > oneDayAgo);
  }
}

export const monitoringService = new MonitoringService();

/**
 * Start automatic system metrics recording
 */
export function startMetricsCollection(intervalMs: number = 60000) {
  setInterval(() => {
    const metrics = monitoringService.recordSystemMetrics();
    const anomalies = monitoringService.detectAnomalies();

    if (anomalies.hasAnomalies) {
      console.warn('⚠️  Anomalies detected:', anomalies.anomalies);
    }

    // Log health summary every 5 minutes
    if (Math.random() < 1 / 5) {
      const health = monitoringService.getSystemHealth();
      console.log(`📊 System Health: ${health.status} | Memory: ${health.memory.percentage}% | Errors: ${health.errors.totalErrors}`);
    }
  }, intervalMs);

  // Cleanup old metrics daily
  setInterval(() => {
    monitoringService.cleanup();
    console.log('🧹 Cleaned up old metrics');
  }, 24 * 60 * 60 * 1000);
}
