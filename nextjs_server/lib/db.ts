// Using mock-db for development and testing
// For production with native SQLite, replace this with better-sqlite3 based implementation

import * as mockDB from './mock-db'

// Type definitions for export
export type Priority = 'high' | 'medium' | 'low'
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface Subtask {
  id: string
  todo_id: string
  title: string
  is_completed: boolean
  position: number
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
  updated_at: string
}

export interface Template {
  id: string
  user_id: string
  name: string
  title: string
  description?: string
  priority?: Priority
  category?: string
  subtasks_json?: string
  due_date_offset_days?: number
  created_at: string
  updated_at: string
}

export interface Reminder {
  id: string
  todo_id: string
  reminder_minutes: number
  last_notification_sent?: string
  created_at: string
}

export interface Todo {
  id: string
  user_id: string
  title: string
  description?: string
  priority: Priority
  due_date?: string
  is_completed: boolean
  is_recurring: boolean
  recurrence_pattern?: RecurrencePattern
  recurrence_end_date?: string
  created_at: string
  updated_at: string
}

export interface TodoWithDetails extends Todo {
  subtasks: Subtask[]
  tags: Tag[]
  reminders: Reminder[]
}

export interface ExportPayload {
  todos: TodoWithDetails[]
  tags: Tag[]
  templates: Template[]
}

// Re-export database functions
export const getTodos = mockDB.getTodos
export const getTodoById = mockDB.getTodoById
export const createTodo = mockDB.createTodo
export const updateTodo = mockDB.updateTodo
export const deleteTodo = mockDB.deleteTodo
export const addSubtask = mockDB.addSubtask
export const getTags = mockDB.getTags
export const getTagById = mockDB.getTagById
export const createTag = mockDB.createTag
export const updateTag = mockDB.updateTag
export const deleteTag = mockDB.deleteTag
export const getTemplates = mockDB.getTemplates
export const getTemplateById = mockDB.getTemplateById
export const createTemplate = mockDB.createTemplate
export const updateTemplate = mockDB.updateTemplate
export const deleteTemplate = mockDB.deleteTemplate
export const updateSubtask = mockDB.updateSubtask
export const deleteSubtask = mockDB.deleteSubtask
export const generateId = mockDB.generateId
export const initializeData = mockDB.initializeData
export const resetMockDB = mockDB.resetMockDB
export const setReminderForTodo = mockDB.setReminderForTodo
export const getDueReminders = mockDB.getDueReminders
export const markReminderSent = mockDB.markReminderSent
export const importAll = mockDB.importAll

// Export database objects for backward compatibility
export const todoDB = {
  getAll: async (userId?: string) => mockDB.getTodos(),
  getById: mockDB.getTodoById,
  create: mockDB.createTodo,
  update: mockDB.updateTodo,
  delete: mockDB.deleteTodo,
  addSubtask: mockDB.addSubtask,
  updateSubtask: mockDB.updateSubtask,
  deleteSubtask: mockDB.deleteSubtask,
  createNextRecurring: async (todo: any) => {
    // Mock implementation - in production, calculate next occurrence
    if (!todo.is_recurring || !todo.recurrence_pattern) return null
    
    const days: Record<string, number> = {
      daily: 1,
      weekly: 7,
      monthly: 30,
      yearly: 365,
    }
    
    const date = new Date(todo.due_date!)
    date.setDate(date.getDate() + (days[todo.recurrence_pattern] || 1))
    const nextDate = date.toISOString().split('T')[0]
    
    if (todo.recurrence_end_date && nextDate > todo.recurrence_end_date) {
      return null
    }
    
    return await mockDB.createTodo({
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      due_date: nextDate,
      is_recurring: true,
      recurrence_pattern: todo.recurrence_pattern,
      recurrence_end_date: todo.recurrence_end_date,
      reminder_minutes: todo.reminders?.[0]?.minutes_before ?? null,
      subtasks: todo.subtasks?.map((s: any) => s.title) || [],
      tag_ids: todo.tags?.map((t: any) => t.id) || [],
    })
  },
}

export const tagDB = {
  getAll: async (userId?: string) => mockDB.getTags(),
  getById: mockDB.getTagById,
  create: mockDB.createTag,
  update: mockDB.updateTag,
  delete: mockDB.deleteTag,
}

export const templateDB = {
  getAll: async (userId?: string) => mockDB.getTemplates(),
  getById: mockDB.getTemplateById,
  create: mockDB.createTemplate,
  update: mockDB.updateTemplate,
  delete: mockDB.deleteTemplate,
}

// Mock implementations for features not yet in mock-db
export const reminderDB = {
  getDueReminders: async (now: Date) => {
    return await mockDB.getDueReminders(now)
  },
  markSent: async (id: string, nowIso: string) => {
    await mockDB.markReminderSent(id, nowIso)
  },
}

export const holidayDB = {
  getAll: async () => {
    return [
      { date: '2026-01-01', name: 'New Year Day', country: 'SG' },
      { date: '2026-02-09', name: 'Chinese New Year', country: 'SG' },
      { date: '2026-02-10', name: 'Chinese New Year Holiday', country: 'SG' },
      { date: '2026-04-10', name: 'Good Friday', country: 'SG' },
      { date: '2026-05-01', name: 'Labour Day', country: 'SG' },
      { date: '2026-05-24', name: 'Vesak Day', country: 'SG' },
      { date: '2026-08-09', name: 'National Day', country: 'SG' },
      { date: '2026-10-24', name: 'Deepavali', country: 'SG' },
      { date: '2026-12-25', name: 'Christmas Day', country: 'SG' },
    ]
  },
}

export const exportDB = {
  exportAll: async (userId?: string) => {
    const todos = await mockDB.getTodos()
    const tags = await mockDB.getTags()
    const templates = await mockDB.getTemplates()
    return { todos, tags, templates }
  },
  importAll: async (payload: any) => {
    return await mockDB.importAll(payload)
  },
}


