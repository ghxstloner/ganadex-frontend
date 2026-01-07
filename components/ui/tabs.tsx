"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Tab = {
    id: string;
    label: string;
    content: ReactNode;
};

export type TabsProps = {
    tabs: Tab[];
    defaultTab?: string;
    className?: string;
    onTabChange?: (tabId: string) => void;
};

export function Tabs({ tabs, defaultTab, className, onTabChange }: TabsProps) {
    const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id);

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        onTabChange?.(tabId);
    };

    const activeContent = tabs.find((tab) => tab.id === activeTab)?.content;

    return (
        <div className={className}>
            <div className="flex gap-1 border-b border-border">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleTabChange(tab.id)}
                        className={cn(
                            "relative px-4 py-2.5 text-sm font-medium transition-colors",
                            activeTab === tab.id
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                ))}
            </div>
            <div className="pt-6">{activeContent}</div>
        </div>
    );
}
