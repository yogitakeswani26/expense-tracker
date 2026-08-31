import React, { useEffect, useRef, useState } from 'react';

export interface DropdownItem {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  onSelect?: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export interface DropdownProps {
  /** Trigger element, e.g. a <Button> or icon button. Receives no props — wrap your own onClick isn't needed, the Dropdown handles opening. */
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

/**
 * Lightweight action menu — click the trigger to reveal a list of items.
 * Closes on outside click, Escape, or item select. Built on the
 * .ds-dropdown* classes (styles/global-advanced.css).
 *
 * Note: positioned via `position: absolute` relative to the trigger, not a
 * portal — if you place it inside a container with `overflow: hidden` /
 * `overflow-y: auto` near a viewport edge, the menu can get clipped.
 *
 * Usage:
 *   <Dropdown
 *     trigger={<button className="btn btn-icon btn-ghost">⋮</button>}
 *     items={[
 *       { key: 'edit', label: 'Edit', icon: '✏️', onSelect: () => openEdit(expense) },
 *       { key: 'delete', label: 'Delete', icon: '🗑️', danger: true, onSelect: () => confirmDelete(expense) },
 *     ]}
 *   />
 */
export default function Dropdown({ trigger, items, align = 'right', className = '' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className={`ds-dropdown ${className}`.trim()} ref={containerRef}>
      <span className="ds-dropdown-trigger" onClick={() => setOpen(o => !o)}>
        {trigger}
      </span>

      {open && (
        <div className={`ds-dropdown-menu ${align === 'left' ? 'align-left' : ''}`.trim()} role="menu">
          {items.map(item => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              className={`ds-dropdown-item ${item.danger ? 'danger' : ''}`.trim()}
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onSelect?.();
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
