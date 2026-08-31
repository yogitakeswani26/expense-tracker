import type { CSSProperties } from 'react';

/**
 * Loading Skeleton Components
 * ----------------------------------------------------------------------------
 * Shimmering placeholders shown while a page's data is `isLoading`. Built from
 * one primitive (`Skeleton`) plus page-shaped compositions so every screen's
 * loading state matches its loaded layout (glass-card / stat-card / table).
 *
 * Requires the `.skeleton` + `@keyframes skeleton-shimmer` rules appended to
 * `styles/global-advanced.css` (already added alongside this file).
 *
 * Integration points
 * ----------------------------------------------------------------------------
 *   const { data, isLoading } = useExpenses(familyId);
 *   if (isLoading) return <ExpensesSkeleton />;
 *
 *   const { data, isLoading } = useBudgets(familyId);
 *   if (isLoading) return <BudgetsSkeleton />;
 *
 *   {isLoading ? <DashboardSkeleton /> : <DashboardContent data={data} />}
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  /** 'text' = small radius, 'circle' = fully round, 'rect' = card/box radius. */
  variant?: 'text' | 'circle' | 'rect';
  className?: string;
  style?: CSSProperties;
}

/** Single shimmering placeholder block. Base primitive for every skeleton below. */
export function Skeleton({ width = '100%', height = 16, variant = 'text', className = '', style }: SkeletonProps) {
  const radius = variant === 'circle' ? '50%' : variant === 'rect' ? '12px' : '6px';
  return (
    <span
      aria-hidden="true"
      className={`skeleton ${className}`}
      style={{
        display: 'block',
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}

/** A stack of skeleton text lines, last line shortened for a natural paragraph look. */
export function SkeletonText({ lines = 3, lastLineWidth = '60%' }: { lines?: number; lastLineWidth?: string | number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={12} width={i === lines - 1 ? lastLineWidth : '100%'} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composed building blocks
// ---------------------------------------------------------------------------

/** Mirrors `.stat-card` / `.premium-card` used on the Dashboard. */
export function StatCardSkeleton() {
  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Skeleton variant="circle" width={36} height={36} />
        <Skeleton height={12} width="50%" />
      </div>
      <Skeleton height={30} width="70%" style={{ marginBottom: '10px' }} />
      <Skeleton height={10} width="40%" />
    </div>
  );
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '30px',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Mirrors `.chart-card.glass-card`. */
export function ChartCardSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div className="chart-card glass-card" style={{ padding: '20px' }}>
      <Skeleton height={14} width="35%" style={{ marginBottom: '20px' }} />
      <Skeleton variant="rect" height={height} />
    </div>
  );
}

/** Generic N-column, N-row table skeleton — used by Expenses/Budgets list views. */
export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="table-container" style={{ padding: '4px' }}>
      <table style={{ width: '100%' }}>
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, c) => (
              <th key={c} style={{ padding: '12px' }}>
                <Skeleton height={10} width="70%" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c} style={{ padding: '14px 12px' }}>
                  <Skeleton height={12} width={c === 0 ? '85%' : '55%'} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Row-of-cards list skeleton — used by Budgets grid, Family member list, etc. */
export function ListSkeleton({ items = 4 }: { items?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="glass-card"
          style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}
        >
          <Skeleton variant="circle" width={40} height={40} />
          <div style={{ flex: 1 }}>
            <Skeleton height={12} width="40%" style={{ marginBottom: '8px' }} />
            <Skeleton height={10} width="65%" />
          </div>
          <Skeleton height={20} width={70} variant="rect" />
        </div>
      ))}
    </div>
  );
}

/** Grid-of-cards skeleton — mirrors the Budgets page's `minmax(320px, 1fr)` grid. */
export function CardGridSkeleton({ count = 6, minWidth = 320 }: { count?: number; minWidth?: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`,
        gap: '20px',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Skeleton variant="circle" width={32} height={32} />
              <Skeleton height={12} width={100} />
            </div>
            <Skeleton height={18} width={70} variant="rect" />
          </div>
          <Skeleton height={10} width="100%" style={{ marginBottom: '10px' }} />
          <Skeleton height={10} width="80%" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page-level compositions (drop-in replacements for `isLoading` branches)
// ---------------------------------------------------------------------------

/** For the page header row (`.page-header`). Optional — most pages keep the real header static. */
export function PageHeaderSkeleton() {
  return (
    <div className="page-header">
      <Skeleton height={28} width={260} style={{ marginBottom: '10px' }} />
      <Skeleton height={14} width={360} />
    </div>
  );
}

/** Full Dashboard page skeleton: stat cards + chart grid + recent transactions list. */
export function DashboardSkeleton() {
  return (
    <div>
      <StatCardsSkeleton count={4} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
          marginBottom: '30px',
        }}
      >
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
      <ListSkeleton items={5} />
    </div>
  );
}

/** Full Expenses list page skeleton: filter bar placeholder + table. */
export function ExpensesSkeleton() {
  return (
    <div>
      <div className="glass-card" style={{ marginBottom: '30px', padding: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Skeleton height={38} width={200} variant="rect" />
          <Skeleton height={38} width={160} variant="rect" />
          <Skeleton height={38} width={160} variant="rect" />
        </div>
      </div>
      <div className="glass-card">
        <TableSkeleton rows={8} columns={6} />
      </div>
    </div>
  );
}

/** Full Budgets page skeleton: stat row + card grid. */
export function BudgetsSkeleton() {
  return (
    <div>
      <StatCardsSkeleton count={4} />
      <CardGridSkeleton count={6} />
    </div>
  );
}

/** Full Analytics page skeleton: two-column chart grid. */
export function AnalyticsSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '20px',
      }}
    >
      <ChartCardSkeleton height={300} />
      <ChartCardSkeleton height={300} />
      <ChartCardSkeleton height={220} />
      <ChartCardSkeleton height={220} />
    </div>
  );
}

/** Settings / Profile-style form skeleton. */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="glass-card" style={{ padding: '32px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i}>
            <Skeleton height={12} width={120} style={{ marginBottom: '8px' }} />
            <Skeleton height={40} width="100%" variant="rect" />
          </div>
        ))}
        <Skeleton height={44} width="100%" variant="rect" />
      </div>
    </div>
  );
}

/** Generic full-page centered spinner — for tiny/unpredictable-shape views. */
export function PageSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
        padding: '80px 20px',
        color: 'var(--text-secondary, #cbd5e1)',
      }}
    >
      <span className="btn-spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
      <span style={{ fontSize: '0.9rem' }}>{label}</span>
    </div>
  );
}
