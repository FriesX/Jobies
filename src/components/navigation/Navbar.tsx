'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sun, Moon, LogOut, ShieldCheck, Sparkles, User as UserIcon } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui';

interface NavbarProps {
  user?: {
    email?: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
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

  return (
    <header className="h-16 border-b border-border bg-card/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Safety Gate Active</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Dark/Light toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-lg h-9 w-9 text-muted-foreground hover:text-foreground"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* User profile & Logout */}
        <div className="flex items-center gap-3 pl-3 border-l border-border">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName || 'User'}
              className="h-8 w-8 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs border border-primary/20">
              <UserIcon className="h-4 w-4" />
            </div>
          )}
          <div className="hidden sm:block text-left text-xs">
            <span className="font-semibold block text-foreground leading-tight">
              {user?.displayName || 'Job Seeker'}
            </span>
            <span className="text-muted-foreground block text-[11px] leading-tight truncate max-w-[150px]">
              {user?.email || 'Logged In'}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-muted-foreground hover:text-destructive h-8 w-8 rounded-md"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
