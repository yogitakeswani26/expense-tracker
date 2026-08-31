import mongoose, { Schema, Document } from 'mongoose';

/**
 * Audit Log Model
 *
 * Tracks all important state changes for compliance, debugging, and accountability
 *
 * USAGE:
 * const audit = new AuditLog({
 *   entityType: 'Expense',
 *   entityId: expenseId,
 *   action: 'CREATE',
 *   userId: userId,
 *   newValue: expenseData,
 *   ipAddress: req.ip,
 *   userAgent: req.headers['user-agent'],
 * });
 * await audit.save();
 */

export interface IAuditLogDoc extends Document {
  entityType: 'Expense' | 'Family' | 'Settlement' | 'User' | 'Category';
  entityId: mongoose.Types.ObjectId;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SETTLE';
  userId: mongoose.Types.ObjectId;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  ipAddress: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILURE';
  errorMessage?: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLogDoc>({
  entityType: {
    type: String,
    enum: ['Expense', 'Family', 'Settlement', 'User', 'Category'],
    required: true,
  },
  entityId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'SETTLE'],
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  oldValue: Schema.Types.Mixed,
  newValue: Schema.Types.Mixed,
  changes: [
    {
      field: String,
      oldValue: Schema.Types.Mixed,
      newValue: Schema.Types.Mixed,
    },
  ],
  ipAddress: {
    type: String,
    required: true,
  },
  userAgent: String,
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILURE'],
    default: 'SUCCESS',
  },
  errorMessage: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Indexes for efficient querying
auditLogSchema.index({ entityType: 1, entityId: 1 }); // Find all audits for entity
auditLogSchema.index({ userId: 1, timestamp: -1 }); // User's actions
auditLogSchema.index({ timestamp: -1 }); // Recent actions
auditLogSchema.index({ action: 1, status: 1 }); // Actions by type

// Create TTL index to auto-delete audit logs after 2 years
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

export const AuditLog = mongoose.model<IAuditLogDoc>('AuditLog', auditLogSchema);

/**
 * Audit Log Service
 */
export class AuditLogService {
  /**
   * Log a change to an entity
   */
  static async logChange(
    entityType: string,
    entityId: mongoose.Types.ObjectId,
    action: string,
    userId: mongoose.Types.ObjectId,
    oldValue: any,
    newValue: any,
    ipAddress: string,
    userAgent?: string
  ) {
    try {
      // Calculate specific field changes
      const changes = this.calculateChanges(oldValue, newValue);

      const log = new AuditLog({
        entityType,
        entityId,
        action,
        userId,
        oldValue: action === 'DELETE' ? oldValue : undefined,
        newValue: action === 'CREATE' ? newValue : undefined,
        changes,
        ipAddress,
        userAgent,
        status: 'SUCCESS',
      });

      await log.save();
    } catch (error) {
      console.error('Failed to log audit:', error);
      // Don't throw - audit logging failure shouldn't break the operation
    }
  }

  /**
   * Calculate which fields changed
   */
  private static calculateChanges(
    oldValue: any,
    newValue: any
  ): Array<{ field: string; oldValue: any; newValue: any }> {
    if (!oldValue) return [];

    const changes = [];

    for (const key in newValue) {
      if (JSON.stringify(oldValue[key]) !== JSON.stringify(newValue[key])) {
        changes.push({
          field: key,
          oldValue: oldValue[key],
          newValue: newValue[key],
        });
      }
    }

    return changes;
  }

  /**
   * Get entity history
   */
  static async getEntityHistory(entityType: string, entityId: mongoose.Types.ObjectId) {
    const query: any = { entityType, entityId };
    return AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(100)
      .exec();
  }

  /**
   * Get user actions
   */
  static async getUserActions(userId: mongoose.Types.ObjectId, limit: number = 50) {
    return AuditLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit);
  }

  /**
   * Detect suspicious activity
   */
  static async detectSuspiciousActivity(userId: mongoose.Types.ObjectId, hours: number = 24) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    const logs = await AuditLog.find({
      userId,
      timestamp: { $gte: cutoff },
    });

    // Check for suspicious patterns
    const deleteCounts = logs.filter(l => l.action === 'DELETE').length;
    const failureCounts = logs.filter(l => l.status === 'FAILURE').length;

    const suspicious = [];

    if (deleteCounts > 10) {
      suspicious.push(`${deleteCounts} deletions in last ${hours} hours`);
    }

    if (failureCounts > 20) {
      suspicious.push(`${failureCounts} failed operations`);
    }

    // Check for activity from unusual locations
    const uniqueIPs = new Set(logs.map(l => l.ipAddress));
    if (uniqueIPs.size > 5) {
      suspicious.push(`${uniqueIPs.size} different IP addresses`);
    }

    return {
      suspicious: suspicious.length > 0,
      issues: suspicious,
      actionCount: logs.length,
    };
  }
}
