import { useId, useRef, useState, type ReactNode } from 'react';

export interface InspectorTabDefinition {
  id: string;
  label: string;
  content: ReactNode;
}

export function InspectorTabs({ label, tabs }: { label: string; tabs: readonly InspectorTabDefinition[] }) {
  const tabId = useId();
  const tabButtonRefs = useRef<Partial<Record<string, HTMLButtonElement>>>({});
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? '');
  const activeTabDefinition = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  if (!activeTabDefinition) return null;

  return (
    <div className="inspector-tabbed-section">
      <div className="inspector-tabs" role="tablist" aria-label={`${label} sections`}>
        {tabs.map((tab, index) => {
          const tabPanelId = `${tabId}-${tab.id}-panel`;
          const buttonId = `${tabId}-${tab.id}-tab`;

          return (
            <button
              key={tab.id}
              ref={(button) => {
                if (button) tabButtonRefs.current[tab.id] = button;
              }}
              type="button"
              id={buttonId}
              className="inspector-tab"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={tabPanelId}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => {
                const nextIndex = event.key === 'ArrowRight' || event.key === 'ArrowDown'
                  ? (index + 1) % tabs.length
                  : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
                    ? (index - 1 + tabs.length) % tabs.length
                    : event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? tabs.length - 1
                        : -1;

                if (nextIndex < 0) return;

                event.preventDefault();
                const nextTab = tabs[nextIndex];
                setActiveTab(nextTab.id);
                tabButtonRefs.current[nextTab.id]?.focus();
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        id={`${tabId}-${activeTabDefinition.id}-panel`}
        className="inspector-tab-panel"
        role="tabpanel"
        aria-labelledby={`${tabId}-${activeTabDefinition.id}-tab`}
        tabIndex={0}
      >
        {activeTabDefinition.content}
      </div>
    </div>
  );
}
