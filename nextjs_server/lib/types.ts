export type {
  Todo,
  Subtask,
  Tag,
  Template,
  Reminder,
  TodoWithDetails,
  Priority,
  RecurrencePattern,
  ExportPayload,
} from './db'

export interface CreateTodoRequest {
  title: string
  description?: string
  priority?: 'high' | 'medium' | 'low'
  due_date?: string
  is_recurring?: boolean
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  recurrence_end_date?: string
  subtasks?: string[]
  tag_ids?: string[]
  reminder_minutes?: number
}

export interface UpdateTodoRequest {
  title?: string
  description?: string
  priority?: 'high' | 'medium' | 'low'
  due_date?: string
  is_completed?: boolean
  is_recurring?: boolean
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  recurrence_end_date?: string
  tag_ids?: string[]
  reminder_minutes?: number | null
}

export interface CreateTemplateRequest {
  name: string
  title: string
  description?: string
  priority?: 'high' | 'medium' | 'low'
  category?: string
  subtasks?: string[]
  due_date_offset_days?: number
}

export interface CreateTagRequest {
  name: string
  color?: string
}
