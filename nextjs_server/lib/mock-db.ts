import { v4 as uuid } from 'uuid'
import { TodoWithDetails, Template, Tag, Reminder, Subtask } from './types'
import { getNowSingaporeDateString, toSingaporeDateTimeString } from './timezone'

// In-memory mock database for development
// For production, use Prisma + PostgreSQL or better-sqlite3

// Use global to persist across hot reloads in development
declare global {
  var __mockDB: {
    todoStore: Map<string, TodoWithDetails>
    tagStore: Map<string, Tag>
    templateStore: Map<string, Template>
    subtaskStore: Map<string, Subtask>
    reminderStore: Map<string, Reminder>
  } | undefined
}

if (!global.__mockDB) {
  global.__mockDB = {
    todoStore: new Map(),
    tagStore: new Map(),
    templateStore: new Map(),
    subtaskStore: new Map(),
    reminderStore: new Map(),
  }
}

const todoStore = global.__mockDB.todoStore
const tagStore = global.__mockDB.tagStore
const templateStore = global.__mockDB.templateStore
const subtaskStore = global.__mockDB.subtaskStore
const reminderStore = global.__mockDB.reminderStore

const MOCK_USER_ID = 'user-1'

export function generateId(): string {
  return uuid()
}

export function resetMockDB(): void {
  todoStore.clear()
  tagStore.clear()
  templateStore.clear()
  subtaskStore.clear()
  reminderStore.clear()
}

// Seed initial data
export function initializeData() {
  const now = getNowSingaporeDateString()
  
  // Create some sample todos
  todoStore.set('todo-1', {
    id: 'todo-1',
    user_id: MOCK_USER_ID,
    title: 'task1',
    description: 'This is the first task',
    priority: 'medium',
    due_date: '2026-02-06',
    is_completed: false,
    is_recurring: false,
    created_at: now,
    updated_at: now,
    subtasks: [
      {
        id: 'subtask-1',
        todo_id: 'todo-1',
        title: 'Subtask 1',
        is_completed: false,
        position: 0,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'subtask-2',
        todo_id: 'todo-1',
        title: 'Subtask 2',
        is_completed: false,
        position: 1,
        created_at: now,
        updated_at: now,
      },
    ],
    tags: [],
    reminders: [],
  })
}

// Todo operations
export async function getTodos(): Promise<TodoWithDetails[]> {
  // Commented out for testing - no initial data
  // if (todoStore.size === 0) {
  //   initializeData()
  // }
  return Array.from(todoStore.values()).sort((a: any, b: any) => {
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
    const diff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (diff !== 0) return diff
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    }
    return 0
  })
}

export async function getTodoById(id: string): Promise<TodoWithDetails | null> {
  return todoStore.get(id) || null
}

export async function createTodo(data: {
  user_id?: string
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
}): Promise<TodoWithDetails> {
  const id = generateId()
  const now = getNowSingaporeDateString()

  const subtasks = (data.subtasks || []).map((title, idx) => ({
    id: generateId(),
    todo_id: id,
    title,
    is_completed: false,
    position: idx,
    created_at: now,
    updated_at: now,
  }))

  const tags = (data.tag_ids || [])
    .map(tagId => tagStore.get(tagId))
    .filter((t): t is Tag => t !== undefined)

  const reminders: Reminder[] = []

  if (data.reminder_minutes) {
    const reminder: Reminder = {
      id: generateId(),
      todo_id: id,
      reminder_minutes: data.reminder_minutes,
      created_at: now,
    }
    reminders.push(reminder)
    reminderStore.set(reminder.id, reminder)
  }

  const todo: TodoWithDetails = {
    id,
    user_id: MOCK_USER_ID,
    title: data.title,
    description: data.description,
    priority: data.priority || 'medium',
    due_date: data.due_date,
    is_completed: false,
    is_recurring: data.is_recurring || false,
    recurrence_pattern: data.recurrence_pattern,
    recurrence_end_date: data.recurrence_end_date,
    created_at: now,
    updated_at: now,
    subtasks,
    tags,
    reminders,
  }

  subtasks.forEach(s => subtaskStore.set(s.id, s))
  todoStore.set(id, todo)

  return todo
}

export async function updateTodo(
  id: string,
  data: Partial<TodoWithDetails>
): Promise<TodoWithDetails | null> {
  const todo = todoStore.get(id)
  if (!todo) return null

  const updated = { ...todo, ...data, updated_at: toSingaporeDateTimeString(new Date()) }
  todoStore.set(id, updated)
  return updated
}

export async function setReminderForTodo(
  todoId: string,
  minutes: number | null
): Promise<Reminder[]> {
  const todo = todoStore.get(todoId)
  if (!todo) return []

  todo.reminders.forEach(reminder => reminderStore.delete(reminder.id))
  const now = getNowSingaporeDateString()
  const reminders: Reminder[] = []

  if (minutes !== null) {
    const reminder: Reminder = {
      id: generateId(),
      todo_id: todoId,
      reminder_minutes: minutes,
      created_at: now,
    }
    reminders.push(reminder)
    reminderStore.set(reminder.id, reminder)
  }

  const updated = { ...todo, reminders, updated_at: now }
  todoStore.set(todoId, updated)
  return reminders
}

export async function addSubtask(todoId: string, title: string): Promise<Subtask | null> {
  const todo = todoStore.get(todoId)
  if (!todo) return null

  const subtask: Subtask = {
    id: generateId(),
    todo_id: todoId,
    title,
    is_completed: false,
    position: todo.subtasks.length,
    created_at: getNowSingaporeDateString(),
    updated_at: getNowSingaporeDateString(),
  }

  subtaskStore.set(subtask.id, subtask)
  todo.subtasks.push(subtask)
  todoStore.set(todoId, todo)

  return subtask
}

export async function deleteTodo(id: string): Promise<void> {
  const todo = todoStore.get(id)
  if (todo) {
    todo.subtasks.forEach((s: any) => subtaskStore.delete(s.id))
    todo.reminders.forEach((r: any) => reminderStore.delete(r.id))
  }
  todoStore.delete(id)
}

// Tag operations
export async function getTags(): Promise<Tag[]> {
  return Array.from(tagStore.values())
}

export async function getTagById(id: string): Promise<Tag | null> {
  return tagStore.get(id) || null
}

export async function createTag(data: {
  name: string
  color?: string
}): Promise<Tag> {
  const id = generateId()
  const now = getNowSingaporeDateString()

  const tag: Tag = {
    id,
    user_id: MOCK_USER_ID,
    name: data.name,
    color: data.color || '#3b82f6',
    created_at: now,
    updated_at: now,
  }

  tagStore.set(id, tag)
  return tag
}

export async function updateTag(
  id: string,
  data: Partial<Tag>
): Promise<Tag | null> {
  const tag = tagStore.get(id)
  if (!tag) return null

  const updated = { ...tag, ...data, updated_at: toSingaporeDateTimeString(new Date()) }
  tagStore.set(id, updated)
  return updated
}

export async function deleteTag(id: string): Promise<void> {
  tagStore.delete(id)
  // Remove from todos
  todoStore.forEach((todo: any) => {
    todo.tags = todo.tags.filter((t: any) => t.id !== id)
  })
}

// Template operations
export async function getTemplates(): Promise<Template[]> {
  return Array.from(templateStore.values())
}

export async function getTemplateById(id: string): Promise<Template | null> {
  return templateStore.get(id) || null
}

export async function createTemplate(data: {
  name: string
  title: string
  description?: string
  priority?: 'high' | 'medium' | 'low'
  category?: string
  subtasks?: string[]
  due_date_offset_days?: number
}): Promise<Template> {
  const id = generateId()
  const now = getNowSingaporeDateString()

  const template: Template = {
    id,
    user_id: MOCK_USER_ID,
    name: data.name,
    title: data.title,
    description: data.description,
    priority: data.priority || 'medium',
    category: data.category,
    subtasks_json: data.subtasks ? JSON.stringify(data.subtasks) : undefined,
    due_date_offset_days: data.due_date_offset_days,
    created_at: now,
    updated_at: now,
  }

  templateStore.set(id, template)
  return template
}

export async function updateTemplate(
  id: string,
  data: Partial<Template>
): Promise<Template | null> {
  const template = templateStore.get(id)
  if (!template) return null

  const updated = { ...template, ...data, updated_at: toSingaporeDateTimeString(new Date()) }
  templateStore.set(id, updated)
  return updated
}

export async function deleteTemplate(id: string): Promise<void> {
  templateStore.delete(id)
}

// Subtask operations
export async function updateSubtask(
  id: string,
  data: Partial<Subtask>
): Promise<Subtask | null> {
  const subtask = subtaskStore.get(id)
  if (!subtask) return null

  const updated = { ...subtask, ...data, updated_at: toSingaporeDateTimeString(new Date()) }
  subtaskStore.set(id, updated)

  // Update in todo
  const todo = todoStore.get(subtask.todo_id)
  if (todo) {
    const idx = todo.subtasks.findIndex((s: any) => s.id === id)
    if (idx >= 0) {
      todo.subtasks[idx] = updated
    }
  }

  return updated
}

export async function deleteSubtask(id: string): Promise<void> {
  const subtask = subtaskStore.get(id)
  if (subtask) {
    const todo = todoStore.get(subtask.todo_id)
    if (todo) {
      todo.subtasks = todo.subtasks.filter((s: any) => s.id !== id)
    }
  }
  subtaskStore.delete(id)
}

export async function getDueReminders(now: Date): Promise<Array<{ reminder: Reminder; todo: TodoWithDetails }>> {
  const due: Array<{ reminder: Reminder; todo: TodoWithDetails }> = []
  const nowTime = now.getTime()

  todoStore.forEach(todo => {
    if (!todo.due_date) return
    const dueDateTime = new Date(`${todo.due_date}T00:00:00+08:00`).getTime()

    todo.reminders.forEach(reminder => {
      const reminderTime = dueDateTime - reminder.reminder_minutes * 60_000
      const lastSent = reminder.last_notification_sent
        ? new Date(reminder.last_notification_sent).getTime()
        : null

      if (reminderTime <= nowTime && (lastSent === null || lastSent < reminderTime)) {
        due.push({ reminder, todo })
      }
    })
  })

  return due
}

export async function markReminderSent(reminderId: string, nowIso: string): Promise<void> {
  const reminder = reminderStore.get(reminderId)
  if (reminder) {
    reminder.last_notification_sent = nowIso
    reminderStore.set(reminderId, reminder)
  }

  todoStore.forEach(todo => {
    const idx = todo.reminders.findIndex(r => r.id === reminderId)
    if (idx >= 0) {
      todo.reminders[idx] = { ...todo.reminders[idx], last_notification_sent: nowIso }
    }
  })
}

export async function importAll(payload: any): Promise<{ todos: number; tags: number; templates: number }> {
  if (!payload || !Array.isArray(payload.todos) || !Array.isArray(payload.tags) || !Array.isArray(payload.templates)) {
    throw new Error('Invalid export format')
  }

  const now = getNowSingaporeDateString()
  const existingTagsByName = new Map<string, Tag>()
  tagStore.forEach(tag => existingTagsByName.set(tag.name.toLowerCase(), tag))

  const tagIdMap = new Map<string, string>()
  payload.tags.forEach((tag: Tag) => {
    const key = tag.name.toLowerCase()
    const existing = existingTagsByName.get(key)
    if (existing) {
      tagIdMap.set(tag.id, existing.id)
      return
    }

    const newTag: Tag = {
      id: generateId(),
      user_id: MOCK_USER_ID,
      name: tag.name,
      color: tag.color || '#3b82f6',
      created_at: now,
      updated_at: now,
    }
    tagStore.set(newTag.id, newTag)
    existingTagsByName.set(key, newTag)
    tagIdMap.set(tag.id, newTag.id)
  })

  let importedTodos = 0
  payload.todos.forEach((todo: TodoWithDetails) => {
    const newTodoId = generateId()

    const subtasks = (todo.subtasks || []).map((subtask, idx) => {
      const newSubtask: Subtask = {
        id: generateId(),
        todo_id: newTodoId,
        title: subtask.title,
        is_completed: subtask.is_completed,
        position: idx,
        created_at: now,
        updated_at: now,
      }
      subtaskStore.set(newSubtask.id, newSubtask)
      return newSubtask
    })

    const tags = (todo.tags || [])
      .map(tag => tagStore.get(tagIdMap.get(tag.id) || tag.id))
      .filter((t): t is Tag => t !== undefined)

    const reminders = (todo.reminders || []).map(reminder => {
      const newReminder: Reminder = {
        id: generateId(),
        todo_id: newTodoId,
        reminder_minutes: reminder.reminder_minutes || (reminder as any).minutes_before || 15,
        last_notification_sent: reminder.last_notification_sent,
        created_at: now,
      }
      reminderStore.set(newReminder.id, newReminder)
      return newReminder
    })

    const newTodo: TodoWithDetails = {
      id: newTodoId,
      user_id: MOCK_USER_ID,
      title: todo.title,
      description: todo.description,
      priority: todo.priority || 'medium',
      due_date: todo.due_date,
      is_completed: todo.is_completed,
      is_recurring: todo.is_recurring,
      recurrence_pattern: todo.recurrence_pattern,
      recurrence_end_date: todo.recurrence_end_date,
      created_at: now,
      updated_at: now,
      subtasks,
      tags,
      reminders,
    }

    todoStore.set(newTodoId, newTodo)
    importedTodos++
  })

  let importedTemplates = 0
  payload.templates.forEach((template: Template) => {
    const newTemplate: Template = {
      id: generateId(),
      user_id: MOCK_USER_ID,
      name: template.name,
      title: template.title,
      description: template.description,
      priority: template.priority || 'medium',
      category: template.category,
      subtasks_json: template.subtasks_json,
      due_date_offset_days: template.due_date_offset_days,
      created_at: now,
      updated_at: now,
    }
    templateStore.set(newTemplate.id, newTemplate)
    importedTemplates++
  })

  return { todos: importedTodos, tags: tagIdMap.size, templates: importedTemplates }
}
