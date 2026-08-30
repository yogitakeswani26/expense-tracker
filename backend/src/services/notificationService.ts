export interface Notification {
  id: string;
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
      id: `${userId}-${Date.now()}-${Math.random()}`,
      userId,
      type: 'budget_alert',
      title: `⚠️ Budget Alert: ${category}`,
      message: `You've spent ₹${spent} out of ₹${limit} budget for ${category}`,
      data: { category, spent, limit, percentage: (spent / limit) * 100 },
      read: false,
      createdAt: new Date(),
    };

    notifications.push(notification);
    return notification;
  }

  async sendSettlementReminder(userId: string, fromUser: string, amount: number) {
    const notification: Notification = {
      id: `${userId}-${Date.now()}-${Math.random()}`,
      userId,
      type: 'settlement_reminder',
      title: `💰 Settlement Reminder`,
      message: `Reminder: ${fromUser} owes you ₹${amount}`,
      data: { fromUser, amount },
      read: false,
      createdAt: new Date(),
    };

    notifications.push(notification);
    return notification;
  }

  async sendRecurringExpenseNotification(userId: string, expenseDescription: string, amount: number) {
    const notification: Notification = {
      id: `${userId}-${Date.now()}-${Math.random()}`,
      userId,
      type: 'recurring_expense',
      title: `📅 Recurring Expense`,
      message: `Recurring expense created: ${expenseDescription} (₹${amount})`,
      data: { description: expenseDescription, amount },
      read: false,
      createdAt: new Date(),
    };

    notifications.push(notification);
    return notification;
  }

  async sendBillDueReminder(userId: string, description: string, dueDate: Date) {
    const notification: Notification = {
      id: `${userId}-${Date.now()}-${Math.random()}`,
      userId,
      type: 'bill_due',
      title: `📋 Bill Due Reminder`,
      message: `Bill due: ${description} on ${dueDate.toLocaleDateString()}`,
      data: { description, dueDate },
      read: false,
      createdAt: new Date(),
    };

    notifications.push(notification);
    return notification;
  }

  async getUserNotifications(userId: string) {
    return notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 50); // Last 50 notifications
  }

  async markAsRead(notificationId: string) {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  async clearNotifications(userId: string) {
    // Remove ALL notifications for the user
    const beforeLength = notifications.length;
    const filtered = notifications.filter(n => n.userId !== userId);
    const afterLength = filtered.length;
    // Replace the array
    notifications.splice(0, notifications.length, ...filtered);
  }

  // Email notification stub (implement with SendGrid/AWS SES)
  async sendEmailNotification(
    email: string,
    subject: string,
    message: string,
    _type: 'budget_alert' | 'settlement_reminder' | 'recurring_expense'
  ) {
    // TODO: Implement with email service (SendGrid, AWS SES, etc.)
    console.log(`Email to ${email}: ${subject}`);
    console.log(message);
  }
}

export const notificationService = new NotificationService();
