import React, { forwardRef, useId } from 'react';

export interface FormFieldProps {
  label?: React.ReactNode;
  /** Associates the label with a control. Auto-generated if the control doesn't pass its own id. */
  htmlFor?: string;
  error?: string;
  hint?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Label + control + error/hint wrapper around the existing .form-group /
 * .form-label / .form-error classes. Pairs with the <Input>, <Select>, and
 * <Textarea> primitives below (or any custom control).
 *
 * Usage:
 *   <FormField label="Amount" required error={errors.amount?.message}>
 *     <Input type="number" invalid={!!errors.amount} {...register('amount')} />
 *   </FormField>
 */
export function FormField({ label, htmlFor, error, hint, required, children, className = '' }: FormFieldProps) {
  const generatedId = useId();
  const fieldId = htmlFor ?? generatedId;

  return (
    <div className={`form-group ${className}`.trim()}>
      {label && (
        <label htmlFor={fieldId} className="form-label">
          {label}
          {required && <span className="form-required"> *</span>}
        </label>
      )}
      {children}
      {hint && !error && <span className="form-hint">{hint}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

/** Styled <input>, forwards ref so it works directly with react-hook-form's register(). */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = '', invalid = false, ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      className={`form-input ${invalid ? 'form-input-invalid' : ''} ${className}`.trim()}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
});

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };

/** Styled <textarea>, forwards ref so it works directly with react-hook-form's register(). */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className = '', invalid = false, ...rest },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={`form-textarea ${invalid ? 'form-input-invalid' : ''} ${className}`.trim()}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
});

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean };

/** Styled <select>, forwards ref so it works directly with react-hook-form's register(). */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className = '', invalid = false, children, ...rest },
  ref
) {
  return (
    <select
      ref={ref}
      className={`form-select ${invalid ? 'form-input-invalid' : ''} ${className}`.trim()}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {children}
    </select>
  );
});

/** Styled checkbox + inline label, built on the .checkbox-field class. */
export const Checkbox = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }>(
  function Checkbox({ label, className = '', ...rest }, ref) {
    return (
      <label className={`checkbox-field ${className}`.trim()}>
        <input ref={ref} type="checkbox" {...rest} />
        {label}
      </label>
    );
  }
);
