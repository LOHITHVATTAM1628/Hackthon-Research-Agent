'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  Check,
  GitCompare,
  Globe,
  User,
  ExternalLink,
  BookOpen,
  Sparkles,
} from 'lucide-react';

export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    title: string;
    url: string;
    snippet?: string;
  }>;
  mode?: 'compare' | 'general';
  timestamp?: string;
  isStreaming?: boolean;
}

interface ChatMessageItemProps {
  message: ChatMessageData;
}

function CodeBlock({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';
  const codeText = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="chat-code-wrapper">
      <div className="chat-code-header">
        <span className="code-lang-label">{lang || 'text'}</span>
        <button
          type="button"
          className="code-copy-btn"
          onClick={handleCopy}
          title="Copy code"
        >
          {copied ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="chat-code-pre">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const mode = message.mode || 'general';

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`chat-message-row ${isUser ? 'user-row' : 'assistant-row'}`}>
      <div className="message-avatar-col">
        {isUser ? (
          <div className="avatar user-avatar">
            <User size={16} />
          </div>
        ) : mode === 'compare' ? (
          <div className="avatar bot-avatar compare-bot">
            <GitCompare size={16} />
          </div>
        ) : (
          <div className="avatar bot-avatar general-bot">
            <Globe size={16} />
          </div>
        )}
      </div>

      <div className="message-content-col">
        <div className="message-header-bar">
          <div className="sender-info">
            <span className="sender-name">
              {isUser
                ? 'You (Researcher)'
                : mode === 'compare'
                ? 'Report Evolution Auditor'
                : 'ResearchMind Generalist'}
            </span>
            {!isUser && (
              <span className={`bot-mode-tag ${mode}`}>
                {mode === 'compare' ? 'Temporal Diff' : 'Live Research'}
              </span>
            )}
          </div>

          <div className="message-actions-bar">
            {message.timestamp && (
              <span className="message-time">{message.timestamp}</span>
            )}
            <button
              type="button"
              className="btn-msg-copy"
              onClick={handleCopyMessage}
              title="Copy message content"
            >
              {copied ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div className="message-bubble-box">
          <div className="message-markdown-prose">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: ({ inline, className, children, ...props }: any) => {
                  if (inline) {
                    return (
                      <code className="chat-inline-code" {...props}>
                        {children}
                      </code>
                    );
                  }
                  return <CodeBlock className={className}>{children}</CodeBlock>;
                },
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="chat-external-link"
                  >
                    <span>{children}</span>
                    <ExternalLink size={11} className="inline-ext-icon" />
                  </a>
                ),
                table: ({ children }) => (
                  <div className="chat-table-scroll-wrapper">
                    <table className="chat-data-table">{children}</table>
                  </div>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>

            {message.isStreaming && (
              <span className="streaming-cursor" aria-hidden="true">
                ▋
              </span>
            )}
          </div>

          {/* Sources Ribbon below assistant message */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="message-sources-tray">
              <div className="sources-tray-header">
                <BookOpen size={12} className="text-cyan" />
                <span>Cited Live Intelligence ({message.sources.length} sources)</span>
              </div>
              <div className="sources-pill-list">
                {message.sources.map((s, sIdx) => {
                  let hostname = '';
                  try {
                    hostname = new URL(s.url).hostname.replace('www.', '');
                  } catch {
                    hostname = 'web';
                  }

                  return (
                    <a
                      key={sIdx}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="source-citation-pill"
                      title={s.snippet || s.title}
                    >
                      <span className="source-domain-badge">{hostname}</span>
                      <span className="source-title-truncate">{s.title}</span>
                      <ExternalLink size={10} className="pill-ext-icon" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
