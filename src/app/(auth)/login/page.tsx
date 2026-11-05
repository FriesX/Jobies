'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Shield, Lock, FileCheck, ArrowRight, Loader2 } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/google/url');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setErrorMsg(data.error || 'Google Client ID is not configured yet. You can use Demo Login below.');
      }
    } catch {
      setErrorMsg('Failed to initiate Google authentication. Try Demo Login.');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoadingDemo(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Demo Career Seeker',
          email: 'seeker.demo@example.com',
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/');
        router.refresh();
      } else {
        setErrorMsg(data.error || 'Demo login failed');
      }
    } catch {
      setErrorMsg('Network error on demo login');
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 items-center justify-center text-white shadow-lg shadow-blue-500/25 mb-1">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            AI Job Search Web App
          </h1>
          <p className="text-sm text-muted-foreground">
            Grounded CV Tailoring, Fit Analysis & Interview Preparation Studio
          </p>
        </div>

        {/* Card */}
        <Card className="border border-border/80 shadow-xl bg-card/80 backdrop-blur-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Sign in with your Google account to access your private job search vault.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="p-3 text-xs rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
                {errorMsg}
              </div>
            )}

            {/* Google Login Button */}
            <Button
              className="w-full h-11 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-center gap-3 font-semibold"
              onClick={handleGoogleLogin}
              disabled={loadingGoogle || loadingDemo}
            >
              {loadingGoogle ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              Continue with Google
            </Button>

            <div className="relative flex items-center justify-center py-2">
              <div className="border-t border-border w-full" />
              <span className="bg-card px-2 text-[11px] uppercase tracking-wider text-muted-foreground absolute">
                Or Developer Preview
              </span>
            </div>

            {/* Instant Demo Login Button */}
            <Button
              variant="outline"
              className="w-full h-11 border-dashed flex items-center justify-center gap-2 text-foreground font-medium"
              onClick={handleDemoLogin}
              disabled={loadingGoogle || loadingDemo}
            >
              {loadingDemo ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <ArrowRight className="h-4 w-4 text-primary" />
              )}
              Instant Demo Mode (1-Click Login)
            </Button>
          </CardContent>
        </Card>

        {/* Security badges */}
        <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-muted-foreground">
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-card/40 border border-border/50">
            <Shield className="h-4 w-4 text-emerald-500" />
            <span>Posting Guard</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-card/40 border border-border/50">
            <Lock className="h-4 w-4 text-blue-500" />
            <span>Private Vault</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-card/40 border border-border/50">
            <FileCheck className="h-4 w-4 text-purple-500" />
            <span>ATS Compliance</span>
          </div>
        </div>
      </div>
    </div>
  );
}
