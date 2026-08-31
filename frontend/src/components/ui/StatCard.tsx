import React from 'react';

export interface StatTrend {
  direction: 'up' | 'down' | 'flat';
  /** Text shown next to the arrow, e.g. "12.4% vs last month" */
  label: string;
  /**
   * Color semantics — the caller decides whether "up" is good or bad for
   * this particular metric (e.g. spending up = negative, savings up = positive).
   * Defaults to 'neutral'.
   */
  tone?: 'positive' | 'negative' | 'neutral';
}

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  trend?: StatTrend;
  className?: string;
}

const TREND_ARROW: Record<StatTrend['direction'], string> = {
  up: '▲',
  down: '▼',
  flat: '→',
};

/**
 * Standardized KPI tile — label, big value, optional icon and trend line.
 * Built on the .stat-tile* classes (styles/global-advanced.css). Pair with
 * <StatCardGrid> for the responsive auto-fit layout.
 *
 * Usage:
 *   <StatCardGrid>
 *     <StatCard label="Total Spent" value={formatCurrency(stats.totalSpent)} icon="💰"
 *       trend={{ direction: 'up', label: '8.2% vs last month', tone: 'negative' }} />
 *     <StatCard label="Transactions" value={stats.count} icon="🧾" />
 *   </StatCardGrid>
 */
export default function StatCard({ label, value, icon, trend, className = '' }: StatCardProps) {
  return (
    <div className={`stat-tile ${className}`.trim()}>
      <div className="stat-tile-top">
        <span className="stat-tile-label">{label}</span>
        {icon && <span className="stat-tile-icon" aria-hidden="true">{icon}</span>}
      </div>
      <span className="stat-tile-value">{value}</span>
      {trend && (
        <span className={`stat-tile-trend ${trend.tone ?? 'neutral'}`}>
          <span aria-hidden="true">{TREND_ARROW[trend.direction]}</span>
          {trend.label}
        </span>
      )}
    </div>
  );
}

/** Responsive auto-fit grid for a row of <StatCard>s. */
export function StatCardGrid({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`stat-tile-grid ${className}`.trim()}>{children}</div>;
}
