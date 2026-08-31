import { getStatusColor } from '../utils/helpers';

interface BudgetProgressBarProps {
  spent: number;
  limit: number;
  percentage: number;
  status: 'ok' | 'warning' | 'exceeded';
  height?: number;
}

/** Reusable spend-vs-limit progress bar shared by the Budgets page and dashboard widget. */
export default function BudgetProgressBar({ spent, limit, percentage, status, height = 8 }: BudgetProgressBarProps) {
  const color = getStatusColor(status);
  const width = limit > 0 ? Math.min(Math.max(percentage, 0), 100) : 0;

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${Math.round(percentage)}% of budget spent`}
      title={`${formatShort(spent)} of ${formatShort(limit)} (${percentage.toFixed(0)}%)`}
      style={{
        width: '100%',
        height,
        borderRadius: height,
        background: 'rgba(148, 163, 184, 0.18)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${width}%`,
          height: '100%',
          borderRadius: height,
          background: color,
          transition: 'width 0.4s ease, background 0.3s ease',
        }}
      />
    </div>
  );
}

function formatShort(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`;
}
