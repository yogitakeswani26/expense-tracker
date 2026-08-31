import React, { useId, useRef } from 'react';

export interface TabItem {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

/**
 * Controlled tab strip — standardizes the ad-hoc tab UI that used to be
 * hand-rolled per page (inline styles + local activeTab state). Built on
 * the .ds-tabs-list / .ds-tab classes (styles/global-advanced.css) with
 * roving-tabindex keyboard navigation (Left/Right/Home/End) per the WAI-ARIA
 * tabs pattern.
 *
 * Usage:
 *   const [activeTab, setActiveTab] = useState('personal');
 *   <Tabs
 *     tabs={[
 *       { key: 'personal', label: 'Personal', icon: '👤' },
 *       { key: 'security', label: 'Security', icon: '🔒' },
 *     ]}
 *     activeKey={activeTab}
 *     onChange={setActiveTab}
 *   />
 *   <TabPanel>{activeTab === 'personal' && <PersonalForm />}</TabPanel>
 */
export function Tabs({ tabs, activeKey, onChange, className = '' }: TabsProps) {
  const groupId = useId();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const enabledTabs = tabs.filter(t => !t.disabled);

  const focusAndSelect = (key: string) => {
    onChange(key);
    tabRefs.current[key]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();

    const currentEnabledIndex = enabledTabs.findIndex(t => t.key === tabs[index].key);
    let nextIndex = currentEnabledIndex;

    if (e.key === 'ArrowRight') nextIndex = (currentEnabledIndex + 1) % enabledTabs.length;
    else if (e.key === 'ArrowLeft') nextIndex = (currentEnabledIndex - 1 + enabledTabs.length) % enabledTabs.length;
    else if (e.key === 'Home') nextIndex = 0;
    else if (e.key === 'End') nextIndex = enabledTabs.length - 1;

    const next = enabledTabs[nextIndex];
    if (next) focusAndSelect(next.key);
  };

  return (
    <div className={`ds-tabs-list ${className}`.trim()} role="tablist">
      {tabs.map((tab, index) => (
        <button
          key={tab.key}
          ref={el => {
            tabRefs.current[tab.key] = el;
          }}
          type="button"
          role="tab"
          id={`${groupId}-tab-${tab.key}`}
          aria-selected={activeKey === tab.key}
          aria-controls={`${groupId}-panel-${tab.key}`}
          tabIndex={activeKey === tab.key ? 0 : -1}
          disabled={tab.disabled}
          className={`ds-tab ${activeKey === tab.key ? 'active' : ''}`.trim()}
          onClick={() => onChange(tab.key)}
          onKeyDown={e => handleKeyDown(e, index)}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/** Fade-in wrapper for tab content — pair with the currently active tab's panel. */
export function TabPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`ds-tab-panel ${className}`.trim()} role="tabpanel">
      {children}
    </div>
  );
}

export default Tabs;
