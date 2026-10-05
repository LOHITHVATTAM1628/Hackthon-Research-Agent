'use client';

import React, { useState, useMemo } from 'react';
import {
  ExternalLink,
  Search,
  Filter,
  Globe,
  Calendar,
  CheckCircle,
  Database,
  SlidersHorizontal,
} from 'lucide-react';
import { SourceItem } from '@/lib/supabase/types';

interface ExtendedSourceItem extends SourceItem {
  domain?: string;
}

interface SourceAuditInspectorProps {
  sources: ExtendedSourceItem[];
}

export function SourceAuditInspector({ sources }: SourceAuditInspectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [minRelevance, setMinRelevance] = useState<number>(0);

  // Extract unique domains
  const domains = useMemo(() => {
    const set = new Set<string>();
    sources.forEach((s) => {
      if (s.domain) {
        set.add(s.domain);
      } else {
        try {
          const d = new URL(s.url).hostname.replace(/^www\./, '');
          set.add(d);
        } catch {
          set.add('web');
        }
      }
    });
    return Array.from(set);
  }, [sources]);

  // Filter sources
  const filteredSources = useMemo(() => {
    return sources.filter((s) => {
      // Relevance check
      const score = s.relevance_score || 0.8;
      if (score < minRelevance) return false;

      // Domain check
      if (selectedDomain !== 'all') {
        const domain = s.domain || new URL(s.url).hostname.replace(/^www\./, '');
        if (domain !== selectedDomain) return false;
      }

      // Search query check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (s.title || '').toLowerCase().includes(q);
        const urlMatch = (s.url || '').toLowerCase().includes(q);
        const typeMatch = (s.source_type || '').toLowerCase().includes(q);
        if (!titleMatch && !urlMatch && !typeMatch) return false;
      }

      return true;
    });
  }, [sources, searchQuery, selectedDomain, minRelevance]);

  return (
    <section id="source-audit-section" className="source-audit-inspector-container">
      <div className="audit-header">
        <div className="audit-header-title-group">
          <div className="audit-icon-badge">
            <Database size={20} className="text-cyan" />
          </div>
          <div>
            <h2 className="audit-section-title">Interactive Source Audit & Evidence Base</h2>
            <p className="audit-section-desc">
              Audit all {sources.length} intelligence artifacts discovered, evaluated, and cited by the autonomous pipeline.
            </p>
          </div>
        </div>

        <div className="audit-stats-summary">
          <span className="audit-counter-pill">
            <strong>{filteredSources.length}</strong> of {sources.length} Displayed
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="audit-controls-panel no-print">
        <div className="audit-search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            id="input-source-search"
            className="audit-search-input"
            placeholder="Filter by keyword, title, or publication..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
            >
              ×
            </button>
          )}
        </div>

        <div className="audit-filters-group">
          {/* Domain Filter Dropdown */}
          <div className="domain-select-wrapper">
            <Globe size={14} className="text-muted" />
            <select
              id="select-source-domain"
              className="audit-filter-select"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
            >
              <option value="all">All Domains ({sources.length})</option>
              {domains.map((dom) => (
                <option key={dom} value={dom}>
                  {dom}
                </option>
              ))}
            </select>
          </div>

          {/* Min Relevance Score */}
          <div className="relevance-filter-wrapper">
            <SlidersHorizontal size={14} className="text-muted" />
            <select
              id="select-source-relevance"
              className="audit-filter-select"
              value={minRelevance}
              onChange={(e) => setMinRelevance(parseFloat(e.target.value))}
            >
              <option value={0}>Relevance: All</option>
              <option value={0.85}>High (&gt; 85%)</option>
              <option value={0.9}>Very High (&gt; 90%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sources Grid */}
      {filteredSources.length === 0 ? (
        <div className="audit-empty-state">
          <Filter size={28} className="text-muted mb-2" />
          <p className="empty-title">No sources match your current filter.</p>
          <button
            type="button"
            className="btn btn-secondary btn-sm mt-3"
            onClick={() => {
              setSearchQuery('');
              setSelectedDomain('all');
              setMinRelevance(0);
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="audit-sources-grid">
          {filteredSources.map((source, idx) => {
            const relScore = source.relevance_score || 0.85;
            const scorePercent = Math.round(relScore * 100);
            let domain = source.domain;
            if (!domain) {
              try {
                domain = new URL(source.url).hostname.replace(/^www\./, '');
              } catch {
                domain = 'web';
              }
            }

            return (
              <div key={source.id || idx} className="source-audit-card">
                <div className="card-top-row">
                  <div className="domain-pill">
                    <Globe size={12} className="text-cyan" />
                    <span>{domain}</span>
                  </div>

                  <div className="relevance-gauge-pill">
                    <span className="rel-label">Relevance:</span>
                    <strong className="rel-value">{scorePercent}%</strong>
                    <div className="rel-mini-bar">
                      <div
                        className="rel-mini-bar-fill"
                        style={{ width: `${scorePercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <h3 className="source-card-title">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-title-link"
                    title={source.title || source.url}
                  >
                    {source.title || source.url}
                  </a>
                </h3>

                <div className="source-card-meta">
                  <span className="source-type-tag">
                    {source.source_type ? source.source_type.replace(/_/g, ' ') : 'verified citation'}
                  </span>
                  {source.published_date && (
                    <span className="source-date-tag">
                      <Calendar size={12} />
                      {source.published_date}
                    </span>
                  )}
                </div>

                <div className="source-card-footer">
                  <span className="citation-index">Ref [{idx + 1}]</span>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="open-link-btn"
                  >
                    <span>Open Original Link</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
