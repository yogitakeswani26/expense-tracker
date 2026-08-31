/**
 * smartNotificationService.ts
 * ---------------------------------------------------------------------------
 * FEATURE 4 (Automation): Smart notifications
 *
 * A separate, additive notification stream for AI-driven alerts (savings
 * opportunities, anomalies, settlement nudges, newly detected recurring
 * charges). Deliberately kept as its own service/store rather than editing
 * services/notificationService.ts, so nothing about the existing
 * budget/settlement/recurring notification flow changes.
 *
 * Uses the same in-memory-store pattern as notificationService.ts for
 * consistency; swap for Redis/DB-backed storage in production exactly like
 * that file's own top comment recommends.
 */

import { expenseOptimizationService } from './expenseOptimizationService';
import { smartRecommendationService } from './smartRecommendationService';

export interface SmartNotification {
  id: string;
  familyId: string;
  userId?: string;
  type: 'savings_opportunity' | 'anomaly_alert' | 'settlement_suggestion' | 'recurring_detected' | 'budget_forecast';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

const store: SmartNotification[] = [];

export class SmartNotificationService {
  private push(n: Omit<SmartNotification, 'id' | 'read' | 'createdAt'>): SmartNotification {
    const notification: SmartNotification = {
      ...n,
      id: `${n.familyId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      read: false,
      createdAt: new Date(),
    };
    store.push(notification);
    return notification;
  }

  notifySavingsOpportunity(familyId: string, title: string, message: string, data?: any) {
    return this.push({ familyId, type: 'savings_opportunity', title, message, data });
  }

  notifyAnomaly(familyId: string, title: string, message: string, data?: any) {
    return this.push({ familyId, type: 'anomaly_alert', title, message, data });
  }

  notifySettlementSuggestion(familyId: string, userId: string, title: string, message: string, data?: any) {
    return this.push({ familyId, userId, type: 'settlement_suggestion', title, message, data });
  }

  notifyRecurringDetected(familyId: string, title: string, message: string, data?: any) {
    return this.push({ familyId, type: 'recurring_detected', title, message, data });
  }

  notifyBudgetForecast(familyId: string, title: string, message: string, data?: any) {
    return this.push({ familyId, type: 'budget_forecast', title, message, data });
  }

  /**
   * Runs every AI detector for a family and raises notifications for
   * anything actionable. Designed to be triggered from a cron / scheduled
   * job (see POST /:familyId/checks/run in automation.routes.ts) — cheap
   * enough to run daily for a family-sized dataset.
   */
  async runSmartChecks(familyId: string): Promise<SmartNotification[]> {
    const created: SmartNotification[] = [];

    const opportunities = await expenseOptimizationService.identifySavingsOpportunities(familyId);
    for (const o of opportunities.filter((o) => o.confidence >= 0.6).slice(0, 3)) {
      created.push(this.notifySavingsOpportunity(familyId, o.title, o.detail, o));
    }

    const { expenseAnomalies } = await smartRecommendationService.detectAnomalies(familyId);
    for (const a of expenseAnomalies.filter((a: any) => a.severity !== 'low').slice(0, 5)) {
      created.push(this.notifyAnomaly(familyId, `Unusual expense in ${a.category}`, a.message, a));
    }

    const recurring = await expenseOptimizationService.detectRecurringCandidates(familyId);
    for (const r of recurring.filter((r) => r.confidence >= 0.7).slice(0, 3)) {
      created.push(
        this.notifyRecurringDetected(
          familyId,
          `Possible recurring charge: ${r.description}`,
          `Seen ${r.occurrences}x, ~₹${r.avgAmount} every ${Math.round(r.avgIntervalDays)} days.`,
          r
        )
      );
    }

    return created;
  }

  getForFamily(familyId: string, limit = 50) {
    return store
      .filter((n) => n.familyId === familyId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  markAsRead(notificationId: string) {
    const n = store.find((x) => x.id === notificationId);
    if (n) n.read = true;
    return n;
  }
}

export const smartNotificationService = new SmartNotificationService();
