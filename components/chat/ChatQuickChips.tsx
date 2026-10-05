'use client';

import React from 'react';
import { Sparkles, HelpCircle, AlertTriangle, Link2, GitCompare, Lightbulb, Compass, Cpu, BatteryCharging, ShieldAlert, Stethoscope } from 'lucide-react';

interface ChatQuickChipsProps {
  mode: 'compare' | 'general';
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

export function ChatQuickChips({ mode, onSelectPrompt, disabled }: ChatQuickChipsProps) {
  const compareChips = [
    {
      label: 'What changed since this report was created?',
      icon: <GitCompare size={13} className="text-orange" />,
    },
    {
      label: 'Find outdated statistics or claims in this report.',
      icon: <AlertTriangle size={13} className="text-rose" />,
    },
    {
      label: 'What crucial new developments should I add?',
      icon: <Lightbulb size={13} className="text-amber" />,
    },
    {
      label: 'Suggest 3 recent authoritative sources to cite.',
      icon: <Link2 size={13} className="text-cyan" />,
    },
  ];

  const generalChips = [
    {
      label: 'Compare state-of-the-art multi-agent consensus protocols.',
      icon: <Cpu size={13} className="text-cyan" />,
    },
    {
      label: 'Analyze 2026 breakthroughs in solid-state battery energy density.',
      icon: <BatteryCharging size={13} className="text-emerald" />,
    },
    {
      label: 'Explain Byzantine Fault Tolerance in autonomous LLM swarms.',
      icon: <ShieldAlert size={13} className="text-purple" />,
    },
    {
      label: 'Evaluate clinical trials of AI oncology diagnostics in 2026.',
      icon: <Stethoscope size={13} className="text-rose" />,
    },
  ];

  const chips = mode === 'compare' ? compareChips : generalChips;

  return (
    <div className="chat-quick-chips-wrapper">
      <div className="quick-chips-header">
        <Sparkles size={12} className="text-orange" />
        <span>Suggested Inquiries</span>
      </div>
      <div className="quick-chips-grid">
        {chips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            className="quick-chip-btn"
            disabled={disabled}
            onClick={() => onSelectPrompt(chip.label)}
          >
            <span className="chip-icon">{chip.icon}</span>
            <span className="chip-text">{chip.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
