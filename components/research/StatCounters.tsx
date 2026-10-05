'use client';

import React from 'react';
import { Globe, Link2, Cpu, Timer, ShieldCheck } from 'lucide-react';

interface StatCountersProps {
  sourcesScanned: number;
  verifiedLinks: number;
  currentAgent: string;
  elapsedSeconds: number;
  qualityScore?: number | null;
}

export function StatCounters({
  sourcesScanned,
  verifiedLinks,
  currentAgent,
  elapsedSeconds,
  qualityScore,
}: StatCountersProps) {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="stat-counters-grid">
      {/* 1. Sources Scanned */}
      <div className="telemetry-stat-card">
        <div className="stat-icon-wrap cyan">
          <Globe size={20} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Sources Discovered</span>
          <span className="stat-value">{sourcesScanned}</span>
        </div>
      </div>

      {/* 2. Verified Links */}
      <div className="telemetry-stat-card">
        <div className="stat-icon-wrap orange">
          <Link2 size={20} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Verified Links</span>
          <span className="stat-value">{verifiedLinks}</span>
        </div>
      </div>

      {/* 3. Active Agent */}
      <div className="telemetry-stat-card">
        <div className="stat-icon-wrap green">
          <Cpu size={20} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Active Subsystem</span>
          <span className="stat-value active-agent-text">{currentAgent}</span>
        </div>
      </div>

      {/* 4. Elapsed Timer or Quality Score */}
      <div className="telemetry-stat-card">
        <div className="stat-icon-wrap purple">
          {qualityScore ? <ShieldCheck size={20} /> : <Timer size={20} />}
        </div>
        <div className="stat-info">
          <span className="stat-label">
            {qualityScore ? 'Quality Score' : 'Execution Time'}
          </span>
          <span className="stat-value timer-text">
            {qualityScore ? `${qualityScore}/100` : formatTime(elapsedSeconds)}
          </span>
        </div>
      </div>
    </div>
  );
}
