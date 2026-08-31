# Expense Tracker — Design System

Single source of truth for the "advanced" (dashboard/expenses/budgets/etc.)
theme: design tokens in `src/styles/global-advanced.css`, reusable React
wrappers in `src/components/ui/`.

Scope note: this covers the **authenticated app** (everything wrapped in
`AdvancedLayout` — Dashboard, Expenses, Budgets, Analytics, Family, Bill
Splitting, Export, Profile, Settings). `Login.tsx` / `Signup.tsx` use a
separate light-themed system in `src/index.css` and were intentionally left
untouched — see "Known gaps" at the end.

Everything below is **additive**: no existing CSS class was renamed or
removed, and no existing page was modified. Adopting the new pieces in a
page is opt-in.

---

## 1. Color system

Already defined in `:root` in `global-advanced.css` — use the variables, not
hard-coded hex:

| Token | Value | Use |
|---|---|---|
| `--primary` | `#667eea` | Primary actions, links, focus rings |
| `--secondary` | `#06b6d4` | Accents, secondary charts series |
| `--success` | `#10b981` | Positive states, "good" trends |
| `--warning` | `#f59e0b` | Caution states (e.g. budget near limit) |
| `--danger` | `#ef4444` | Destructive actions, errors, "bad" trends |
| `--bg-dark` | `#0f172a` | App background |
| `--bg-card` | `#1a202c` | Solid surfaces (modals, dropdowns) |
| `--text-primary` | `#f1f5f9` | Headings, primary body text |
| `--text-secondary` | `#cbd5e1` | Secondary text, labels |
| `--text-tertiary` | `#94a3b8` | Captions, placeholders |

The app also supports a **light theme** via `:root[data-theme="light"]`
(flipped by `ThemeContext` — see `src/contexts/ThemeContext.tsx`, not yet
wired into `App.tsx`). Every new component below reads these variables, so
it automatically follows whichever theme is active — never hard-code
`rgba(26, 32, 44, ...)` etc. in page-level code if you can use a token or an
existing class instead.

## 2. Spacing scale

New tokens, `--space-1` … `--space-10` (4px base unit), plus semantic
aliases matching the padding/gap values already used throughout the app:

```css
--padding-sm: 12px;  --padding-md: 16px;  --padding-lg: 20px;  --padding-xl: 24px;
--gap-sm: 8px;        --gap-md: 12px;      --gap-lg: 16px;
```

All new components (`stat-tile`, `chart-panel`, tabs, dropdown) use these
internally, so anything built with them is automatically consistent. For
one-off layout spacing (flex gaps, margins) in page code, Tailwind utilities
(`gap-4`, `mb-6`, …) are already configured project-wide — prefer those over
inventing new spacing classes.

## 3. Typography

Opt-in utility classes — **not** bare tag styles. Bare `h1`–`h4` are
deliberately left alone because `src/index.css` already sets global heading
styles for the light theme (Login/Signup), and many pages set heading size
via inline `style`; a global tag rule would either be silently overridden
(safe but pointless) or, on elements with only partial inline overrides,
change their rendered size (not safe). Apply the class directly instead:

```tsx
<h2 className="text-h2">Spending Overview</h2>
<p className="text-body-sm">Last updated 2 minutes ago</p>
```

| Class | Size | Weight |
|---|---|---|
| `.text-h1` | 2rem | 700 |
| `.text-h2` | 1.5rem | 700 |
| `.text-h3` | 1.25rem | 600 |
| `.text-h4` | 1.125rem | 600 |
| `.text-body` | 1rem | 400 |
| `.text-body-sm` | 0.875rem | 400 |
| `.text-caption` | 0.75rem | 500, uppercase |

Font-weight tokens: `--font-weight-medium: 500`, `--font-weight-semibold: 600`,
`--font-weight-bold: 700`.

## 4. Animations

Existing: `--transition: all 0.3s cubic-bezier(0.4,0,0.2,1)` pattern used
inline everywhere; keyframes `float`, `fadeIn`, `slideDown`, `spin`,
`modalPop`, `skeleton-shimmer`.

New motion tokens: `--transition-fast` (0.15s), `--transition-base` (0.3s),
`--transition-spring` (0.3s cubic-bezier), `--transition-slow` (0.5s).

New keyframe: `dsDropdownIn` (dropdown menu pop-in). Loading placeholders
should reuse the existing `.skeleton` class — don't add a second shimmer
animation.

---

## 5. Component library (`src/components/ui/`)

Import everything from one place:

```tsx
import { Card, Button, FormField, Input, StatCard, StatCardGrid, ChartCard, Tabs, TabPanel, Dropdown, Modal, ConfirmDialog } from '../components/ui';
```

### Card

Wraps `.glass-card`.

```tsx
<Card>...</Card>
<Card hoverable={false}>...</Card>   {/* disables the hover lift for dense grids */}
```

### Button

Wraps `.btn` + variant/size modifiers.

```tsx
<Button>Save</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="danger" size="sm" onClick={onDelete}>Delete</Button>
<Button variant="ghost" leftIcon="⚙️">Settings</Button>
<Button isLoading={isSaving} fullWidth>Save changes</Button>
```
`variant`: `primary | secondary | danger | ghost` · `size`: `sm | md | lg`

### Form fields

```tsx
<FormField label="Amount" required error={errors.amount?.message}>
  <Input type="number" invalid={!!errors.amount} {...register('amount')} />
</FormField>

<FormField label="Category">
  <Select {...register('category')}>
    <option value="food">Food</option>
  </Select>
</FormField>

<Checkbox label="Remember me" {...register('remember')} />
```

`Input` / `Select` / `Textarea` all forward refs, so they drop straight into
`react-hook-form`'s `register()` — same pattern already used across the app
(`BudgetModal.tsx`, `ExpenseModal.tsx`), just with the label/error wiring
handled for you.

### Modal / ConfirmDialog

Unchanged — re-exported from `../Modal` and `../ConfirmDialog` for
discoverability. Keep using them as-is:

```tsx
<Modal isOpen={open} onClose={close} title="Add Expense" size="md" footer={...}>...</Modal>
<ConfirmDialog isOpen={open} onClose={close} onConfirm={onDelete} tone="danger" message="Delete this expense?" />
```

### Dropdown

New — a click-to-open action menu (`.ds-dropdown*`).

```tsx
<Dropdown
  trigger={<button className="btn btn-icon btn-ghost">⋮</button>}
  items={[
    { key: 'edit', label: 'Edit', icon: '✏️', onSelect: () => openEdit(expense) },
    { key: 'delete', label: 'Delete', icon: '🗑️', danger: true, onSelect: () => confirmDelete(expense) },
  ]}
/>
```
Positioned absolutely relative to its trigger (not portaled) — if used near
a scrolling container's edge the menu can clip; portal it yourself for that
case.

### Tabs

New — replaces hand-rolled tab state + inline styles (e.g. the pattern in
`ProfilePage.tsx`) with one accessible component (`.ds-tabs-list` / `.ds-tab`,
roving-tabindex keyboard nav).

```tsx
const [activeTab, setActiveTab] = useState('personal');

<Tabs
  tabs={[
    { key: 'personal', label: 'Personal', icon: '👤' },
    { key: 'security', label: 'Security', icon: '🔒' },
  ]}
  activeKey={activeTab}
  onChange={setActiveTab}
/>
<TabPanel>{activeTab === 'personal' && <PersonalForm />}</TabPanel>
```

### StatCard / StatCardGrid

New — standardized KPI tile (`.stat-tile*`). Deliberately named `stat-tile`,
not `stat-card`, because `DashboardPro.css` / `DashboardBeautiful.css`
already define a page-scoped `.stat-card` — reusing that name would have
collided and changed those pages' existing look.

```tsx
<StatCardGrid>
  <StatCard label="Total Spent" value={formatCurrency(stats.totalSpent)} icon="💰"
    trend={{ direction: 'up', label: '8.2% vs last month', tone: 'negative' }} />
  <StatCard label="Transactions" value={stats.count} icon="🧾" />
</StatCardGrid>
```
`trend.tone` is caller-controlled (`positive | negative | neutral`) because
"up" isn't universally good or bad — spending up is bad, savings up is good.

### ChartCard

New — standardized recharts wrapper (`.chart-panel*`), same naming
rationale as StatCard (`DashboardPro.css` already owns `.chart-card`).

```tsx
<ChartCard title="Spending Trend" subtitle="Last 30 days" height={280}
  legend={<><ChartLegendItem color="#667eea" label="This month" /><ChartLegendItem color="#06b6d4" label="Last month" /></>}
  isEmpty={trend.length === 0}>
  <LineChart data={trend}>
    <Line dataKey="amount" stroke="var(--primary)" />
  </LineChart>
</ChartCard>
```

---

## 6. Migration notes / known gaps

- **Not retroactively applied.** Existing pages (`DashboardPro.tsx`,
  `ExpensesAdvanced.tsx`, `Budgets.tsx`, etc.) were left untouched. Adopt the
  new components page-by-page when you're already editing that page, rather
  than in one large sweep — lower risk, easier to review.
- **`DashboardPro.css` and `DashboardBeautiful.css` redefine `--secondary`
  differently** than `global-advanced.css` (`#764ba2` vs. the design spec's
  `#06b6d4`), and both already define their own `.stat-card` / `.chart-card`.
  That's a pre-existing inconsistency this change deliberately did **not**
  touch (fixing it means editing a live, routed page's CSS — do that as its
  own reviewed change, not bundled into a "add design system" commit). Use
  `StatCard`/`ChartCard` (`stat-tile`/`chart-panel`) for new work instead of
  copying the old `.stat-card` pattern, so new code isn't built on the
  inconsistent tokens.
- **`Login.tsx` / `Signup.tsx`** run on a fully separate light-theme system
  (`src/index.css`, Tailwind-based). Out of scope here.
- **`src/index.css` lines 1–3** use `@tailwindcss/base;` / `@tailwindcss/components;`
  / `@tailwindcss/utilities;` — not a real Tailwind directive (should be
  `@tailwind base;` etc.), and the production build already logs "Unknown at
  rule" for it. Pre-existing, unrelated to this change — flagging it because
  it means Tailwind's generated utility CSS may not actually be shipping,
  which would affect Login/Signup's Tailwind classes. Worth its own
  follow-up.
- **`ThemeContext.tsx`** (light/dark/system) exists fully built but isn't
  imported anywhere yet (no `ThemeProvider` in `App.tsx`). The light-theme
  CSS variables it targets are already in place. Wiring it up is a separate,
  small change.
