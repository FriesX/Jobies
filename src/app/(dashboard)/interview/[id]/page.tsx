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
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Badge } from '@/components/ui';
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
              text: `Hello! Thank you for meeting with us today regarding the ${application?.job?.title} position at ${application?.job?.company}. To begin, could you answer this: "${firstQ}"?`,
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
      // Simulate interviewer evaluation & follow-up
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'interviewer',
            text: `Thank you for sharing that structured context. You clearly demonstrated your problem-solving approach. As a follow-up question: "Can you elaborate on how you handled cross-functional collaboration and tradeoffs during that initiative?"`,
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
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/applications/${id}`}>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Interview Preparation & Mock Room</h1>
            <p className="text-xs text-muted-foreground">
              {application?.job?.title} at {application?.job?.company}
            </p>
          </div>
        </div>

        <Button
          onClick={handleGeneratePrep}
          disabled={generatingPrep}
          size="sm"
          className="gap-1.5"
        >
          {generatingPrep ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Preparing Guide...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" /> {prepData ? 'Refresh Guide' : 'Generate Interview Guide'}
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Strategy Guide Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {!prepData ? (
            <Card className="p-6 text-center space-y-2">
              <HelpCircle className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-xs font-semibold">No questions generated yet</p>
              <p className="text-[11px] text-muted-foreground">
                Click &quot;Generate Interview Guide&quot; above to predict likely questions and STAR answers.
              </p>
            </Card>
          ) : (
            <>
              {/* Role Summary */}
              {prepData.roleOverviewSummary && (
                <Card className="p-4 bg-secondary/30 text-xs space-y-1">
                  <span className="font-bold text-foreground block">Role Strategic Focus</span>
                  <p className="text-muted-foreground leading-relaxed">
                    {prepData.roleOverviewSummary}
                  </p>
                </Card>
              )}

              {/* Behavioral Questions with STAR */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                  Behavioral STAR Mapping
                </h3>
                {prepData.behavioralQuestions?.map((q, idx) => (
                  <Card key={idx} className="p-3.5 space-y-2 text-xs">
                    <span className="font-semibold text-foreground block">Q: {q.question}</span>
                    <div className="p-2.5 rounded bg-secondary/50 text-muted-foreground space-y-1">
                      <span className="text-[10px] uppercase font-bold text-emerald-500 block">
                        Suggested STAR Strategy
                      </span>
                      <p>{q.suggestedStarAnswer}</p>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Technical Questions */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                  Technical Architecture Questions
                </h3>
                {prepData.technicalQuestions?.map((q, idx) => (
                  <Card key={idx} className="p-3.5 space-y-2 text-xs">
                    <span className="font-semibold text-foreground block">Q: {q.question}</span>
                    <p className="text-muted-foreground">{q.context}</p>
                  </Card>
                ))}
              </div>

              {/* Honesty Bridges */}
              {prepData.identifiedGapsAndBridges?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">
                    Honesty Bridges for Gaps
                  </h3>
                  {prepData.identifiedGapsAndBridges.map((item, idx) => (
                    <Card key={idx} className="p-3 rounded bg-amber-500/5 border-amber-500/20 text-xs space-y-1">
                      <span className="font-semibold text-amber-600 dark:text-amber-400 block">
                        Potential Gap: {item.gap}
                      </span>
                      <p className="text-muted-foreground">{item.honestBridgeStrategy}</p>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Side: Interactive Mock Interview Chat (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-[75vh] rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Chat Header */}
          <div className="p-3.5 border-b border-border bg-secondary/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                AI
              </div>
              <div>
                <span className="font-semibold text-xs text-foreground block">Hiring Manager Simulator</span>
                <span className="text-[10px] text-muted-foreground block">Grounded Interview Practice</span>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px]">
              Text Simulation
            </Badge>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs leading-relaxed">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-muted-foreground">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
                <p className="font-medium text-foreground">Interactive Practice Room</p>
                <p className="text-[11px] max-w-sm">
                  Generate the interview guide or type &quot;Ready to begin&quot; below to start your mock interview.
                </p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 ${msg.role === 'candidate' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'interviewer' && (
                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] p-3 rounded-xl whitespace-pre-wrap ${
                      msg.role === 'candidate'
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'bg-secondary text-foreground rounded-tl-none border border-border/60'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {msg.role === 'candidate' && (
                    <div className="h-7 w-7 rounded-full bg-secondary text-foreground flex items-center justify-center shrink-0 mt-0.5 border border-border">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))
            )}
            {sending && (
              <div className="flex gap-2 items-center text-muted-foreground text-[11px]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Interviewer is evaluating your response...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-card flex gap-2">
            <Input
              placeholder="Type your answer using the STAR format (Situation, Task, Action, Result)..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={sending}
              className="text-xs h-10"
            />
            <Button type="submit" disabled={sending || !inputText.trim()} size="icon" className="h-10 w-10 shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
