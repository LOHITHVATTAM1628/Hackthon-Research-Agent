export type UserRole = 'researcher' | 'admin';

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export type ProjectStatus = 'idle' | 'researching' | 'completed' | 'failed';
export type RunStatus = 'queued' | 'running' | 'completed' | 'failed';
export type AgentStageId = 'search' | 'reader' | 'writer' | 'critic';
export type StepStatus = 'waiting' | 'running' | 'completed' | 'failed';

export interface ResearchProject {
  id: string;
  user_id?: string | null;
  topic: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface ResearchRun {
  id: string;
  research_project_id: string;
  status: RunStatus;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface SourceItem {
  id: string;
  research_run_id: string;
  url: string;
  title: string | null;
  source_type: string | null;
  published_date: string | null;
  relevance_score: number | null;
  created_at: string;
}

export interface AgentLog {
  id: string;
  research_run_id: string;
  agent_name: string;
  status: string;
  message: string;
  timestamp: string;
}

export interface ReportItem {
  id: string;
  research_project_id: string;
  research_run_id: string;
  content: string;
  version: number;
  created_at: string;
}

export interface TelemetryStats {
  sourcesScanned: number;
  verifiedLinks: number;
  currentAgent: string;
  elapsedSeconds: number;
  score?: number;
}

export interface CollaborationItem {
  id: string;
  researcher_a: string;
  researcher_b: string;
  research_topic: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  researcher_a_user?: UserProfile | null;
  researcher_b_user?: UserProfile | null;
  project?: ResearchProject | null;
}

export interface NotificationItem {
  id: string;
  recipient_id: string;
  type: string;
  message: string;
  related_research_id?: string | null;
  read_status: boolean;
  created_at: string;
}

export interface ComparisonResult {
  summary_of_changes: string;
  unchanged_facts: string[];
  new_developments: string[];
  outdated_information: string[];
  new_sources_discovered: string[];
  recommended_additions: string[];
}

export interface ResearchComparisonItem {
  id: string;
  old_report_id: string;
  new_report_id: string;
  comparison_result: ComparisonResult;
  created_at: string;
  old_report?: ReportItem | null;
  new_report?: ReportItem | null;
}


