'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Hash } from 'lucide-react';

interface ReportMarkdownRendererProps {
  content: string;
}

function CodeBlock({ children, className }: { children: React.ReactNode; className?: string }) {
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
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-lang-tag">{lang || 'text'}</span>
        <button
          type="button"
          className="code-copy-btn"
          onClick={handleCopy}
          title="Copy code snippet"
        >
          {copied ? <Check size={12} className="text-green" /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="code-block-pre">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function ReportMarkdownRenderer({ content }: ReportMarkdownRendererProps) {
  return (
    <article className="report-markdown-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => {
            const text = String(children);
            const id = slugify(text);
            return (
              <h1 id={id} className="report-doc-h1 group">
                <span>{children}</span>
                <a href={`#${id}`} className="heading-anchor" title="Direct link to heading">
                  <Hash size={16} />
                </a>
              </h1>
            );
          },
          h2: ({ children }) => {
            const text = String(children);
            const id = slugify(text);
            return (
              <h2 id={id} className="report-doc-h2 group">
                <span>{children}</span>
                <a href={`#${id}`} className="heading-anchor" title="Direct link to heading">
                  <Hash size={14} />
                </a>
              </h2>
            );
          },
          h3: ({ children }) => {
            const text = String(children);
            const id = slugify(text);
            return (
              <h3 id={id} className="report-doc-h3 group">
                <span>{children}</span>
                <a href={`#${id}`} className="heading-anchor" title="Direct link to heading">
                  <Hash size={12} />
                </a>
              </h3>
            );
          },
          table: ({ children }) => (
            <div className="table-responsive-wrapper">
              <table className="report-table">{children}</table>
            </div>
          ),
          blockquote: ({ children }) => (
            <blockquote className="report-blockquote">
              <div className="quote-accent-bar" />
              <div className="quote-content">{children}</div>
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className && typeof children === 'string' && !children.includes('\n');
            if (isInline) {
              return (
                <code className="inline-code-badge" {...props}>
                  {children}
                </code>
              );
            }
            return <CodeBlock className={className}>{children}</CodeBlock>;
          },
          ul: ({ children }) => <ul className="report-bullet-list">{children}</ul>,
          ol: ({ children }) => <ol className="report-numbered-list">{children}</ol>,
          li: ({ children }) => <li className="report-list-item">{children}</li>,
          p: ({ children }) => <p className="report-paragraph">{children}</p>,
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
