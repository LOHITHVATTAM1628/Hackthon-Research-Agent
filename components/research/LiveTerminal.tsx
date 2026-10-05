'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Copy, Check, Radio } from 'lucide-react';
import { AgentLog } from '@/lib/supabase/types';

interface LiveTerminalProps {
  logs: AgentLog[];
  isRunning?: boolean;
}

export function LiveTerminal({ logs, isRunning = false }: LiveTerminalProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleCopy = () => {
    const text = logs
      .map(
        (l) =>
          `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.agent_name.toUpperCase()}] [${l.status.toUpperCase()}]: ${l.message}`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getAgentColor = (name: string) => {
    if (name.includes('Search')) return 'agent-tag-search';
    if (name.includes('Reader')) return 'agent-tag-reader';
    if (name.includes('Writer')) return 'agent-tag-writer';
    if (name.includes('Critic')) return 'agent-tag-critic';
    return 'agent-tag-system';
  };

  const getStatusColor = (status: string) => {
    if (status === 'completed') return 'status-text-completed';
    if (status === 'running') return 'status-text-running';
    if (status === 'failed') return 'status-text-failed';
    return 'status-text-info';
  };

  return (
    <div className="terminal-card">
      {/* Terminal Title Bar */}
      <div className="terminal-header">
        <div className="terminal-header-left">
          <div className="terminal-window-buttons">
            <span className="dot dot-red" />
            <span className="dot dot-yellow" />
            <span className="dot dot-green" />
          </div>
          <div className="terminal-title">
            <Terminal size={14} className="terminal-title-icon" />
            <span>TELEMETRY_LOGS // AGENT_FEED</span>
          </div>
        </div>

        <div className="terminal-header-right">
          <div className="realtime-status-pill">
            <Radio size={12} className={isRunning ? 'animate-pulse text-green' : 'text-gray'} />
            <span className="mono-subtext">{isRunning ? 'STREAMING' : 'IDLE'}</span>
          </div>

          <button
            type="button"
            className="terminal-action-btn"
            onClick={() => setAutoScroll(!autoScroll)}
            title="Toggle autoscroll"
          >
            Auto-Scroll: {autoScroll ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            className="terminal-action-btn"
            onClick={handleCopy}
            title="Copy logs"
          >
            {copied ? <Check size={13} className="text-green" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Terminal Logs Content */}
      <div className="terminal-body font-mono">
        {logs.length === 0 ? (
          <div className="terminal-empty-state">
            <span className="terminal-prompt">$</span>
            <span className="terminal-cursor animate-blink" />
            <p className="terminal-placeholder">
              Awaiting telemetry broadcast from Autonomous Orchestrator...
            </p>
          </div>
        ) : (
          <div className="logs-stream">
            {logs.map((log) => {
              const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div key={log.id} className="terminal-log-line">
                  <span className="log-timestamp">{timeStr}</span>
                  <span className={`log-agent-badge ${getAgentColor(log.agent_name)}`}>
                    {log.agent_name}
                  </span>
                  <span className={`log-status-tag ${getStatusColor(log.status)}`}>
                    [{log.status.toUpperCase()}]
                  </span>
                  <span className="log-message">{log.message}</span>
                </div>
              );
            })}

            {isRunning && (
              <div className="terminal-active-line">
                <span className="terminal-prompt">agent@researcher:~$</span>
                <span className="terminal-cursor animate-blink" />
              </div>
            )}
            <div ref={terminalEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
