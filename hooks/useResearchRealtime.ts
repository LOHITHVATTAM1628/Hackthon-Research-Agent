'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { AgentLog, SourceItem, ReportItem, ResearchRun, ResearchProject, StepStatus, AgentStageId } from '@/lib/supabase/types';

export interface UseResearchRealtimeOptions {
  runId: string;
  initialTopic?: string;
}

export function useResearchRealtime({ runId, initialTopic }: UseResearchRealtimeOptions) {
  const [project, setProject] = useState<ResearchProject | null>(null);
  const [run, setRun] = useState<ResearchRun | null>(null);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [report, setReport] = useState<ReportItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const startTimeRef = useRef<number | null>(null);
  const isCompletedRef = useRef<boolean>(false);

  // Compute stage statuses from logs and run status
  const getStageStatus = useCallback((stageId: AgentStageId): StepStatus => {
    if (run?.status === 'failed') {
      const stageLog = logs.find((l) => {
        if (stageId === 'search') return l.agent_name.includes('Search');
        if (stageId === 'reader') return l.agent_name.includes('Reader');
        if (stageId === 'writer') return l.agent_name.includes('Writer');
        if (stageId === 'critic') return l.agent_name.includes('Critic');
        return false;
      });
      if (stageLog?.status === 'failed') return 'failed';
    }

    if (run?.status === 'completed') return 'completed';

    const stageLogs = logs.filter((l) => {
      if (stageId === 'search') return l.agent_name.includes('Search');
      if (stageId === 'reader') return l.agent_name.includes('Reader');
      if (stageId === 'writer') return l.agent_name.includes('Writer');
      if (stageId === 'critic') return l.agent_name.includes('Critic');
      return false;
    });

    if (stageLogs.length === 0) return 'waiting';

    const hasCompleted = stageLogs.some((l) => l.status === 'completed');
    if (hasCompleted) return 'completed';

    const isRunning = stageLogs.some((l) => l.status === 'running');
    if (isRunning) return 'running';

    return 'waiting';
  }, [logs, run]);

  // Determine current active agent name
  const currentAgent = (() => {
    if (run?.status === 'completed') return 'Mission Complete';
    if (run?.status === 'failed') return 'Halted / Error';
    for (let i = logs.length - 1; i >= 0; i--) {
      if (logs[i].status === 'running') {
        return logs[i].agent_name;
      }
    }
    return logs.length > 0 ? logs[logs.length - 1].agent_name : 'Initializing Pipeline...';
  })();

  // Poll fallback function
  const fetchStatus = useCallback(async () => {
    if (!runId) return;
    try {
      const res = await fetch(`/api/research/${runId}/status`);
      if (!res.ok) {
        if (res.status === 404) return;
        throw new Error(`Status fetch error ${res.status}`);
      }
      const data = await res.json();
      if (data.project) setProject(data.project);
      if (data.run) {
        setRun(data.run);
        if (data.run.status === 'completed' || data.run.status === 'failed') {
          isCompletedRef.current = true;
        }
      }
      if (Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
      if (Array.isArray(data.sources)) {
        setSources(data.sources);
      }
      if (data.report) {
        setReport(data.report);
      }
      setIsLoading(false);
    } catch (err: unknown) {
      console.warn('Poll status error:', err);
    }
  }, [runId]);

  // Timer effect
  useEffect(() => {
    if (!runId) return;

    if (run?.started_at && !startTimeRef.current) {
      startTimeRef.current = new Date(run.started_at).getTime();
    } else if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    // If already completed, set final elapsed time and avoid running a perpetual interval
    if (isCompletedRef.current || run?.status === 'completed' || run?.status === 'failed') {
      if (run?.completed_at && startTimeRef.current) {
        const completedTime = new Date(run.completed_at).getTime();
        setElapsedSeconds(Math.max(0, Math.floor((completedTime - startTimeRef.current) / 1000)));
      }
      return;
    }

    const timer = setInterval(() => {
      if (isCompletedRef.current || run?.status === 'completed') {
        if (run?.completed_at && startTimeRef.current) {
          const completedTime = new Date(run.completed_at).getTime();
          setElapsedSeconds(Math.max(0, Math.floor((completedTime - startTimeRef.current) / 1000)));
        }
        clearInterval(timer);
        return;
      }
      if (startTimeRef.current) {
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000)));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [runId, run?.started_at, run?.completed_at, run?.status]);

  // Initial fetch and Realtime subscription
  useEffect(() => {
    if (!runId) return;

    let isMounted = true;
    let pollInterval: NodeJS.Timeout | null = null;

    fetchStatus();

    // Set up Supabase Realtime channel with unique scoped name
    const channelName = `run_telemetry_${runId}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_logs',
          filter: `research_run_id=eq.${runId}`,
        },
        (payload) => {
          if (!isMounted) return;
          const newLog = payload.new as AgentLog;
          setLogs((prev) => {
            if (prev.some((l) => l.id === newLog.id)) return prev;
            return [...prev, newLog];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'research_runs',
          filter: `id=eq.${runId}`,
        },
        (payload) => {
          if (!isMounted) return;
          const updatedRun = payload.new as ResearchRun;
          setRun(updatedRun);
          if (updatedRun.status === 'completed' || updatedRun.status === 'failed') {
            isCompletedRef.current = true;
            if (pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
            fetchStatus(); // fetch final report
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sources',
          filter: `research_run_id=eq.${runId}`,
        },
        () => {
          if (!isMounted) return;
          fetchStatus();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reports',
          filter: `research_run_id=eq.${runId}`,
        },
        (payload) => {
          if (!isMounted) return;
          setReport(payload.new as ReportItem);
          isCompletedRef.current = true;
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        }
      )
      .subscribe();

    // Polling fallback while running (every 3s)
    pollInterval = setInterval(() => {
      if (isCompletedRef.current) {
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
        return;
      }
      fetchStatus();
    }, 3000);

    return () => {
      isMounted = false;
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
      if (channel) {
        channel.unsubscribe().catch(() => {});
        supabase.removeChannel(channel).catch(() => {});
      }
    };
  }, [runId, fetchStatus]);

  return {
    project,
    run,
    logs,
    sources,
    report,
    isLoading,
    error,
    elapsedSeconds,
    currentAgent,
    getStageStatus,
    refresh: fetchStatus,
  };
}
