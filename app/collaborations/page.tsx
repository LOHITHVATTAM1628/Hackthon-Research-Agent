'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Mail,
  Send,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Shield,
  Loader2,
  RefreshCw,
  MessageSquare,
  FileText,
  UserCheck,
  Inbox,
  AlertCircle,
} from 'lucide-react';

interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface EnrichedCollaboration {
  id: string;
  researcher_a: string;
  researcher_b: string;
  research_topic: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  researcher_a_user: CollaborationUser;
  researcher_b_user: CollaborationUser;
  project?: {
    id: string;
    topic: string;
    status: string;
    created_at: string;
  } | null;
  isOwner: boolean;
}

export default function CollaborationsPage() {
  const { user, profile, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');
  const [collaborations, setCollaborations] = useState<EnrichedCollaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Quick Note modal state
  const [noteModalCollab, setNoteModalCollab] = useState<EnrichedCollaboration | null>(null);
  const [noteMessage, setNoteMessage] = useState('');
  const [sendingNote, setSendingNote] = useState(false);

  const fetchCollaborations = useCallback(async () => {
    setLoading(true);
    try {
      const currentId = user?.id || '135a077d-43f4-4e02-a0b9-39d6480eb9f3';
      const res = await fetch(`/api/collaborations?userId=${currentId}`);
      if (!res.ok) throw new Error('Failed to load collaborations');
      const data = await res.json();
      setCollaborations(data.collaborations || []);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Fetch collaborations error:', error);
      addToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, addToast]);

  useEffect(() => {
    fetchCollaborations();
  }, [fetchCollaborations]);

  const handleAction = async (collaborationId: string, action: 'accept' | 'decline') => {
    setProcessingId(collaborationId);
    try {
      const res = await fetch('/api/collaborations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collaborationId,
          action,
          responderName: profile?.name || user?.email?.split('@')[0] || 'Research Lead',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action} collaboration`);

      addToast(data.message || `Collaboration ${action}ed successfully!`, 'success');
      await fetchCollaborations();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      addToast(error.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSendQuickNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteModalCollab || !noteMessage.trim()) return;

    setSendingNote(true);
    try {
      const partner = noteModalCollab.isOwner
        ? noteModalCollab.researcher_b_user
        : noteModalCollab.researcher_a_user;

      const currentUserName = profile?.name || user?.email?.split('@')[0] || 'Peer Researcher';

      // Send in-app notification directly to partner
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: partner.id,
          type: 'collaboration_note',
          message: `${currentUserName} sent a sync note on "${noteModalCollab.research_topic}": "${noteMessage.trim()}"`,
          relatedResearchId: noteModalCollab.project?.id || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to dispatch notification note');

      addToast(`Sync note sent directly to ${partner.name}!`, 'success');
      setNoteModalCollab(null);
      setNoteMessage('');
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      addToast(error.message, 'error');
    } finally {
      setSendingNote(false);
    }
  };

  // Filter groups
  const activeCollabs = collaborations.filter((c) => c.status === 'accepted');
  const pendingIncoming = collaborations.filter(
    (c) => c.status === 'pending' && c.isOwner
  );
  const pendingOutgoing = collaborations.filter(
    (c) => c.status === 'pending' && !c.isOwner
  );
  const totalPending = pendingIncoming.length + pendingOutgoing.length;

  return (
    <div className="collaborations-page-wrapper">
      {/* Page Header */}
      <section className="collab-hero-header">
        <div className="collab-hero-inner">
          <div className="collab-hero-title-group">
            <div className="section-badge">
              <Users size={14} className="text-cyan" />
              <span>Multi-Agent Research Ecosystem</span>
            </div>
            <h1 className="collab-page-title">
              Researcher <span className="gradient-text">Collaboration Hub</span>
            </h1>
            <p className="collab-page-subtitle">
              Synchronize cross-functional research efforts, resolve duplicate investigations, and establish
              co-investigator partnerships across the platform.
            </p>
          </div>

          <div className="collab-header-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={fetchCollaborations}
              disabled={loading}
              title="Refresh collaborations"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>Sync</span>
            </button>
            <Link href="/dashboard" className="btn btn-primary btn-sm">
              <span>Start New Inquiry</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="collab-stats-row">
          <div className="collab-stat-box">
            <div className="stat-icon-wrap cyan">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="stat-number">{activeCollabs.length}</div>
              <div className="stat-lbl">Active Partnerships</div>
            </div>
          </div>

          <div className="collab-stat-box">
            <div className="stat-icon-wrap orange">
              <Clock size={20} />
            </div>
            <div>
              <div className="stat-number">{pendingIncoming.length}</div>
              <div className="stat-lbl">Requests Awaiting You</div>
            </div>
          </div>

          <div className="collab-stat-box">
            <div className="stat-icon-wrap purple">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="stat-number">{collaborations.length}</div>
              <div className="stat-lbl">Total Engagements</div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="collab-tabs-nav">
          <button
            type="button"
            className={`collab-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            <Users size={16} />
            <span>Active Collaborations</span>
            <span className="tab-counter-badge">{activeCollabs.length}</span>
          </button>

          <button
            type="button"
            className={`collab-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <Inbox size={16} />
            <span>Pending Requests</span>
            {totalPending > 0 && (
              <span className={`tab-counter-badge ${pendingIncoming.length > 0 ? 'highlight' : ''}`}>
                {totalPending}
              </span>
            )}
          </button>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="collab-content-container">
        {loading ? (
          <div className="collab-loading-state">
            <Loader2 size={36} className="animate-spin text-orange mb-3" />
            <p className="text-secondary">Retrieving researcher partnerships and pending invitations...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: ACTIVE COLLABORATIONS */}
            {activeTab === 'active' && (
              <div className="active-collabs-section">
                {activeCollabs.length === 0 ? (
                  <div className="empty-collab-card">
                    <div className="empty-icon-ring">
                      <Users size={32} className="text-muted" />
                    </div>
                    <h3 className="empty-title">No Active Collaborations Yet</h3>
                    <p className="empty-desc">
                      When you or a peer researcher approve a collaboration request on similar topics, your shared
                      inquiries, research reports, and communication channels will appear here.
                    </p>
                    <Link href="/dashboard" className="btn btn-primary mt-4">
                      <span>Explore Inquiries on Dashboard</span>
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                ) : (
                  <div className="collabs-grid">
                    {activeCollabs.map((collab) => {
                      const partner = collab.isOwner
                        ? collab.researcher_b_user
                        : collab.researcher_a_user;
                      const partnerRole = collab.isOwner ? 'Co-Investigator' : 'Project Lead';
                      const currentUserName = profile?.name || user?.email?.split('@')[0] || 'Researcher';

                      const mailtoSubject = encodeURIComponent(
                        `Research Collaboration: ${collab.research_topic}`
                      );
                      const mailtoBody = encodeURIComponent(
                        `Hi ${partner.name},\n\nI am contacting you regarding our active collaboration on "${collab.research_topic}" via the ResearchMind platform.\n\nLet's coordinate on next steps and review the latest agent outputs.\n\nBest regards,\n${currentUserName}`
                      );
                      const mailtoUrl = `mailto:${partner.email}?subject=${mailtoSubject}&body=${mailtoBody}`;

                      return (
                        <div key={collab.id} className="collab-card">
                          <div className="collab-card-header">
                            <div className="partner-profile-group">
                              <div className="partner-avatar">
                                {partner.name?.charAt(0).toUpperCase() || 'R'}
                              </div>
                              <div>
                                <h4 className="partner-name">{partner.name}</h4>
                                <div className="partner-email-role">
                                  <span>{partner.email}</span>
                                  <span className="role-tag">{partnerRole}</span>
                                </div>
                              </div>
                            </div>
                            <span className="status-badge-active">
                              <span className="pulsing-green-dot" />
                              Active
                            </span>
                          </div>

                          <div className="collab-topic-block">
                            <span className="topic-field-label">Shared Research Inquiry:</span>
                            <h3 className="topic-text">"{collab.research_topic}"</h3>
                            <div className="topic-created-date">
                              <Clock size={12} />
                              <span>
                                Established{' '}
                                {new Date(collab.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>

                          {collab.project && (
                            <div className="linked-project-banner">
                              <div className="linked-info">
                                <FileText size={15} className="text-cyan" />
                                <span>Linked Project: <strong>{collab.project.topic}</strong></span>
                              </div>
                              <span className="status-tag-micro">
                                {collab.project.status.toUpperCase()}
                              </span>
                            </div>
                          )}

                          <div className="collab-card-actions">
                            <a
                              href={mailtoUrl}
                              className="btn btn-secondary btn-sm"
                              title="Send pre-formatted email to partner"
                            >
                              <Mail size={14} className="text-orange" />
                              <span>Contact via Email</span>
                            </a>

                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setNoteModalCollab(collab)}
                              title="Send instant in-app sync note"
                            >
                              <MessageSquare size={14} className="text-cyan" />
                              <span>Sync Note</span>
                            </button>

                            {collab.project?.id && (
                              <Link
                                href={`/research/${collab.project.id}/report`}
                                className="btn btn-ghost btn-sm"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <span>Report</span>
                                <ExternalLink size={13} />
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PENDING REQUESTS */}
            {activeTab === 'pending' && (
              <div className="pending-requests-section">
                {/* 1. Inbound Requests (Where user is researcher_a) */}
                <div className="pending-subsection">
                  <div className="subsection-header">
                    <h3 className="subsection-title">
                      Incoming Collaboration Invitations ({pendingIncoming.length})
                    </h3>
                    <p className="subsection-subtext">
                      Peer researchers requesting to partner on your existing research inquiries.
                    </p>
                  </div>

                  {pendingIncoming.length === 0 ? (
                    <div className="empty-subcard">
                      <CheckCircle2 size={24} className="text-emerald mb-2" />
                      <p className="text-sm text-secondary">
                        No pending incoming invitations at this time. You're all caught up!
                      </p>
                    </div>
                  ) : (
                    <div className="inbound-list">
                      {pendingIncoming.map((req) => (
                        <div key={req.id} className="pending-request-card">
                          <div className="request-card-main">
                            <div className="req-sender-info">
                              <div className="partner-avatar">
                                {req.researcher_b_user.name?.charAt(0).toUpperCase() || 'P'}
                              </div>
                              <div>
                                <h4 className="partner-name">
                                  {req.researcher_b_user.name}
                                </h4>
                                <p className="partner-email-role">
                                  {req.researcher_b_user.email} ·{' '}
                                  <span className="role-tag">{req.researcher_b_user.role}</span>
                                </p>
                              </div>
                            </div>

                            <div className="req-inquiry-box">
                              <span className="req-topic-label">Inquiry Overlap:</span>
                              <p className="req-topic-title">"{req.research_topic}"</p>
                              <span className="req-time-stamp">
                                <Clock size={12} className="inline mr-1" />
                                Requested on{' '}
                                {new Date(req.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>

                          <div className="request-card-actions">
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleAction(req.id, 'accept')}
                              disabled={processingId === req.id}
                            >
                              {processingId === req.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <CheckCircle2 size={14} />
                              )}
                              <span>Accept Partnership</span>
                            </button>

                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleAction(req.id, 'decline')}
                              disabled={processingId === req.id}
                            >
                              <XCircle size={14} />
                              <span>Decline</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Outbound Requests (Where user is researcher_b) */}
                <div className="pending-subsection mt-5">
                  <div className="subsection-header">
                    <h3 className="subsection-title">
                      Your Outgoing Requests ({pendingOutgoing.length})
                    </h3>
                    <p className="subsection-subtext">
                      Collaboration requests you sent to other researchers awaiting their response.
                    </p>
                  </div>

                  {pendingOutgoing.length === 0 ? (
                    <div className="empty-subcard">
                      <p className="text-sm text-secondary">
                        You have no outgoing invitations awaiting lead researcher review.
                      </p>
                    </div>
                  ) : (
                    <div className="inbound-list">
                      {pendingOutgoing.map((req) => (
                        <div key={req.id} className="pending-request-card outgoing">
                          <div className="request-card-main">
                            <div className="req-sender-info">
                              <div className="partner-avatar neutral">
                                {req.researcher_a_user.name?.charAt(0).toUpperCase() || 'L'}
                              </div>
                              <div>
                                <h4 className="partner-name">
                                  Lead: {req.researcher_a_user.name}
                                </h4>
                                <p className="partner-email-role">{req.researcher_a_user.email}</p>
                              </div>
                            </div>

                            <div className="req-inquiry-box">
                              <span className="req-topic-label">Inquiry Requested:</span>
                              <p className="req-topic-title">"{req.research_topic}"</p>
                            </div>
                          </div>

                          <div className="outgoing-status-pill">
                            <Clock size={13} className="text-orange animate-pulse" />
                            <span>Awaiting Lead Decision</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* QUICK NOTE SYNC MODAL */}
      {noteModalCollab && (
        <div className="modal-backdrop-blur">
          <div className="modal-dialog-card sync-note-modal" role="dialog" aria-modal="true">
            <div className="modal-header-clean">
              <div className="flex-center gap-2">
                <MessageSquare size={18} className="text-cyan" />
                <h3 className="text-white font-heading">
                  Send Sync Note to{' '}
                  {noteModalCollab.isOwner
                    ? noteModalCollab.researcher_b_user.name
                    : noteModalCollab.researcher_a_user.name}
                </h3>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setNoteModalCollab(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendQuickNote} className="modal-body-form">
              <div className="topic-context-banner">
                <span className="text-xs text-muted">Topic Context:</span>
                <p className="text-sm font-semibold text-white">
                  "{noteModalCollab.research_topic}"
                </p>
              </div>

              <label className="input-label" htmlFor="sync-note-text">
                Your In-App Message / Update:
              </label>
              <textarea
                id="sync-note-text"
                rows={4}
                className="collab-note-textarea"
                placeholder="Share a milestone, request agent parameter adjustment, or propose next investigation steps..."
                value={noteMessage}
                onChange={(e) => setNoteMessage(e.target.value)}
                required
                disabled={sendingNote}
              />

              <div className="modal-actions-right">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setNoteModalCollab(null)}
                  disabled={sendingNote}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={sendingNote || !noteMessage.trim()}
                >
                  {sendingNote ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Dispatch Note</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
