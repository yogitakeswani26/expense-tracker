import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Set false to disable the hover lift/glow (e.g. cards inside a dense grid). Defaults to true. */
  hoverable?: boolean;
  className?: string;
}

/**
 * Reusable glassmorphism card — the shared surface used across every
 * "advanced" page (dashboard, expenses, budgets, etc). Thin wrapper
 * around the existing `.glass-card` class from styles/global-advanced.css
 * so markup stays consistent without needing to remember the class name.
 *
 * Usage:
 *   <Card>...</Card>
 *   <Card hoverable={false} className="p-0">...</Card>
 */
export default function Card({ children, hoverable = true, className = '', ...rest }: CardProps) {
  const classes = ['glass-card', !hoverable && 'glass-card--static', className].filter(Boolean).join(' ');
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
