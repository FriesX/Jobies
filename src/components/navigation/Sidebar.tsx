'use client';

import React from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/profile', label: 'Career Profile', icon: UserCheck },
  { href: '/documents', label: 'Document Vault', icon: FileText },
  { href: '/jobs', label: 'Job Intake & Search', icon: Briefcase },
  { href: '/applications', label: 'Application Tracker', icon: Kanban },
  { href: '/settings', label: 'Settings & Privacy', icon: Settings },
];

export function Sidebar({ quotaRemaining = 50, quotaLimit = 50 }: { quotaRemaining?: number; quotaLimit?: number }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-card/60 backdrop-blur-md flex flex-col justify-between p-4 h-screen sticky top-0">
      <div>
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 px-2 py-3 mb-6">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-foreground block text-base leading-none">
              AI Job Search
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-1 block">
              Grounded Studio
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 transition-transform group-hover:scale-110',
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* AI Quota Meter */}
      <div className="rounded-xl border border-border/80 bg-secondary/50 p-3.5 text-xs">
        <div className="flex items-center justify-between font-medium mb-1.5 text-foreground">
          <span className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-500" /> Daily AI Quota
          </span>
          <span className="text-muted-foreground">
            {quotaRemaining} / {quotaLimit} left
          </span>
        </div>
        <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-primary h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, ((quotaLimit - quotaRemaining) / quotaLimit) * 100)}%` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 leading-tight">
          Grounding with Gemini 1.5 Flash. Resets daily.
        </p>
      </div>
    </aside>
  );
}
