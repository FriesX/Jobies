'use client';

import React, { useState, useEffect } from 'react';
import { UserCheck, Save, Plus, X, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Textarea, Badge } from '@/components/ui';

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
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Career Profile & Grounded Facts</h1>
        <p className="text-sm text-muted-foreground">
          This data serves as the single source of truth for all AI evaluations and CV tailoring.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" /> Professional Identity
            </CardTitle>
            <CardDescription>
              Basic information used in your resume header and recruiter summaries.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Headline / Professional Title</label>
                <Input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Senior Full Stack Engineer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Current Location</label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Jakarta, Indonesia (Remote / Hybrid)"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Work Authorization / Visa Status</label>
              <Input
                value={workAuthorization}
                onChange={(e) => setWorkAuthorization(e.target.value)}
                placeholder="e.g. Indonesian Citizen, US Remote Eligible, Authorized to work without sponsorship"
              />
            </div>
          </CardContent>
        </Card>

        {/* Target Roles & Industries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Target Roles & Industries</CardTitle>
            <CardDescription>
              Define your career goals to guide the AI fit scorer and recommendation engine.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Roles */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Target Roles</label>
              <div className="flex gap-2">
                <Input
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRole())}
                  placeholder="e.g. Tech Lead, Product Engineer"
                />
                <Button type="button" onClick={addRole} variant="secondary" size="sm" className="gap-1 shrink-0">
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {targetRoles.map((role) => (
                  <Badge key={role} variant="secondary" className="gap-1 pr-1.5">
                    {role}
                    <button type="button" onClick={() => removeRole(role)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Industries */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Target Industries</label>
              <div className="flex gap-2">
                <Input
                  value={newIndustry}
                  onChange={(e) => setNewIndustry(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addIndustry())}
                  placeholder="e.g. FinTech, SaaS, AI/ML, E-Commerce"
                />
                <Button type="button" onClick={addIndustry} variant="secondary" size="sm" className="gap-1 shrink-0">
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {industries.map((ind) => (
                  <Badge key={ind} variant="outline" className="gap-1 pr-1.5">
                    {ind}
                    <button type="button" onClick={() => removeIndustry(ind)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills & Experience Facts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" /> Core Skills & Grounded Career Facts
            </CardTitle>
            <CardDescription>
              Proven competencies and key career history facts. The AI is strictly prohibited from inventing facts not listed here or in your uploaded CV.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Skills */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Skills & Technologies</label>
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  placeholder="e.g. Next.js, PostgreSQL, System Design, Team Mentorship"
                />
                <Button type="button" onClick={addSkill} variant="secondary" size="sm" className="gap-1 shrink-0">
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {skills.map((skill) => (
                  <Badge key={skill} variant="default" className="gap-1 pr-1.5">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Experience Summary */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                Career Experience Summary & Facts
              </label>
              <Textarea
                rows={7}
                value={experienceSummary}
                onChange={(e) => setExperienceSummary(e.target.value)}
                placeholder="Paste key achievements, years of experience, companies worked at, metrics (e.g. scaled platform to 2M DAU, managed team of 8 engineers). This prevents hallucinated claims."
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Bar */}
        <div className="flex items-center justify-between sticky bottom-4 p-4 rounded-xl border border-border/80 bg-card/90 backdrop-blur-md shadow-lg">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            {savedSuccess ? (
              <span className="text-emerald-500 flex items-center gap-1 font-medium">
                <CheckCircle2 className="h-4 w-4" /> Profile saved successfully!
              </span>
            ) : (
              'Changes will immediately take effect for all subsequent AI tailoring.'
            )}
          </span>
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
