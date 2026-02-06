// SQLite database implementation using better-sqlite3
// Uses SQLite in production (Docker/Railway) and mock-db in development

let dbImpl: any

// In production (Docker), use SQLite; in development, use mock-db
if (process.env.NODE_ENV === 'production' || process.env.DATABASE_PATH) {
  try {
    dbImpl = require('./sqlite-db')
  } catch (err) {
    console.warn('Could not load SQLite, falling back to mock-db')
    dbImpl = require('./mock-db')
  }
} else {
  // Development: use mock-db (In-memory, no native compilation needed)
  dbImpl = require('./mock-db')
}

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
export const getTodos = dbImpl.getTodos
export const getTodoById = dbImpl.getTodoById
export const createTodo = dbImpl.createTodo
export const updateTodo = dbImpl.updateTodo
export const deleteTodo = dbImpl.deleteTodo
export const addSubtask = dbImpl.addSubtask
export const getTags = dbImpl.getTags
export const getTagById = dbImpl.getTagById
export const createTag = dbImpl.createTag
export const updateTag = dbImpl.updateTag
export const deleteTag = dbImpl.deleteTag
export const getTemplates = dbImpl.getTemplates
export const getTemplateById = dbImpl.getTemplateById
export const createTemplate = dbImpl.createTemplate
export const updateTemplate = dbImpl.updateTemplate
export const deleteTemplate = dbImpl.deleteTemplate
export const updateSubtask = dbImpl.updateSubtask
export const deleteSubtask = dbImpl.deleteSubtask
export const generateId = dbImpl.generateId
export const initializeData = dbImpl.initializeData
export const resetMockDB = dbImpl.resetMockDB
export const setReminderForTodo = dbImpl.setReminderForTodo
export const getDueReminders = dbImpl.getDueReminders
export const markReminderSent = dbImpl.markReminderSent
export const importAll = dbImpl.importAll

// Export database objects for backward compatibility
export const todoDB = {
  getAll: async (userId?: string) => dbImpl.getTodos(userId),
  getById: dbImpl.getTodoById,
  create: dbImpl.createTodo,
  update: dbImpl.updateTodo,
  delete: dbImpl.deleteTodo,
  addSubtask: dbImpl.addSubtask,
  updateSubtask: dbImpl.updateSubtask,
  deleteSubtask: dbImpl.deleteSubtask,
  createNextRecurring: async (todo: any) => {
    // Calculate next recurring instance
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
    
    return dbImpl.createTodo({
      user_id: todo.user_id,
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      due_date: nextDate,
      is_recurring: true,
      recurrence_pattern: todo.recurrence_pattern,
      recurrence_end_date: todo.recurrence_end_date,
      reminder_minutes: todo.reminders?.[0]?.reminder_minutes ?? null,
      subtasks: todo.subtasks?.map((s: any) => s.title) || [],
      tag_ids: todo.tags?.map((t: any) => t.id) || [],
    })
  },
}

export const tagDB = {
  getAll: async (userId?: string) => dbImpl.getTags(userId),
  getById: dbImpl.getTagById,
  create: dbImpl.createTag,
  update: dbImpl.updateTag,
  delete: dbImpl.deleteTag,
}

export const templateDB = {
  getAll: async (userId?: string) => dbImpl.getTemplates(userId),
  getById: dbImpl.getTemplateById,
  create: dbImpl.createTemplate,
  update: dbImpl.updateTemplate,
  delete: dbImpl.deleteTemplate,
}

// Mock implementations for features not yet in mock-db
export const reminderDB = {
  getDueReminders: async (now: Date) => {
    return dbImpl.getDueReminders(now)
  },
  markSent: async (id: string, nowIso: string) => {
    dbImpl.markReminderSent(id, nowIso)
  },
}

export const holidayDB = {
  getAll: async () => {
    // Try to get from database, otherwise return defaults
    try {
      return dbImpl.getHolidays ? dbImpl.getHolidays() : getDefaultHolidays()
    } catch {
      return getDefaultHolidays()
    }
  },
}

export const exportDB = {
  exportAll: async (userId?: string) => {
    const todos = dbImpl.getTodos(userId)
    const tags = dbImpl.getTags(userId)
    const templates = dbImpl.getTemplates(userId)
    return { todos, tags, templates }
  },
  importAll: async (payload: any) => {
    return dbImpl.importAll(payload)
  },
}

function getDefaultHolidays() {
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
}


