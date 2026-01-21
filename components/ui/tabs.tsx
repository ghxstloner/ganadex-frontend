"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Original Tabs component (kept for backwards compatibility)
export type Tab = {
  id: string;
  label: string;
  content: React.ReactNode;
};

export type TabsProps = {
  tabs?: Tab[];
  defaultTab?: string;
  className?: string;
  onTabChange?: (tabId: string) => void;
  // New API for shadcn-style tabs
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  children?: React.ReactNode;
};

type TabsContextType = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextType | undefined>(undefined);

const useTabsContext = () => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider");
  }
  return context;
};

const buildTabId = (id: string) => `tab-${id}`;
const buildPanelId = (id: string) => `panel-${id}`;

export function Tabs({ tabs, defaultTab, className, onTabChange, value, onValueChange, defaultValue, children }: TabsProps) {
  // Support both old and new API
  const [internalValue, setInternalValue] = React.useState(
    value ?? defaultValue ?? defaultTab ?? tabs?.[0]?.id ?? ""
  );

  const currentValue = value ?? internalValue;

  const handleValueChange = (newValue: string) => {
    if (!value) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
    onTabChange?.(newValue);
  };

  // Old API with tabs array
  if (tabs && tabs.length > 0) {
    const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
    const activeContent = tabs.find((tab) => tab.id === currentValue)?.content;

    const handleKeyDown = (
      event: React.KeyboardEvent<HTMLButtonElement>,
      index: number
    ) => {
      const lastIndex = tabs.length - 1;
      let nextIndex = index;

      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          nextIndex = index === lastIndex ? 0 : index + 1;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          nextIndex = index === 0 ? lastIndex : index - 1;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = lastIndex;
          break;
        default:
          return;
      }

      event.preventDefault();
      const nextTab = tabs[nextIndex];
      if (nextTab) {
        handleValueChange(nextTab.id);
        tabRefs.current[nextIndex]?.focus();
      }
    };

    return (
      <div className={className}>
        <div
          className="flex gap-1 border-b border-border"
          role="tablist"
          aria-orientation="horizontal"
        >
          {tabs.map((tab, index) => {
            const isActive = currentValue === tab.id;
            return (
              <button
                key={tab.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                id={buildTabId(tab.id)}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={buildPanelId(tab.id)}
                tabIndex={isActive ? 0 : -1}
                onClick={() => handleValueChange(tab.id)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={cn(
                  "relative px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            );
          })}
        </div>
        <div
          id={buildPanelId(currentValue)}
          role="tabpanel"
          aria-labelledby={buildTabId(currentValue)}
          className="pt-6"
        >
          {activeContent}
        </div>
      </div>
    );
  }

  // New API with children components
  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
  disabled,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const { value: selectedValue, onValueChange } = useTabsContext();
  const isActive = selectedValue === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { value: selectedValue } = useTabsContext();
  
  if (selectedValue !== value) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      {children}
    </div>
  );
}
