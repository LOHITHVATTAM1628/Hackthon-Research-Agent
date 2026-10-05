'use client';

import React from 'react';
import { Search, BookOpen, PenTool, Award, CheckCircle2, Clock, AlertTriangle, Loader2, LucideIcon } from 'lucide-react';
import { AgentStageId, StepStatus } from '@/lib/supabase/types';

interface StageConfig {
  id: AgentStageId;
  stageNumber: string;
  name: string;
  engine: string;
  description: string;
  icon: LucideIcon;
}

const STAGES: StageConfig[] = [
  {
    id: 'search',
    stageNumber: '01',
    name: 'Search Agent',
    engine: 'Tavily API & Groq Query Planner',
    description: 'Generates high-intent query vectors & discovers authoritative web sources.',
    icon: Search,
  },
  {
    id: 'reader',
    stageNumber: '02',
    name: 'Reader Agent',
    engine: 'Groq Extraction & Scoring',
    description: 'Parses snippets, evaluates relevance, and extracts empirical data points.',
    icon: BookOpen,
  },
  {
    id: 'writer',
    stageNumber: '03',
    name: 'Writer Chain',
    engine: 'Groq Deep Synthesis Engine',
    description: 'Synthesizes insights into a 5-part rigorous technical research report.',
    icon: PenTool,
  },
  {
    id: 'critic',
    stageNumber: '04',
    name: 'Critic Chain',
    engine: 'Groq Peer Review & Scoring',
    description: 'Audits factual coherence, polishes clarity, and scores report quality (0-100).',
    icon: Award,
  },
];

interface StageStepperProps {
  getStageStatus: (stageId: AgentStageId) => StepStatus;
}

export function StageStepper({ getStageStatus }: StageStepperProps) {
  return (
    <div className="pipeline-stepper-container">
      <div className="stepper-grid">
        {STAGES.map((stage, index) => {
          const status = getStageStatus(stage.id);
          const Icon = stage.icon;

          return (
            <div
              key={stage.id}
              className={`stage-card ${status} relative`}
            >
              {/* Connector line between steps */}
              {index < STAGES.length - 1 && (
                <div className={`stage-connector ${status === 'completed' ? 'active' : ''}`} />
              )}

              <div className="stage-card-header">
                <div className="stage-num-badge">
                  <span className="mono-num">{stage.stageNumber}</span>
                </div>
                <div className="stage-status-indicator">
                  {status === 'running' && (
                    <span className="status-pill running">
                      <Loader2 size={12} className="animate-spin" />
                      RUNNING
                    </span>
                  )}
                  {status === 'completed' && (
                    <span className="status-pill completed">
                      <CheckCircle2 size={12} />
                      COMPLETED
                    </span>
                  )}
                  {status === 'failed' && (
                    <span className="status-pill failed">
                      <AlertTriangle size={12} />
                      FAILED
                    </span>
                  )}
                  {status === 'waiting' && (
                    <span className="status-pill waiting">
                      <Clock size={12} />
                      WAITING
                    </span>
                  )}
                </div>
              </div>

              <div className="stage-card-body">
                <div className="stage-icon-wrap">
                  <Icon size={24} className="stage-icon" />
                </div>
                <h4 className="stage-title">{stage.name}</h4>
                <div className="stage-engine">{stage.engine}</div>
                <p className="stage-desc">{stage.description}</p>
              </div>

              {status === 'running' && (
                <div className="stage-glow-border" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
