'use client';

import React, { useState } from 'react';
import {
  Award,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Compass,
} from 'lucide-react';

export interface CriticEvaluationData {
  score: number;
  verdict: string;
  evaluatedAt: string;
  criticAgent: string;
  summaryFeedback: string;
  strengths: string[];
  limitations: string[];
  recommendedNextSteps: string[];
}

interface CriticEvaluationAccordionProps {
  evaluation: CriticEvaluationData;
  defaultOpen?: boolean;
}

export function CriticEvaluationAccordion({
  evaluation,
  defaultOpen = true,
}: CriticEvaluationAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const {
    score = 94,
    verdict = 'Publication-Grade Verified',
    evaluatedAt,
    criticAgent = 'Critic Chain (Autonomous Peer Review Engine)',
    summaryFeedback,
    strengths = [],
    limitations = [],
    recommendedNextSteps = [],
  } = evaluation;

  // Visual Gauge Calculation
  const strokeDashoffset = 283 - (283 * score) / 100;

  return (
    <section id="critic-evaluation-section" className="critic-evaluation-accordion-container">
      <div
        className="accordion-header-toggle"
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
      >
        <div className="toggle-left">
          <div className="critic-shield-badge">
            <ShieldCheck size={20} className="text-cyan" />
          </div>
          <div>
            <div className="flex-center gap-2">
              <h2 className="accordion-title">Critic Chain Autonomous Peer Review</h2>
              <span className="verdict-pill">{verdict}</span>
            </div>
            <p className="accordion-subtext">
              Rigorous factual verification, structural audit, and peer quality scoring
            </p>
          </div>
        </div>

        <div className="toggle-right">
          <div className="compact-score-display">
            <span className="label">SCORE:</span>
            <span className="score-val">{score}/100</span>
          </div>
          <button type="button" className="accordion-caret-btn" aria-label="Toggle details">
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="accordion-body-content">
          {/* Top Row: Circular Score Gauge & Executive Summary */}
          <div className="critic-overview-grid">
            {/* Visual Gauge */}
            <div className="gauge-card">
              <div className="circular-gauge-wrapper">
                <svg className="circular-gauge-svg" viewBox="0 0 100 100">
                  <circle
                    className="gauge-bg"
                    cx="50"
                    cy="50"
                    r="45"
                  />
                  <circle
                    className="gauge-fill"
                    cx="50"
                    cy="50"
                    r="45"
                    style={{ strokeDashoffset }}
                  />
                </svg>
                <div className="gauge-inner-text">
                  <span className="gauge-score">{score}</span>
                  <span className="gauge-max">/100</span>
                </div>
              </div>

              <div className="gauge-label-group">
                <span className="gauge-title">Quality & Factuality</span>
                <span className="gauge-verdict">{verdict}</span>
              </div>
            </div>

            {/* Critique Summary Notes */}
            <div className="critique-summary-card">
              <div className="card-badge">
                <Sparkles size={14} className="text-orange" />
                <span>EXECUTIVE AUDIT SUMMARY</span>
              </div>
              <p className="summary-paragraph">{summaryFeedback}</p>

              <div className="audit-metadata-line">
                <span className="meta-item">
                  <strong>Evaluator:</strong> {criticAgent}
                </span>
                <span className="meta-item">
                  <strong>Verified:</strong> {new Date(evaluatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Strengths vs Limitations Grid */}
          <div className="strengths-limitations-grid">
            {/* Identified Strengths */}
            <div className="evaluation-card strengths-card">
              <div className="card-header-row">
                <CheckCircle2 size={16} className="text-green" />
                <h3 className="card-heading">Key Strengths & Merits</h3>
              </div>
              <ul className="evaluation-points-list">
                {strengths.map((pt, i) => (
                  <li key={i} className="point-item green">
                    <span className="bullet-dot" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Identified Limitations & Gaps */}
            <div className="evaluation-card limitations-card">
              <div className="card-header-row">
                <AlertTriangle size={16} className="text-amber" />
                <h3 className="card-heading">Identified Limitations & Gaps</h3>
              </div>
              <ul className="evaluation-points-list">
                {limitations.map((pt, i) => (
                  <li key={i} className="point-item amber">
                    <span className="bullet-dot" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommended Research Trajectories */}
          {recommendedNextSteps.length > 0 && (
            <div className="next-steps-card">
              <div className="card-header-row">
                <Compass size={16} className="text-cyan" />
                <h3 className="card-heading">Recommended Future Investigation Trajectories</h3>
              </div>
              <div className="next-steps-grid">
                {recommendedNextSteps.map((step, idx) => (
                  <div key={idx} className="step-box">
                    <span className="step-num">0{idx + 1}</span>
                    <p className="step-desc">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
