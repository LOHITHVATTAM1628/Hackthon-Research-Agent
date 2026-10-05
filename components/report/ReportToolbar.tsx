'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Copy,
  Check,
  Download,
  Printer,
  Sparkles,
  MessageSquare,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface ReportToolbarProps {
  content: string;
  topic: string;
  version: number;
  projectId: string;
  runId: string;
}

export function ReportToolbar({
  content,
  topic,
  version,
  projectId,
  runId,
}: ReportToolbarProps) {
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();
  const router = useRouter();

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      addToast('Full research markdown copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2200);
    } catch {
      addToast('Failed to copy to clipboard', 'error');
    }
  };

  const handleDownloadMarkdown = () => {
    try {
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeTopic = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 45);
      link.href = url;
      link.download = `research-mind-${safeTopic}-v${version}.0.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast('Markdown publication downloaded successfully (.md)', 'info');
    } catch {
      addToast('Failed to trigger download', 'error');
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleReResearch = () => {
    router.push(`/research/${runId || projectId}?tab=diff`);
  };

  const handleChatCompare = () => {
    router.push(`/research/${runId || projectId}?tab=chat`);
  };

  return (
    <div className="report-action-toolbar-container no-print">
      <div className="toolbar-left">
        <Link
          href={`/research/${runId || projectId}`}
          className="btn btn-secondary btn-sm gap-2"
          title="Return to real-time mission telemetry"
        >
          <ArrowLeft size={14} />
          <span>Mission Control</span>
        </Link>
      </div>

      <div className="toolbar-right">
        {/* Copy Markdown */}
        <button
          type="button"
          id="btn-copy-markdown"
          className="btn btn-secondary btn-sm gap-2"
          onClick={handleCopyMarkdown}
          title="Copy raw markdown document"
        >
          {copied ? <Check size={14} className="text-green" /> : <Copy size={14} />}
          <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
        </button>

        {/* Download MD */}
        <button
          type="button"
          id="btn-download-markdown"
          className="btn btn-secondary btn-sm gap-2"
          onClick={handleDownloadMarkdown}
          title="Save file as structured Markdown (.md)"
        >
          <Download size={14} className="text-cyan" />
          <span>Download .MD</span>
        </button>

        {/* Print / Save as PDF */}
        <button
          type="button"
          id="btn-print-pdf"
          className="btn btn-secondary btn-sm gap-2"
          onClick={handlePrintPdf}
          title="Open browser print dialog for clean PDF generation"
        >
          <Printer size={14} className="text-orange" />
          <span>Download PDF / Print</span>
        </button>

        <div className="toolbar-divider" />

        {/* Re-Research / Evolve */}
        <button
          type="button"
          id="btn-re-research"
          className="btn btn-secondary btn-sm gap-2 highlight-evolution"
          onClick={handleReResearch}
          title="Evolve and update this research topic with fresh discoveries"
        >
          <Sparkles size={14} className="text-cyan" />
          <span>Re-Research Topic</span>
        </button>

        {/* Compare in Chatbot */}
        <button
          type="button"
          id="btn-compare-chatbot"
          className="btn btn-primary btn-sm gap-2"
          onClick={handleChatCompare}
          title="Inquire with the Dual-Domain Intelligence Assistant"
        >
          <MessageSquare size={14} />
          <span>Compare in Chatbot</span>
        </button>
      </div>
    </div>
  );
}
