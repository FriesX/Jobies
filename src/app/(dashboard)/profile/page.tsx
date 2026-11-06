'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Save,
  Plus,
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  Briefcase,
  Layers,
  Award,
  Globe,
  ShieldCheck,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [headline, setHeadline] = useState('');
  const [location, setLocation] = useState('');
  const [workAuthorization, setWorkAuthorization] = useState('');
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [newRole, setNewRole] = useState('');
  const [industries, setIndustries] = useState<string[]>([]);
  const [newIndustry, setNewIndustry] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [experienceSummary, setExperienceSummary] = useState('');

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setHeadline(data.profile.headline || '');
          setLocation(data.profile.location || '');
          setWorkAuthorization(data.profile.workAuthorization || '');
          setTargetRoles(data.profile.targetRoles || []);
          setIndustries(data.profile.industries || []);
          setSkills(data.profile.skills || []);
          setExperienceSummary(data.profile.experienceSummary || '');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline,
          location,
          workAuthorization,
          targetRoles,
          industries,
          skills,
          experienceSummary,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const addRole = () => {
    if (newRole.trim() && !targetRoles.includes(newRole.trim())) {
      setTargetRoles([...targetRoles, newRole.trim()]);
      setNewRole('');
    }
  };

  const removeRole = (role: string) => {
    setTargetRoles(targetRoles.filter((r) => r !== role));
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const addIndustry = () => {
    if (newIndustry.trim() && !industries.includes(newIndustry.trim())) {
      setIndustries([...industries, newIndustry.trim()]);
      setNewIndustry('');
    }
  };

  const removeIndustry = (industry: string) => {
    setIndustries(industries.filter((i) => i !== industry));
  };

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
        <span className="text-xs font-mono text-zinc-400">Loading Career Fact Sheet...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Precision Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-semibold">
            Single Source of Truth
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-xs font-mono text-zinc-400">Grounded Career Facts</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Career Profile &amp; Fact Sheet</h1>
        <p className="text-xs text-zinc-400">
          This data anchors all Gemini AI evaluations, fit scores, and CV tailoring. The engine is strictly bounded by the facts stated here and your vault documents.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Identity */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0c101d] p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.05]">
            <UserCheck className="h-4 w-4 text-sky-400" />
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-200">
              Professional Identity &amp; Title
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
                Headline / Master Role Title
              </label>
              <input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer"
                className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#07090e] px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
                Current Location &amp; Mobility
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Jakarta, Indonesia (Remote / Hybrid)"
                className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#07090e] px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
              Work Authorization &amp; Visa Status
            </label>
            <input
              value={workAuthorization}
              onChange={(e) => setWorkAuthorization(e.target.value)}
              placeholder="e.g. Indonesian Citizen, US Remote Eligible, Authorized to work without sponsorship"
              className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#07090e] px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50"
            />
          </div>
        </div>

        {/* Target Roles & Industries */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0c101d] p-6 space-y-5 shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.05]">
            <Briefcase className="h-4 w-4 text-indigo-400" />
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-200">
              Target Trajectory &amp; Sectors
            </h3>
          </div>

          {/* Roles */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
              Target Job Titles
            </label>
            <div className="flex gap-2">
              <input
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRole())}
                placeholder="e.g. Tech Lead, Product Engineer (Press Enter to add)"
                className="h-9 w-full rounded-lg border border-white/[0.08] bg-[#07090e] px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50"
              />
              <Button type="button" onClick={addRole} variant="outline" size="sm" className="gap-1 shrink-0 h-9 border-white/[0.08] bg-white/[0.02]">
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {targetRoles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-sky-500/10 text-sky-300 border border-sky-500/20"
                >
                  {role}
                  <button type="button" onClick={() => removeRole(role)} className="hover:text-rose-400">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Industries */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
              Target Industries
            </label>
            <div className="flex gap-2">
              <input
                value={newIndustry}
                onChange={(e) => setNewIndustry(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addIndustry())}
                placeholder="e.g. FinTech, SaaS, AI/ML, Logistics (Press Enter to add)"
                className="h-9 w-full rounded-lg border border-white/[0.08] bg-[#07090e] px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50"
              />
              <Button type="button" onClick={addIndustry} variant="outline" size="sm" className="gap-1 shrink-0 h-9 border-white/[0.08] bg-white/[0.02]">
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {industries.map((ind) => (
                <span
                  key={ind}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                >
                  {ind}
                  <button type="button" onClick={() => removeIndustry(ind)} className="hover:text-rose-400">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Skills & Experience Facts */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0c101d] p-6 space-y-5 shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.05]">
            <Award className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-200">
              Core Skills &amp; Grounded Career Facts
            </h3>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
              Verified Skills &amp; Technologies
            </label>
            <div className="flex gap-2">
              <input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="e.g. Next.js, PostgreSQL, Docker, Microservices (Press Enter to add)"
                className="h-9 w-full rounded-lg border border-white/[0.08] bg-[#07090e] px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50"
              />
              <Button type="button" onClick={addSkill} variant="outline" size="sm" className="gap-1 shrink-0 h-9 border-white/[0.08] bg-white/[0.02]">
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                >
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="hover:text-rose-400">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Experience Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
                Career Fact Summary &amp; Key Milestones
              </label>
              <span className="text-[10px] font-mono text-zinc-500">
                {experienceSummary.length} characters
              </span>
            </div>
            <textarea
              rows={7}
              value={experienceSummary}
              onChange={(e) => setExperienceSummary(e.target.value)}
              placeholder="Paste key achievements, years of experience, companies worked at, metrics (e.g. scaled platform to 2M DAU, managed team of 8 engineers). This prevents hallucinated claims."
              className="w-full rounded-lg border border-white/[0.08] bg-[#07090e] p-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50 font-mono leading-relaxed"
            />
          </div>
        </div>

        {/* Sticky Save Bar */}
        <div className="flex items-center justify-between sticky bottom-4 p-4 rounded-xl border border-white/[0.1] bg-[#0c101d]/90 backdrop-blur-xl shadow-2xl">
          <span className="text-xs font-mono text-zinc-400 flex items-center gap-2">
            {savedSuccess ? (
              <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-4 w-4" /> Profile saved! Updated facts will ground next analysis.
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-zinc-500">
                <ShieldCheck className="h-3.5 w-3.5 text-sky-400" /> Facts immediately apply across all AI evaluations.
              </span>
            )}
          </span>
          <Button type="submit" disabled={saving} variant="glow" size="sm" className="gap-2 h-9 text-xs px-5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>Save Profile</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
