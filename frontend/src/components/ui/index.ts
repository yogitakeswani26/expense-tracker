/**
 * Design system component library — barrel export.
 *
 * Import everything from one place:
 *   import { Card, Button, FormField, Input, Modal, StatCard } from '../components/ui';
 *
 * See frontend/DESIGN_SYSTEM.md for the full usage guide and the CSS tokens
 * these components are built on (styles/global-advanced.css).
 */

export { default as Card } from './Card';
export type { CardProps } from './Card';

export { default as Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { FormField, Input, Textarea, Select, Checkbox } from './FormField';
export type { FormFieldProps } from './FormField';

export { default as Dropdown } from './Dropdown';
export type { DropdownProps, DropdownItem } from './Dropdown';

export { Tabs, TabPanel, default as TabsDefault } from './Tabs';
export type { TabsProps, TabItem } from './Tabs';

export { default as StatCard, StatCardGrid } from './StatCard';
export type { StatCardProps, StatTrend } from './StatCard';

export { default as ChartCard, ChartLegendItem } from './ChartCard';
export type { ChartCardProps } from './ChartCard';

// Modal / ConfirmDialog already live in components/ (not components/ui) —
// re-exported here so the whole design system can be imported from one place.
export { default as Modal } from '../Modal';
export type { ModalProps, ModalSize } from '../Modal';

export { default as ConfirmDialog } from '../ConfirmDialog';
export type { ConfirmDialogProps } from '../ConfirmDialog';
