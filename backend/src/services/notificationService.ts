import { User } from '../models/User';
import { Expense } from '../models/Expense';

export interface Notification {
  userId: string;
  type: 'budget_alert' | 'settlement_reminder' | 'recurring_expense' | 'bill_due';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

// In-memory store (in production, use database or message queue like Redis)
const notifications: Notification[] = [];

export class NotificationService {
  async sendBudgetAlert(userId: string, category: string, spent: number, limit: number) {
    const notification: Notification = {
      userId,
      type: 'budget_alert',
      title: `⚠️ Budget Alert: ${category}`,
      message: `You've spent ₹${spent} out of ₹${limit} budget for ${category}`,
      data: { category, spent, limit, percentage: (spent / limit) * 100 },
      read: false,
      createdAt: new Date(),
    };

    notifications.push(notification);
    console.log(`Budget alert sent to ${userId} for ${category}`);
    return notification;
  }

  async sendSettlementReminder(userId: string, fromUser: string, amount: number) {
    const notification: Notification = {
      userId,
      type: 'settlement_reminder',
      title: `💰 Settlement Reminder`,
      message: `Reminder: ${fromUser} owes you ₹${amount}`,
      data: { fromUser, amount },
      read: false,
      createdAt: new Date(),
    };

    notifications.push(notification);
    console.log(`Settlement reminder sent to ${userId}`);
    return notification;
  }

  async sendRecurringExpenseNotification(userId: string, expenseDescription: string, amount: number) {
    const notification: Notification = {
      userId,
      type: 'recurring_expense',
      title: `📅 Recurring Expense`,
      message: `Recurring expense created: ${expenseDescription} (₹${amount})`,
      data: { description: expenseDescription, amount },
      read: false,
      createdAt: new Date(),
    };

    notifications.push(notification);
    console.log(`Recurring expense notification sent to ${userId}`);
    return notification;
  }

  async sendBillDueReminder(userId: string, description: string, dueDate: Date) {
    const notification: Notification = {
      userId,
      type: 'bill_due',
      title: `📋 Bill Due Reminder`,
      message: `Bill due: ${description} on ${dueDate.toLocaleDateString()}`,
      data: { description, dueDate },
      read: false,
      createdAt: new Date(),
    };

    notifications.push(notification);
    console.log(`Bill reminder sent to ${userId}`);
    return notification;
  }

  async getUserNotifications(userId: string) {
    return notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 50); // Last 50 notifications
  }

  async markAsRead(notificationId: number) {
    if (notificationId >= 0 && notificationId < notifications.length) {
      notifications[notificationId].read = true;
    }
  }

  async clearNotifications(userId: string) {
    const index = notifications.findIndex(n => n.userId === userId);
    if (index > -1) {
      notifications.splice(index, 1);
    }
  }

  // Email notification stub (implement with SendGrid/AWS SES)
  async sendEmailNotification(
    email: string,
    subject: string,
    message: string,
    type: 'budget_alert' | 'settlement_reminder' | 'recurring_expense'
  ) {
    // TODO: Implement with email service (SendGrid, AWS SES, etc.)
    console.log(`Email to ${email}: ${subject}`);
    console.log(message);
  }
}

export const notificationService = new NotificationService();
