// SYSTEM — Types de la base de données (miroir de supabase/schema.sql)

export type ActivityType = 'chrono' | 'count' | 'check';
export type Recurrence = 'none' | 'daily' | 'weekdays' | 'weekly' | 'custom';
export type ProjectStatus = 'active' | 'termine' | 'archive';

export interface Profile {
  id: string;
  username: string;
  created_at: string;
}

export interface SuperProject {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  archived: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  super_project_id: string | null;
  title: string;
  description: string | null;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  deadline: string | null;
  reminder_days: number;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  type: ActivityType;
  target_value: number | null;
  target_duration: number | null;
  estimated_duration: number | null;
  difficulty: number | null;
  recurrence: Recurrence;
  recurrence_days: number[] | null;
  reminder_time: string | null;
  deadline: string | null;
  tags: string[] | null;
  notes: string | null;
  archived: boolean;
  created_at: string;
}

export interface Session {
  id: string;
  activity_id: string;
  started_at: string;
  ended_at: string | null;
  duration_sec: number | null;
}

export interface Completion {
  id: string;
  activity_id: string;
  day: string; // date ISO YYYY-MM-DD
  value: number;
  done: boolean;
}

export interface Quote {
  id: string;
  text: string;
  author: string;
  source: string | null;
  created_at: string;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  created_at: string;
}

// --------------------------------------------------------------------------
// Export JSON (Document 3, section 6)
// --------------------------------------------------------------------------
export interface SystemExport {
  app: 'system';
  version: 1;
  exported_at: string;
  profile: Profile | null;
  super_projects: SuperProject[];
  projects: Project[];
  activities: Activity[];
  sessions: Session[];
  completions: Completion[];
  quotes: Quote[];
}
