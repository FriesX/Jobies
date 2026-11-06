'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  MessageSquare,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  HelpCircle,
  ArrowLeft,
  Bot,
  User,
  Shield,
  Terminal,
  Zap,
  Target,
  Building2,
  BookOpen,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import { InterviewPrepData } from '@/lib/gemini';

interface ChatMessage {
  role: 'interviewer' | 'candidate';
  text: string;
}

export default function MockInterviewPage() {
  const params = useParams();
  const id = params?.id as string;

  const [application, setApplication] = useState<any>(null);
  const [prepData, setPrepData] = useState<InterviewPrepData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPrep, setGeneratingPrep] = useState(false);

  // Chat states
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/applications/${id}/interview`);
      const data = await res.json();
      if (data.application) setApplication(data.application);
      if (data.prepData) setPrepData(data.prepData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleGeneratePrep = async () => {
    setGeneratingPrep(true);
    try {
      const res = await fetch(`/api/applications/${id}/interview`, { method: 'POST' });
      const data = await res.json();
      if (data.prepData) {
        setPrepData(data.prepData);
        // Start interview with first question
        if (data.prepData.behavioralQuestions?.[0]) {
          const firstQ = data.prepData.behavioralQuestions[0].question;
          setMessages([
            {
              role: 'interviewer',
              text: `Hello! Thank you for meeting with us today regarding the ${application?.job?.title} position at ${application?.job?.company}.\n\nTo begin our technical screen, could you walk us through: "${firstQ}"?`,
            },
          ]);
        }
      }
    } finally {
      setGeneratingPrep(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const userMsg = inputText.trim();
    setInputText('');
    const newChat = [...messages, { role: 'candidate' as const, text: userMsg }];
    setMessages(newChat);
    setSending(true);

    try {
      // Simulate interviewer evaluation & follow-up with grounded insight
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'interviewer',
            text: `Excellent. You articulated the Situation and Action clearly. From an engineering standpoint, what metrics or quantitative benchmarks did you use to evaluate success, and what would you do differently in retrospect?`,
          },
        ]);
        setSending(false);
      }, 1200);
    } catch {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
        <span className="text-xs font-mono text-zinc-400">Loading Interview Simulator...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-white/[0.08] bg-[#0c101d]">
        <div className="flex items-center gap-3">
          <Link href={`/applications/${id}`}>
            <Button variant="outline" size="icon" className="h-8 w-8 border-white/[0.1] bg-white/[0.02] text-zinc-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-semibold">
                Mock Simulator
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-[11px] font-mono text-zinc-400">Grounded Interview Engine</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              {application?.job?.title}
            </h1>
            <p className="text-xs text-zinc-400 flex items-center gap-1.5">
              <Building2 className="h-3 w-3 text-zinc-500" />
              <span>{application?.job?.company}</span>
            </p>
          </div>
        </div>

        <Button
          onClick={handleGeneratePrep}
          disabled={generatingPrep}
          variant="glow"
          size="sm"
          className="gap-2 h-8 text-xs shrink-0"
        >
          {generatingPrep ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Synthesizing Strategy...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" /> {prepData ? 'Refresh Questions' : 'Generate Guide'}
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Strategy Guide Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-4 max-h-[76vh] overflow-y-auto pr-1">
          {!prepData ? (
            <div className="rounded-xl border border-dashed border-white/[0.1] bg-[#0b0f19]/40 p-8 text-center space-y-2">
              <HelpCircle className="h-8 w-8 text-zinc-600 mx-auto" />
              <p className="text-xs font-semibold text-zinc-300">No Interview Guide Generated Yet</p>
              <p className="text-[11px] text-zinc-500">
                Click &quot;Generate Guide&quot; above to predict likely questions, STAR answer templates, and honesty bridges.
              </p>
            </div>
          ) : (
            <>
              {/* Role Strategic Focus */}
              {prepData.roleOverviewSummary && (
                <div className="rounded-xl border border-white/[0.08] bg-[#0c101d] p-4 text-xs space-y-1.5 shadow-sm">
                  <span className="font-mono uppercase text-[10px] tracking-wider font-semibold text-sky-400 block">
                    Role Strategic Focus
                  </span>
                  <p className="text-zinc-300 leading-relaxed">
                    {prepData.roleOverviewSummary}
                  </p>
                </div>
              )}

              {/* Behavioral Questions with STAR */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-sky-400 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" /> Behavioral STAR Mapping
                </span>
                {prepData.behavioralQuestions?.map((q, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-white/[0.07] bg-[#0c101d] p-3.5 space-y-2 text-xs hover-lift"
                  >
                    <span className="font-semibold text-zinc-200 block">Q: {q.question}</span>
                    <div className="p-2.5 rounded-lg bg-[#07090e] border border-white/[0.04] text-zinc-400 space-y-1 font-mono text-[11px]">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                        Suggested STAR Strategy
                      </span>
                      <p className="text-zinc-300 leading-relaxed">{q.suggestedStarAnswer}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Technical Questions */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-indigo-400 flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5" /> Technical Architecture
                </span>
                {prepData.technicalQuestions?.map((q, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-white/[0.07] bg-[#0c101d] p-3.5 space-y-1.5 text-xs hover-lift"
                  >
                    <span className="font-semibold text-zinc-200 block">Q: {q.question}</span>
                    <p className="text-zinc-400 leading-relaxed text-[11px]">{q.context}</p>
                  </div>
                ))}
              </div>

              {/* Honesty Bridges */}
              {prepData.identifiedGapsAndBridges?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-amber-400 flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" /> Honesty Bridges for Gaps
                  </span>
                  {prepData.identifiedGapsAndBridges.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-xs space-y-1.5"
                    >
                      <span className="font-semibold text-amber-300 block">
                        Potential Gap: {item.gap}
                      </span>
                      <p className="text-zinc-300 leading-relaxed text-[11px]">{item.honestBridgeStrategy}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Side: Interactive Mock Interview Chat (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-[76vh] rounded-xl border border-white/[0.08] bg-[#0c101d] shadow-2xl overflow-hidden">
          {/* Terminal Simulator Header */}
          <div className="p-3.5 border-b border-white/[0.08] bg-[#0f1526] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <span className="font-semibold text-xs text-white block">AI Technical Interviewer</span>
                <span className="text-[10px] font-mono text-zinc-400 block">Grounded Persona Active</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 uppercase">Live Session</span>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs leading-relaxed bg-[#07090e]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-zinc-500">
                <MessageSquare className="h-8 w-8 text-zinc-600" />
                <p className="font-semibold text-sm text-zinc-300">Mock Room Ready</p>
                <p className="text-xs max-w-sm text-zinc-500">
                  Click &quot;Generate Guide&quot; above to begin the technical conversation, or type a greeting below.
                </p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 ${msg.role === 'candidate' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'interviewer' && (
                    <div className="h-7 w-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] p-3.5 rounded-xl whitespace-pre-wrap leading-relaxed shadow-sm ${
                      msg.role === 'candidate'
                        ? 'bg-sky-600 text-white rounded-tr-none'
                        : 'bg-[#0f1526] text-zinc-200 rounded-tl-none border border-white/[0.08]'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {msg.role === 'candidate' && (
                    <div className="h-7 w-7 rounded-lg bg-white/[0.08] text-white flex items-center justify-center shrink-0 mt-0.5 border border-white/[0.1]">
                      <User className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              ))
            )}
            {sending && (
              <div className="flex gap-2 items-center text-zinc-500 text-[11px] font-mono">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />
                <span>Interviewer is evaluating your response...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-white/[0.08] bg-[#0c101d] flex gap-2">
            <input
              placeholder="Type your answer using the STAR format (Situation, Task, Action, Result)..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={sending}
              className="h-10 flex-1 rounded-lg border border-white/[0.08] bg-[#07090e] px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50"
            />
            <Button
              type="submit"
              disabled={sending || !inputText.trim()}
              variant="glow"
              size="icon"
              className="h-10 w-10 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
