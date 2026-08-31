import { useNavigate } from 'react-router-dom';
import { useBudgetAlerts } from '../hooks/useBudgets';
import BudgetProgressBar from './BudgetProgressBar';
import { formatCurrency } from '../utils/helpers';
import { getCategoryEmoji } from '../utils/categoryEmojis';

interface BudgetAlertBannerProps {
  familyId: string;
}

/**
 * Compact budget-vs-actual overview + over-budget alerts for the dashboard.
 * Silently renders nothing while loading or if the request fails, so it never
 * blocks the rest of the dashboard from rendering.
 */
export default function BudgetAlertBanner({ familyId }: BudgetAlertBannerProps) {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useBudgetAlerts(familyId);

  if (!familyId || isLoading || isError) return null;

  if (!data || data.totalBudgets === 0) {
    return (
      <div className="glass-card" style={{ padding: '20px', marginBottom: '30px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 4px 0' }}>🎯 Budgets</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              You haven't set up any budgets yet. Set spending limits to stay on track.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/budgets')}>
            🎯 Create Budget
          </button>
        </div>
      </div>
    );
  }

  const { alerts, exceededCount, warningCount, totalBudgets, totalLimit, totalSpent } = data;
  const hasAlerts = exceededCount > 0 || warningCount > 0;

  return (
    <div className="glass-card" style={{ padding: '20px', marginBottom: '30px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: hasAlerts ? '16px' : 0,
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 4px 0' }}>
            🎯 Budget Overview
            {exceededCount > 0 && (
              <span
                style={{
                  marginLeft: '10px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#fff',
                  background: '#ef4444',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  verticalAlign: 'middle',
                }}
              >
                {exceededCount} OVER BUDGET
              </span>
            )}
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {formatCurrency(totalSpent)} of {formatCurrency(totalLimit)} spent across {totalBudgets} budget
            {totalBudgets === 1 ? '' : 's'}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/budgets')}>
          Manage Budgets →
        </button>
      </div>

      {hasAlerts ? (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {alerts.slice(0, 4).map((b) => (
            <div
              key={b._id}
              style={{
                flex: '1 1 220px',
                minWidth: '220px',
                padding: '14px',
                borderRadius: '12px',
                background: b.status === 'exceeded' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                border: `1px solid ${
                  b.status === 'exceeded' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'
                }`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                  gap: '8px',
                }}
              >
                <span style={{ fontWeight: 600 }}>
                  {getCategoryEmoji(b.category)} {b.category}
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: b.status === 'exceeded' ? '#ef4444' : '#f59e0b',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {b.status === 'exceeded' ? '⚠️ OVER BUDGET' : '⚡ NEAR LIMIT'}
                </span>
              </div>
              <BudgetProgressBar spent={b.spent} limit={b.limit} percentage={b.percentage} status={b.status} />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  marginTop: '6px',
                }}
              >
                <span>
                  {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                </span>
                <span>{b.percentage.toFixed(0)}%</span>
              </div>
            </div>
          ))}
          {alerts.length > 4 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '120px',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
              }}
            >
              +{alerts.length - 4} more →
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
