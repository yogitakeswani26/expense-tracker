import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows the shared .btn-spinner and disables the button while true. */
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * Standardized button — wraps the existing .btn / .btn-primary / .btn-secondary /
 * .btn-danger classes (styles/global-advanced.css) plus new size + ghost modifiers.
 *
 * Usage:
 *   <Button>Save</Button>
 *   <Button variant="danger" size="sm" onClick={onDelete}>Delete</Button>
 *   <Button variant="secondary" isLoading={isSaving}>Save changes</Button>
 *   <Button variant="ghost" leftIcon="⚙️">Settings</Button>
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size !== 'md' && `btn-${size}`,
    fullWidth && 'btn-block',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} disabled={disabled || isLoading} {...rest}>
      {isLoading ? <span className="btn-spinner" aria-hidden="true" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}
