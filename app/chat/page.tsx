'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  GitCompare,
  Globe,
  Send,
  Square,
  Trash2,
  AlertCircle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Search,
  RefreshCw,
} from 'lucide-react';
import { ChatMessageItem, ChatMessageData } from '@/components/chat/ChatMessageItem';
import { ChatQuickChips } from '@/components/chat/ChatQuickChips';
import { ReportContextSelector } from '@/components/chat/ReportContextSelector';
import { ReportOption } from '@/app/api/chat/compare/route';

function ChatContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'compare' ? 'compare' : 'general';
  const initialReportId = searchParams.get('reportId') || '';

  const [activeTab, setActiveTab] = useState<'compare' | 'general'>(initialTab);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Bot 1 Report State
  const [reports, setReports] = useState<ReportOption[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>(initialReportId);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  // Bot 2 Search Toggle
  const [enableWebSearch, setEnableWebSearch] = useState(true);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Load available reports for Comparison Bot
  const fetchReports = async () => {
    setIsLoadingReports(true);
    try {
      const res = await fetch('/api/chat/compare');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.reports) && data.reports.length > 0) {
          setReports(data.reports);
          if (!selectedReportId) {
            setSelectedReportId(data.reports[0].id);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load reports for chat context:', err);
    } finally {
      setIsLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Update selected report if query parameter changes
  useEffect(() => {
    if (initialReportId) {
      setSelectedReportId(initialReportId);
      setActiveTab('compare');
    }
  }, [initialReportId]);

  // Set default initial greeting on tab change if empty
  useEffect(() => {
    if (messages.length === 0) {
      if (activeTab === 'compare') {
        setMessages([
          {
            id: 'init-compare',
            role: 'assistant',
            mode: 'compare',
            content: `### 🔄 Research Evolution & Report Audit Assistant Initialized\n\nI am grounded in your research publications. I contrast existing reports against fresh **2026 web discoveries** via real-time search, uncovering:\n- **Temporal Shifts**: What industry paradigms moved since publication.\n- **Outdated Assertions**: Outdated metrics, benchmarks, or superseded hypotheses.\n- **Missing Angles**: Key developments and breakthroughs to integrate into Version 2.0+.\n\nSelect a report above or ask any temporal comparison query below!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setMessages([
          {
            id: 'init-general',
            role: 'assistant',
            mode: 'general',
            content: `### 🌐 ResearchMind General Autonomous Assistant\n\nI am your comprehensive multi-agent research partner powered by **Groq LLM** and **live Tavily search retrieval**.\n\nYou can ask me to:\n- Analyze technical breakthroughs and conduct deep scientific dives.\n- Compare competing architectures, frameworks, or medical clinical trials.\n- Structure comparisons with markdown tables, formulas, and runnable code.\n\nType your research inquiry or pick from the suggested inquiries below!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    }
  }, [activeTab]);

  // Auto-scroll to bottom of messages smoothly
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  // Handle Tab Switch
  const handleTabSwitch = (tab: 'compare' | 'general') => {
    if (tab === activeTab) return;
    if (isGenerating) handleStopGeneration();
    setActiveTab(tab);
    setMessages([]);
    setErrorBanner(null);
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // Clear Session
  const handleClearSession = () => {
    if (isGenerating) handleStopGeneration();
    setMessages([]);
    setErrorBanner(null);
  };

  // Send Message Logic
  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend !== undefined ? textToSend : inputValue).trim();
    if (!messageText || isGenerating) return;

    setErrorBanner(null);
    setInputValue('');

    const userMsgId = `user-${Date.now()}`;
    const botMsgId = `bot-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage: ChatMessageData = {
      id: userMsgId,
      role: 'user',
      content: messageText,
      mode: activeTab,
      timestamp,
    };

    const initialBotMessage: ChatMessageData = {
      id: botMsgId,
      role: 'assistant',
      content: '',
      mode: activeTab,
      timestamp,
      isStreaming: true,
      sources: [],
    };

    // Append to UI immediately
    setMessages((prev) => [...prev, userMessage, initialBotMessage]);
    setIsGenerating(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const endpoint = activeTab === 'compare' ? '/api/chat/compare' : '/api/chat/general';
    const payload: any = {
      message: messageText,
      stream: true,
      history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    };

    if (activeTab === 'compare') {
      payload.reportId = selectedReportId;
      const selected = reports.find((r) => r.id === selectedReportId);
      if (selected) {
        payload.reportTitle = selected.topic;
        payload.projectId = selected.projectId;
      }
    } else {
      payload.enableWebSearch = enableWebSearch;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chat API responded with ${response.status}: ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is missing');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';
      let capturedSources: any[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const jsonStr = trimmed.replace(/^data:\s*/, '');
          try {
            const data = JSON.parse(jsonStr);

            if (data.type === 'sources') {
              capturedSources = data.sources || [];
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botMsgId ? { ...m, sources: capturedSources } : m
                )
              );
            } else if (data.type === 'token') {
              accumulatedContent += data.content || '';
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botMsgId
                    ? { ...m, content: accumulatedContent, isStreaming: true }
                    : m
                )
              );
            } else if (data.type === 'done') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botMsgId
                    ? { ...m, content: accumulatedContent, isStreaming: false }
                    : m
                )
              );
            } else if (data.type === 'error') {
              setErrorBanner(data.error || 'Stream encountered an error');
            }
          } catch {
            // Ignore non-json lines
          }
        }
      }

      // Finalize message streaming status
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId ? { ...m, isStreaming: false } : m
        )
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  content:
                    m.content +
                    '\n\n*[Generation stopped by user]*',
                  isStreaming: false,
                }
              : m
          )
        );
      } else {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Chat stream error:', error);
        setErrorBanner(error.message);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  content:
                    m.content ||
                    `*Error processing request*: ${error.message}. Please check your credentials and retry.`,
                  isStreaming: false,
                }
              : m
          )
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="unified-chat-layout">
      {/* 1. Top Control Ribbon */}
      <header className="chat-top-ribbon">
        <div className="chat-ribbon-inner">
          <div className="chat-brand-meta">
            <div className="section-badge">
              <Sparkles size={13} className="text-orange" />
              <span>Dual Multi-Agent Intelligence Hub</span>
            </div>
            <h1 className="chat-title">Autonomous Research Chatbots</h1>
          </div>

          {/* Segmented Switcher Control */}
          <div className="chatbot-segmented-switch">
            <button
              type="button"
              className={`segmented-tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('compare')}
            >
              <GitCompare size={15} />
              <span>Report Comparison & Evolution</span>
            </button>
            <button
              type="button"
              className={`segmented-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('general')}
            >
              <Globe size={15} />
              <span>General Multi-Agent Partner</span>
            </button>
          </div>

          <div className="chat-top-utilities">
            {activeTab === 'general' && (
              <button
                type="button"
                className={`btn-utility-toggle ${enableWebSearch ? 'active' : ''}`}
                onClick={() => setEnableWebSearch(!enableWebSearch)}
                title="Toggle live Tavily web retrieval"
              >
                <Search size={13} />
                <span>Web Search: {enableWebSearch ? 'ON' : 'OFF'}</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleClearSession}
              title="Clear conversation history"
            >
              <Trash2 size={13} />
              <span>Clear Session</span>
            </button>
          </div>
        </div>

        {/* Bot 1: Grounded Context Ribbon */}
        {activeTab === 'compare' && (
          <div className="chat-context-ribbon">
            <ReportContextSelector
              reports={reports}
              selectedReportId={selectedReportId}
              onSelectReport={(r) => setSelectedReportId(r.id)}
              isLoading={isLoadingReports}
              onRefresh={fetchReports}
            />
          </div>
        )}
      </header>

      {/* 2. Chat Error Banner */}
      {errorBanner && (
        <div className="chat-error-banner">
          <div className="error-banner-content">
            <AlertCircle size={15} className="text-rose" />
            <span>{errorBanner}</span>
          </div>
          <button
            type="button"
            className="btn-retry-subtle"
            onClick={() => handleSendMessage()}
          >
            Retry Request
          </button>
        </div>
      )}

      {/* 3. Messages Stream Scroll Container */}
      <main className="chat-messages-container">
        <div className="chat-messages-inner">
          {messages.map((msg) => (
            <ChatMessageItem key={msg.id} message={msg} />
          ))}

          {/* Quick Prompts below if minimal messages */}
          {messages.length <= 2 && !isGenerating && (
            <div className="chat-prompt-suggestions-box">
              <ChatQuickChips
                mode={activeTab}
                onSelectPrompt={(prompt) => handleSendMessage(prompt)}
                disabled={isGenerating}
              />
            </div>
          )}

          <div ref={messagesEndRef} className="scroll-anchor" />
        </div>
      </main>

      {/* 4. Bottom Input Bar */}
      <footer className="chat-input-footer">
        <div className="chat-input-wrapper">
          {isGenerating && (
            <div className="generating-indicator-bar">
              <span className="generating-pulse-dot" />
              <span>Synthesizing multi-agent research tokens...</span>
              <button
                type="button"
                className="btn-stop-generation"
                onClick={handleStopGeneration}
              >
                <Square size={11} />
                <span>Stop Generating</span>
              </button>
            </div>
          )}

          <div className="chat-input-box">
            <textarea
              ref={textareaRef}
              className="chat-textarea-field"
              rows={1}
              placeholder={
                activeTab === 'compare'
                  ? 'Ask about outdated claims, temporal shifts, or new sources for this report...'
                  : 'Ask about any technology, compare algorithms, evaluate hypotheses, or request code...'
              }
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isGenerating}
            />

            <div className="chat-input-actions">
              {isGenerating ? (
                <button
                  type="button"
                  className="btn-chat-send stop"
                  onClick={handleStopGeneration}
                  title="Stop generating"
                >
                  <Square size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-chat-send"
                  disabled={!inputValue.trim()}
                  onClick={() => handleSendMessage()}
                  title="Send inquiry (Enter)"
                >
                  <Send size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="chat-footer-caption">
            <span>
              Powered by <strong>Groq LLM</strong> & <strong>Tavily Live Web Search</strong> · Shift+Enter for newline
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="chat-page-loader">
          <Sparkles size={24} className="text-orange spin-anim" />
          <span>Loading Dual Research Chatbots...</span>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
