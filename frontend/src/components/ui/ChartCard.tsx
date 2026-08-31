import React from 'react';
import { ResponsiveContainer } from 'recharts';

export interface ChartCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Right-aligned slot for a period selector, export button, etc. */
  actions?: React.ReactNode;
  /** Chart area height in px. Defaults to 300. */
  height?: number;
  /** Optional legend row rendered below the chart — pair with <ChartLegendItem>. */
  legend?: React.ReactNode;
  isEmpty?: boolean;
  emptyState?: React.ReactNode;
  /** A single recharts chart element, e.g. <LineChart data={...}>...</LineChart> */
  children: React.ReactElement;
  className?: string;
}

/**
 * Standardized wrapper for recharts charts — header (title/subtitle/actions),
 * a sized body that hosts recharts' own <ResponsiveContainer>, and an
 * optional legend row. Built on the .chart-panel* classes
 * (styles/global-advanced.css).
 *
 * Usage:
 *   <ChartCard title="Spending Trend" subtitle="Last 30 days" height={280}>
 *     <LineChart data={trend}>
 *       <Line dataKey="amount" stroke="var(--primary)" />
 *     </LineChart>
 *   </ChartCard>
 */
export default function ChartCard({
  title,
  subtitle,
  actions,
  height = 300,
  legend,
  isEmpty = false,
  emptyState,
  children,
  className = '',
}: ChartCardProps) {
  return (
    <div className={`chart-panel ${className}`.trim()}>
      <div className="chart-panel-header">
        <div>
          <h3 className="chart-panel-title">{title}</h3>
          {subtitle && <div className="chart-panel-subtitle">{subtitle}</div>}
        </div>
        {actions && <div className="chart-panel-actions">{actions}</div>}
      </div>

      <div className="chart-panel-body" style={{ height }}>
        {isEmpty ? (
          <div className="chart-panel-empty">
            {emptyState ?? (
              <>
                <span style={{ fontSize: '2rem' }} aria-hidden="true">📉</span>
                <span>No data yet</span>
              </>
            )}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        )}
      </div>

      {legend && <div className="chart-panel-legend">{legend}</div>}
    </div>
  );
}

/** One dot + label entry for a <ChartCard legend={...}> row. */
export function ChartLegendItem({ color, label }: { color: string; label: React.ReactNode }) {
  return (
    <span className="chart-panel-legend-item">
      <span className="chart-panel-legend-dot" style={{ background: color }} aria-hidden="true" />
      {label}
    </span>
  );
}
