'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Shield, Lock, FileCheck, ArrowRight, Loader2, ShieldCheck, Cpu } from 'lucide-react';
import { Button, Card } from '@/components/ui';

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
        setErrorMsg(data.error || 'Google Client ID is not configured yet. You can use Instant Demo Login below.');
      }
    } catch {
      setErrorMsg('Failed to initiate Google authentication. Try Instant Demo Login.');
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#07090e] text-zinc-100 selection:bg-sky-500/30 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 items-center justify-center text-white shadow-xl shadow-sky-500/20 mb-1 border border-white/10">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Jobies
          </h1>
          <p className="text-xs text-zinc-400 font-mono">
            Autonomous Career Strategist &amp; Grounded Studio
          </p>
        </div>

        {/* Authentication Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0c101d]/90 backdrop-blur-2xl p-6 shadow-2xl space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-base font-semibold text-white">Access Your Career Console</h2>
            <p className="text-xs text-zinc-400">
              Sign in with your verified Google account or enter via Sandbox Mode.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono">
              {errorMsg}
            </div>
          )}

          {/* Google Login Button */}
          <Button
            className="w-full h-11 bg-white hover:bg-zinc-100 text-zinc-900 shadow-md flex items-center justify-center gap-3 font-semibold text-xs tracking-wide transition-all hover-lift"
            onClick={handleGoogleLogin}
            disabled={loadingGoogle || loadingDemo}
          >
            {loadingGoogle ? (
              <Loader2 className="h-4 w-4 animate-spin text-zinc-800" />
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
            <span>Sign In with Google</span>
          </Button>

          <div className="relative flex items-center justify-center py-1">
            <div className="border-t border-white/[0.08] w-full" />
            <span className="bg-[#0c101d] px-2.5 text-[10px] uppercase font-mono tracking-wider text-zinc-500 absolute">
              Developer Preview
            </span>
          </div>

          {/* Instant Demo Login Button */}
          <Button
            variant="outline"
            className="w-full h-10 border border-sky-500/30 bg-sky-500/5 hover:bg-sky-500/10 text-sky-300 font-mono text-xs flex items-center justify-center gap-2 transition-all hover-lift"
            onClick={handleDemoLogin}
            disabled={loadingGoogle || loadingDemo}
          >
            {loadingDemo ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5 text-sky-400" />
            )}
            <span>Instant Demo Session (1-Click)</span>
          </Button>
        </div>

        {/* Security badges */}
        <div className="grid grid-cols-3 gap-2.5 text-center text-[10px] font-mono text-zinc-400">
          <div className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-[#0c101d]/60 border border-white/[0.06]">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Posting Guard</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-[#0c101d]/60 border border-white/[0.06]">
            <Lock className="h-4 w-4 text-sky-400" />
            <span>Isolated Vault</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-[#0c101d]/60 border border-white/[0.06]">
            <Cpu className="h-4 w-4 text-indigo-400" />
            <span>gemini-3.8-flash</span>
          </div>
        </div>
      </div>
    </div>
  );
}
