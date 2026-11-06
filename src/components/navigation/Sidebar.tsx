'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UserCheck,
  FileText,
  Briefcase,
  Kanban,
  Settings,
  Sparkles,
  Zap,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/profile', label: 'Career Facts', icon: UserCheck },
  { href: '/documents', label: 'Vault', icon: FileText },
  { href: '/jobs', label: 'Opportunities', icon: Briefcase },
  { href: '/applications', label: 'Tracker', icon: Kanban },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({
  quotaRemaining = 50,
  quotaLimit = 50,
}: {
  quotaRemaining?: number;
  quotaLimit?: number;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'border-r border-border/80 bg-card/75 backdrop-blur-xl flex flex-col justify-between p-3 h-screen sticky top-0 transition-all duration-300 z-30 select-none',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="space-y-4">
        {/* Brand & Collapse Header */}
        <div className="flex items-center justify-between px-1.5 py-2 border-b border-border/60">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/25 shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="h-4 w-4" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="font-extrabold tracking-tight text-foreground block text-xs leading-none">
                  JOBIES
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5 block truncate">
                  AI Job Search
                </span>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="h-6 w-6 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shrink-0"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Navigation links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 group',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform group-hover:scale-110',
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Quota Pill */}
      <div className="pt-3 border-t border-border/60">
        {!collapsed ? (
          <div className="rounded-lg border border-border/80 bg-secondary/50 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
              <span className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" /> Quota
              </span>
              <span className="font-mono text-muted-foreground">
                {quotaRemaining}/{quotaLimit}
              </span>
            </div>
            <div className="w-full bg-background rounded-full h-1.5 overflow-hidden border border-border/50">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, ((quotaLimit - quotaRemaining) / quotaLimit) * 100)}%`,
                }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground block truncate">
              Gemini 3.8 Flash Engine
            </span>
          </div>
        ) : (
          <div
            className="flex justify-center p-2 rounded-lg bg-secondary/50 border border-border text-amber-500"
            title={`Quota: ${quotaRemaining}/${quotaLimit} remaining`}
          >
            <Zap className="h-4 w-4" />
          </div>
        )}
      </div>
    </aside>
  );
}
