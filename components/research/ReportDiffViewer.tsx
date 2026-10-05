'use client';

import React, { useState, useEffect } from 'react';
import { GitCompare, Plus, Minus, ArrowRight, RefreshCw, Sparkles, Layers, CheckCircle2 } from 'lucide-react';
import { ReportItem } from '@/lib/supabase/types';
import { DiffLine, ReportDiffResult, computeReportDiff } from '@/lib/diff/engine';
import { useToast } from '@/components/ui/Toast';

interface ReportDiffViewerProps {
  projectId: string;
  currentReport: ReportItem;
  topic: string;
  onEvolutionStarted?: () => void;
}

export function ReportDiffViewer({
  projectId,
  currentReport,
  topic,
  onEvolutionStarted,
}: ReportDiffViewerProps) {
  const [versions, setVersions] = useState<ReportItem[]>([]);
  const [vOld, setVOld] = useState<number>(1);
  const [vNew, setVNew] = useState<number>(currentReport.version || 1);
  const [diffResult, setDiffResult] = useState<ReportDiffResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEvolving, setIsEvolving] = useState<boolean>(false);
  const [focusPrompt, setFocusPrompt] = useState<string>('');
  const [showEvolveModal, setShowEvolveModal] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');

  const { addToast } = useToast();

  const fetchVersions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/research/${projectId}/versions`);
      const data = await res.json();
      if (Array.isArray(data.reports) && data.reports.length > 0) {
        setVersions(data.reports);
        const maxV = Math.max(...data.reports.map((r: ReportItem) => r.version));
        const minV = Math.min(...data.reports.map((r: ReportItem) => r.version));
        setVNew(maxV);
        setVOld(maxV > minV ? maxV - 1 : minV);

        // Compute initial diff
        const oldR = data.reports.find((r: ReportItem) => r.version === (maxV > minV ? maxV - 1 : minV));
        const newR = data.reports.find((r: ReportItem) => r.version === maxV);
        if (oldR && newR) {
          setDiffResult(computeReportDiff(oldR.content, newR.content));
        }
      }
    } catch (err) {
      console.warn('Error fetching versions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [projectId]);

  const handleCompare = (oldVer: number, newVer: number) => {
    setVOld(oldVer);
    setVNew(newVer);
    const oldR = versions.find((r) => r.version === oldVer);
    const newR = versions.find((r) => r.version === newVer);
    if (oldR && newR) {
      setDiffResult(computeReportDiff(oldR.content, newR.content));
    }
  };

  const handleLaunchEvolution = async () => {
    setIsEvolving(true);
    try {
      const res = await fetch(`/api/research/${projectId}/evolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focusPrompt }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start evolution');

      addToast(`Evolution to Version ${data.targetVersion}.0 launched!`, 'success');
      setShowEvolveModal(false);
      setFocusPrompt('');
      if (onEvolutionStarted) {
        onEvolutionStarted();
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      addToast(error.message, 'error');
    } finally {
      setIsEvolving(false);
    }
  };

  return (
    <div className="diff-viewer-card">
      {/* Header Bar */}
      <div className="diff-header-bar">
        <div className="flex-center gap-2">
          <GitCompare size={20} className="text-cyan" />
          <div>
            <h3 className="section-title-sm">Report Version Evolution & Diff Engine</h3>
            <p className="mono-subtext">Semantic & line-level diffing across research iterations</p>
          </div>
        </div>

        <div className="flex-center gap-3">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowEvolveModal(true)}
          >
            <Sparkles size={14} />
            <span>Evolve to Next Version</span>
          </button>
        </div>
      </div>

      {/* Version Selector & Diff Metrics */}
      <div className="diff-controls-bar">
        <div className="version-selector-group">
          <span className="mono-label">Compare:</span>
          <select
            className="version-select"
            value={vOld}
            onChange={(e) => handleCompare(parseInt(e.target.value, 10), vNew)}
          >
            {versions.map((v) => (
              <option key={v.version} value={v.version}>
                Version {v.version}.0 ({new Date(v.created_at).toLocaleDateString()})
              </option>
            ))}
          </select>

          <ArrowRight size={14} className="text-muted" />

          <select
            className="version-select"
            value={vNew}
            onChange={(e) => handleCompare(vOld, parseInt(e.target.value, 10))}
          >
            {versions.map((v) => (
              <option key={v.version} value={v.version}>
                Version {v.version}.0 ({new Date(v.created_at).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        {diffResult && (
          <div className="diff-stats-pills">
            <span className="stat-pill added">
              <Plus size={12} />
              {diffResult.stats.addedLines} Additions
            </span>
            <span className="stat-pill removed">
              <Minus size={12} />
              {diffResult.stats.removedLines} Deletions
            </span>
            <span className="stat-pill neutral">
              {diffResult.stats.changePercentage}% Modified
            </span>
          </div>
        )}
      </div>

      {/* Diff Content View */}
      {isLoading ? (
        <div className="diff-empty-state">
          <RefreshCw size={24} className="animate-spin text-cyan mb-2" />
          <p>Analyzing document diffs...</p>
        </div>
      ) : !diffResult || versions.length < 2 ? (
        <div className="diff-empty-state">
          <Layers size={36} className="text-gray mb-2 opacity-50" />
          <h4 className="text-white mb-1">Baseline Version 1.0 Active</h4>
          <p className="text-muted text-center max-w-md">
            This project currently has 1 baseline publication. Click <strong>"Evolve to Next Version"</strong> to scan the web for recent discoveries and see side-by-side diffs.
          </p>
        </div>
      ) : (
        <div className="diff-stream-container font-mono">
          {diffResult.lines.map((line, idx) => {
            if (line.type === 'added') {
              return (
                <div key={idx} className="diff-line diff-added">
                  <span className="diff-prefix">+</span>
                  <span className="diff-text">{line.value}</span>
                </div>
              );
            }
            if (line.type === 'removed') {
              return (
                <div key={idx} className="diff-line diff-removed">
                  <span className="diff-prefix">-</span>
                  <span className="diff-text">{line.value}</span>
                </div>
              );
            }
            return (
              <div key={idx} className="diff-line diff-unchanged">
                <span className="diff-prefix">&nbsp;</span>
                <span className="diff-text">{line.value}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Evolution Modal */}
      {showEvolveModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div className="flex-center gap-2">
                <Sparkles size={18} className="text-orange" />
                <h3 className="text-white font-heading">Evolve Research Publication</h3>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowEvolveModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p className="text-muted mb-3 text-sm">
                The Evolution Swarm will retain the core foundations of <strong>"{topic}"</strong> while scanning Tavily for newer 2026 data points, updated benchmarks, and counterarguments.
              </p>

              <label className="text-xs mono-label text-secondary block mb-1">
                Optional: Custom Focus or Investigation Angle
              </label>
              <textarea
                className="input-field mb-4"
                rows={3}
                placeholder="e.g. Focus specifically on recent 2026 enterprise migrations, hardware scalability constraints, or cost benchmarks..."
                value={focusPrompt}
                onChange={(e) => setFocusPrompt(e.target.value)}
              />
            </div>

            <div className="modal-footer flex-between">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowEvolveModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleLaunchEvolution}
                disabled={isEvolving}
              >
                {isEvolving ? 'Launching Swarm...' : `Evolve to Version ${(currentReport.version || 1) + 1}.0`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
