'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Shield,
  Zap,
  Trash2,
  FileCheck,
  AlertTriangle,
  Loader2,
  Lock,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { formatDate } from '@/lib/utils';

export default function SettingsPage() {
  const router = useRouter();
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => {
        setUserStats(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch('/api/account', { method: 'DELETE' });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      } else {
        alert('Failed to delete account. Please try again.');
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const quota = userStats?.quota || { currentCount: 0, limit: 50, remaining: 50 };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings & Privacy Center</h1>
        <p className="text-sm text-muted-foreground">
          Monitor your quota usage, security guarantees, and manage account data retention.
        </p>
      </div>

      {/* Quota & AI Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" /> AI Usage & Server Quota
          </CardTitle>
          <CardDescription>
            Gemini 1.5 Flash executions are managed server-side with daily rate-limiting to prevent quota depletion.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-secondary/40 border border-border">
            <div>
              <span className="text-xs text-muted-foreground block">Today&apos;s AI Generations</span>
              <span className="text-2xl font-bold text-foreground">{quota.currentCount}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Daily Quota Limit</span>
              <span className="text-2xl font-bold text-foreground">{quota.limit}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Remaining Generations</span>
              <span className="text-2xl font-bold text-emerald-500">{quota.remaining}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Quota resets automatically every 24 hours. Contact admin if you need higher limits for intensive job search batches.
          </p>
        </CardContent>
      </Card>

      {/* Security Guarantees & PRD Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-500" /> Security & Tenancy Policy
          </CardTitle>
          <CardDescription>
            Our architecture enforces strict zero-trust principles per PRD v1.0 specifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-muted-foreground">
          <div className="flex items-start gap-2.5">
            <Lock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground block">Strict Multi-Tenant Isolation:</strong>
              Every database query and storage bucket access is scoped directly to your server-authenticated Google user ID. Cross-tenant access is architecturally blocked.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <FileCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground block">Untrusted Posting Boundary:</strong>
              Job descriptions from the web are treated as untrusted strings, sanitized via deterministic regex, and stripped of prompt injections before reaching Gemini.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone: Account Deletion */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-base text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Danger Zone: Permanent Account Deletion
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Permanently delete your account, career profile, all uploaded CV documents, stored job postings, tailored resumes, and audit history. This action is irreversible.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <span className="text-xs text-muted-foreground">
              {deleteConfirm
                ? '⚠️ Are you sure? Click again to permanently wipe all data.'
                : 'All database records and storage files will be permanently purged.'}
            </span>

            <Button
              variant="destructive"
              size="sm"
              disabled={deleting}
              onClick={handleDeleteAccount}
              className="gap-2 shrink-0"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {deleteConfirm ? 'Confirm Permanent Deletion' : 'Delete Account & All Data'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
