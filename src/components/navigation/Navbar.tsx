'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Sun,
  Moon,
  LogOut,
  ShieldCheck,
  Cpu,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui';

interface NavbarProps {
  user?: {
    email?: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null;
}

const PATH_NAMES: Record<string, string> = {
  '/': 'Overview',
  '/jobs': 'Job Pipeline',
  '/jobs/new': 'New Ingestion',
  '/applications': 'Kanban Tracker',
  '/documents': 'Document Vault',
  '/profile': 'Career Profile',
};

export function Navbar({ user }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  const getBreadcrumbTitle = () => {
    if (PATH_NAMES[pathname]) return PATH_NAMES[pathname];
    if (pathname.startsWith('/applications/')) return 'Application Studio';
    if (pathname.startsWith('/interview/')) return 'Mock Interview Room';
    return 'Console';
  };

  return (
    <header className="h-14 border-b border-white/[0.06] bg-[#0b0f19]/80 backdrop-blur-xl px-5 flex items-center justify-between sticky top-0 z-40 transition-colors">
      {/* Left: Breadcrumbs & System Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center text-xs text-muted-foreground font-medium">
          <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1.5">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-sky-400">Jobies</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 mx-1.5 text-muted-foreground/40" />
          <span className="text-foreground font-semibold">{getBreadcrumbTitle()}</span>
        </div>

        <div className="hidden sm:inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ml-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span className="font-sans font-medium text-[11px]">Safety Gate Active</span>
        </div>
      </div>

      {/* Right: AI Engine badge, theme toggle, user profile */}
      <div className="flex items-center gap-3">
        {/* Gemini Engine Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] bg-white/[0.03] border border-white/[0.08] text-muted-foreground">
          <Cpu className="h-3.5 w-3.5 text-sky-400" />
          <span className="font-mono text-[10px] text-zinc-300">gemini-3.8-flash</span>
        </div>

        {/* Dark/Light toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-lg h-8 w-8 text-muted-foreground hover:text-foreground border-white/[0.08] bg-white/[0.02]"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </Button>

        {/* User profile & Logout */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-white/[0.08]">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName || 'User'}
              className="h-7 w-7 rounded-full border border-white/10 object-cover ring-1 ring-sky-500/20"
            />
          ) : (
            <div className="h-7 w-7 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center font-semibold text-xs border border-sky-500/20">
              <UserIcon className="h-3.5 w-3.5" />
            </div>
          )}
          <div className="hidden sm:block text-left text-xs leading-none">
            <span className="font-medium block text-foreground tracking-tight text-[12px]">
              {user?.displayName || 'Job Seeker'}
            </span>
            <span className="text-muted-foreground block text-[10px] mt-0.5 truncate max-w-[130px]">
              {user?.email || 'Authenticated'}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 h-7 w-7 rounded-md ml-1"
            title="Log out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
