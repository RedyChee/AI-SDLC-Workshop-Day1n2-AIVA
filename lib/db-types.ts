// Client-safe types and constants (no database imports)
// This file can be imported in both client and server components

export type Priority = 'low' | 'medium' | 'high';
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface User {
  id: number;
  username: string;
  created_at: string;
}

export interface Authenticator {
  id: number;
  user_id: number;
  credential_id: string;
  public_key: string;
  counter: number;
  created_at: string;
}

export interface Todo {
  id: number;
  user_id: number;
  title: string;
  completed: boolean;
  priority: Priority;
  due_date: string | null;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: number | null;
  last_notification_sent: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subtask {
  id: number;
  todo_id: number;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
}

export interface SubtaskProgress {
  total: number;
  completed: number;
  percentage: number;
}

export interface TodoWithSubtasks extends Todo {
  subtasks: Subtask[];
  progress: SubtaskProgress;
}

export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface TodoTag {
  todo_id: number;
  tag_id: number;
}

export interface Template {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  category: string | null;
  title_template: string;
  priority: Priority;
  recurrence_enabled: 0 | 1;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: number | null;
  due_offset_days: number | null;
  subtasks_json: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubtaskInput {
  title: string;
  position: number;
}

export interface TemplateWithSubtasks extends Template {
  subtasks: SubtaskInput[];
}

export const SUGGESTED_CATEGORIES = [
  'Work',
  'Personal',
  'Finance',
  'Health',
  'Education',
] as const;

export const DUE_OFFSET_PRESETS = [
  { label: '1 day', value: 1 },
  { label: '3 days', value: 3 },
  { label: '1 week', value: 7 },
  { label: '2 weeks', value: 14 },
  { label: '1 month', value: 30 },
  { label: 'Custom', value: null },
] as const;

export interface Holiday {
  id: number;
  date: string;
  name: string;
  country: string;
}

export interface CreateTodoInput {
  user_id: number;
  title: string;
  priority?: Priority;
  due_date?: string | null;
  recurrence_pattern?: RecurrencePattern | null;
  reminder_minutes?: number | null;
}

export interface UpdateTodoInput {
  title?: string;
  priority?: Priority;
  due_date?: string | null;
  completed?: boolean;
  recurrence_pattern?: RecurrencePattern | null;
  reminder_minutes?: number | null;
  last_notification_sent?: string | null;
}
