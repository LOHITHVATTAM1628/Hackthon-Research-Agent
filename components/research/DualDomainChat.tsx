'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  MessageSquare,
  Globe,
  FileText,
  Send,
  Loader2,
  ExternalLink,
  Bot,
  User,
  Sparkles,
  Compass,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: Array<{ title: string; url: string }>;
}

interface DualDomainChatProps {
  projectId: string;
  topic: string;
  reportContext: string;
}

const REPORT_PROMPT_SUGGESTIONS = [
  'Synthesize a 3-bullet executive summary with key metrics.',
  'What are the primary technical bottlenecks identified in the report?',
  'Draft an executive memo highlighting the market implications.',
  'Critique the assumptions regarding long-term scalability.',
];

const EXPLORER_PROMPT_SUGGESTIONS = [
  'Find recent startups and venture rounds in this sector.',
  'What are the primary regulatory implications in the EU/US?',
  'Compare this architecture with competing hardware paradigms.',
  'What open-source repositories or benchmarks are available?',
];

export function DualDomainChat({ projectId, topic, reportContext }: DualDomainChatProps) {
  const [chatType, setChatType] = useState<'report' | 'explorer'>('report');
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    // Initial greeting per tab
    if (messages.length === 0) {
      if (chatType === 'report') {
        setMessages([
          {
            id: 'init-report',
            role: 'assistant',
            content: `Greetings! I am the **Report Evolution Assistant** grounded in the finalized publication for **"${topic}"**. Ask me anything about the methodologies, data points, or request custom executive summaries and revisions.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setMessages([
          {
            id: 'init-explorer',
            role: 'assistant',
            content: `Welcome to the **Autonomous Web Explorer**. Powered by Groq LPUs and live Tavily search, I can investigate adjacent markets, real-world implementations, and competitor dynamics beyond this report.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    }
  }, [chatType, topic]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || isSending) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const history = messages
        .filter((m) => !m.id.startsWith('init-'))
        .concat(userMsg)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/research/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          chatType,
          topic,
          reportContext,
          messages: history,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chat query failed');

      const botMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'assistant',
        content: data.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: data.sources || [],
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      addToast(error.message, 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleSwitchTab = (type: 'report' | 'explorer') => {
    if (type !== chatType) {
      setChatType(type);
      setMessages([]); // reset greeting
    }
  };

  const currentSuggestions =
    chatType === 'report' ? REPORT_PROMPT_SUGGESTIONS : EXPLORER_PROMPT_SUGGESTIONS;

  return (
    <div className="dual-chat-card">
      {/* Top Header with Tab Switcher */}
      <div className="dual-chat-header">
        <div className="flex-center gap-2">
          <MessageSquare size={18} className="text-orange" />
          <h3 className="section-title-sm">Dual Domain Research Intelligence</h3>
        </div>

        <div className="chat-domain-tabs">
          <button
            type="button"
            className={`domain-tab-btn ${chatType === 'report' ? 'active' : ''}`}
            onClick={() => handleSwitchTab('report')}
          >
            <FileText size={13} />
            <span>Report Intelligence</span>
          </button>
          <button
            type="button"
            className={`domain-tab-btn ${chatType === 'explorer' ? 'active' : ''}`}
            onClick={() => handleSwitchTab('explorer')}
          >
            <Globe size={13} />
            <span>Web Explorer</span>
          </button>
        </div>
      </div>

      {/* Suggestion Chips */}
      <div className="chat-suggestions-bar">
        <div className="suggestion-chips-scroller">
          {currentSuggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className="chat-suggestion-chip"
              onClick={() => handleSend(item)}
              disabled={isSending}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="chat-messages-stream">
        {messages.map((m) => (
          <div key={m.id} className={`chat-message-row ${m.role}`}>
            <div className={`chat-avatar ${m.role}`}>
              {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>

            <div className="chat-bubble">
              <div className="chat-bubble-header">
                <span className="chat-author-name">
                  {m.role === 'user'
                    ? 'Researcher'
                    : chatType === 'report'
                    ? 'Report Assistant'
                    : 'Web Explorer'}
                </span>
                <span className="chat-time">{m.timestamp}</span>
              </div>

              <div className="chat-bubble-content markdown-prose text-sm">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>

              {/* Citations if Web Explorer found live sources */}
              {m.sources && m.sources.length > 0 && (
                <div className="chat-sources-chips">
                  <span className="mono-subtext">Discovered Sources:</span>
                  <div className="flex-wrap flex gap-1 mt-1">
                    {m.sources.map((s, i) => (
                      <a
                        key={i}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="chat-source-pill"
                      >
                        <span>{s.title}</span>
                        <ExternalLink size={10} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="chat-message-row assistant">
            <div className="chat-avatar assistant">
              <Bot size={14} />
            </div>
            <div className="chat-bubble thinking">
              <Loader2 size={16} className="animate-spin text-orange" />
              <span className="mono-subtext">
                {chatType === 'report' ? 'Synthesizing report findings...' : 'Scanning live web via Tavily...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="chat-input-form"
      >
        <div className="chat-input-container">
          <input
            type="text"
            className="chat-text-input"
            placeholder={
              chatType === 'report'
                ? 'Ask about findings, request executive memos, or challenge assumptions...'
                : 'Brainstorm adjacent topics, request competitor analysis, or ask for live web research...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSending}
          />
          <button
            type="submit"
            className="btn btn-primary chat-send-btn"
            disabled={isSending || !input.trim()}
          >
            <Send size={15} />
          </button>
        </div>
      </form>
    </div>
  );
}
