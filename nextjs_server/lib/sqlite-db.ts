// SQLite database implementation using better-sqlite3
// This is used in production deployments (Docker, Railway, etc.)

import Database from 'better-sqlite3'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// Database file location - use /data for Docker volumes, or project root otherwise
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'todos.db')

let db: Database.Database | null = null

function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('synchronous = NORMAL')
    initializeSchema()
  }
  return db
}

function initializeSchema() {
  const database = db!

  // Create users table
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)

  // Create authenticators table
  database.exec(`
    CREATE TABLE IF NOT EXISTS authenticators (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      credential_id TEXT UNIQUE NOT NULL,
      public_key TEXT NOT NULL,
      counter INTEGER NOT NULL DEFAULT 0,
      transports TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Create todos table
  database.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'medium',
      due_date TEXT,
      is_completed INTEGER DEFAULT 0,
      is_recurring INTEGER DEFAULT 0,
      recurrence_pattern TEXT,
      recurrence_end_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Create subtasks table
  database.exec(`
    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY,
      todo_id TEXT NOT NULL,
      title TEXT NOT NULL,
      is_completed INTEGER DEFAULT 0,
      position INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
    )
  `)

  // Create tags table
  database.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, name),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Create todo_tags junction table
  database.exec(`
    CREATE TABLE IF NOT EXISTS todo_tags (
      todo_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (todo_id, tag_id),
      FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `)

  // Create reminders table
  database.exec(`
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      todo_id TEXT NOT NULL,
      reminder_minutes INTEGER NOT NULL,
      last_notification_sent TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
    )
  `)

  // Create templates table
  database.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT,
      category TEXT,
      subtasks_json TEXT,
      due_date_offset_days INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Create holidays table
  database.exec(`
    CREATE TABLE IF NOT EXISTS holidays (
      id TEXT PRIMARY KEY,
      date TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      country TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `)

  // Create default user 'user-1' if it doesn't exist
  const userCheck = database.prepare('SELECT id FROM users WHERE id = ?').get('user-1')
  if (!userCheck) {
    const now = new Date().toISOString()
    database.prepare(
      'INSERT INTO users (id, username, created_at, updated_at) VALUES (?, ?, ?, ?)'
    ).run('user-1', 'default-user', now, now)
  }
}

// User functions
export function getUserByUsername(username: string) {
  const database = getDb()
  const stmt = database.prepare('SELECT * FROM users WHERE username = ?')
  return stmt.get(username) as any || null
}

export function getUserById(userId: string) {
  const database = getDb()
  const stmt = database.prepare('SELECT * FROM users WHERE id = ?')
  return stmt.get(userId) as any || null
}

export function createUser(username: string) {
  const database = getDb()
  const id = uuidv4()
  const now = new Date().toISOString()
  const stmt = database.prepare(
    'INSERT INTO users (id, username, created_at, updated_at) VALUES (?, ?, ?, ?)'
  )
  stmt.run(id, username, now, now)
  return { id, username, created_at: now, updated_at: now }
}

// Authenticator functions
export function getAuthenticatorByCredentialId(credentialId: string) {
  const database = getDb()
  const stmt = database.prepare('SELECT * FROM authenticators WHERE credential_id = ?')
  return stmt.get(credentialId) as any || null
}

export function getAuthenticatorsByUserId(userId: string) {
  const database = getDb()
  const stmt = database.prepare('SELECT * FROM authenticators WHERE user_id = ?')
  return stmt.all(userId) as any[]
}

export function createAuthenticator(
  userId: string,
  credentialId: string,
  publicKey: string,
  counter: number,
  transports?: string[]
) {
  const database = getDb()
  const id = uuidv4()
  const now = new Date().toISOString()
  const stmt = database.prepare(
    'INSERT INTO authenticators (id, user_id, credential_id, public_key, counter, transports, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
  stmt.run(id, userId, credentialId, publicKey, counter, JSON.stringify(transports), now, now)
  return { id, user_id: userId, credential_id: credentialId, public_key: publicKey, counter, transports, created_at: now, updated_at: now }
}

export function updateAuthenticatorCounter(credentialId: string, counter: number) {
  const database = getDb()
  const now = new Date().toISOString()
  const stmt = database.prepare('UPDATE authenticators SET counter = ?, updated_at = ? WHERE credential_id = ?')
  stmt.run(counter, now, credentialId)
}

// Todo functions
export function getTodos(userId?: string) {
  const database = getDb()
  const stmt = userId
    ? database.prepare('SELECT * FROM todos WHERE user_id = ? ORDER BY due_date ASC, created_at DESC')
    : database.prepare('SELECT * FROM todos ORDER BY due_date ASC, created_at DESC')

  const todos = (userId ? stmt.all(userId) : stmt.all()) as any[]
  return todos.map(enrichTodoWithDetails)
}

export function getTodoById(id: string) {
  const database = getDb()
  const stmt = database.prepare('SELECT * FROM todos WHERE id = ?')
  const todo = stmt.get(id) as any
  return todo ? enrichTodoWithDetails(todo) : null
}

export function createTodo(data: any) {
  const database = getDb()
  const id = uuidv4()
  const now = new Date().toISOString()

  const stmt = database.prepare(`
    INSERT INTO todos (id, user_id, title, description, priority, due_date, is_completed, is_recurring, recurrence_pattern, recurrence_end_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(
    id,
    data.user_id,
    data.title,
    data.description || null,
    data.priority || 'medium',
    data.due_date || null,
    0,
    data.is_recurring ? 1 : 0,
    data.recurrence_pattern || null,
    data.recurrence_end_date || null,
    now,
    now
  )

  // Add subtasks if provided
  if (data.subtasks && Array.isArray(data.subtasks)) {
    data.subtasks.forEach((title: string, index: number) => {
      addSubtask(id, title, index)
    })
  }

  // Add tags if provided
  if (data.tag_ids && Array.isArray(data.tag_ids)) {
    data.tag_ids.forEach((tagId: string) => {
      const tagStmt = database.prepare('INSERT OR IGNORE INTO todo_tags (todo_id, tag_id) VALUES (?, ?)')
      tagStmt.run(id, tagId)
    })
  }

  // Add reminder if provided
  if (data.reminder_minutes !== undefined && data.reminder_minutes !== null) {
    setReminderForTodo(id, data.reminder_minutes)
  }

  return getTodoById(id)
}

export function updateTodo(id: string, data: any) {
  const database = getDb()
  const now = new Date().toISOString()

  const stmt = database.prepare(`
    UPDATE todos SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      priority = COALESCE(?, priority),
      due_date = COALESCE(?, due_date),
      is_completed = COALESCE(?, is_completed),
      is_recurring = COALESCE(?, is_recurring),
      recurrence_pattern = COALESCE(?, recurrence_pattern),
      recurrence_end_date = COALESCE(?, recurrence_end_date),
      updated_at = ?
    WHERE id = ?
  `)

  stmt.run(
    data.title || null,
    data.description !== undefined ? data.description : null,
    data.priority || null,
    data.due_date || null,
    data.is_completed !== undefined ? (data.is_completed ? 1 : 0) : null,
    data.is_recurring !== undefined ? (data.is_recurring ? 1 : 0) : null,
    data.recurrence_pattern || null,
    data.recurrence_end_date || null,
    now,
    id
  )

  return getTodoById(id)
}

export function deleteTodo(id: string) {
  const database = getDb()
  const stmt = database.prepare('DELETE FROM todos WHERE id = ?')
  stmt.run(id)
}

// Subtask functions
export function addSubtask(todoId: string, title: string, position: number = 0) {
  const database = getDb()
  const id = uuidv4()
  const now = new Date().toISOString()

  const stmt = database.prepare(
    'INSERT INTO subtasks (id, todo_id, title, is_completed, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  stmt.run(id, todoId, title, 0, position, now, now)
  return { id, todo_id: todoId, title, is_completed: false, position, created_at: now, updated_at: now }
}

export function updateSubtask(id: string, data: any) {
  const database = getDb()
  const now = new Date().toISOString()

  const stmt = database.prepare(`
    UPDATE subtasks SET
      title = COALESCE(?, title),
      is_completed = COALESCE(?, is_completed),
      position = COALESCE(?, position),
      updated_at = ?
    WHERE id = ?
  `)

  stmt.run(
    data.title || null,
    data.is_completed !== undefined ? (data.is_completed ? 1 : 0) : null,
    data.position !== undefined ? data.position : null,
    now,
    id
  )
}

export function deleteSubtask(id: string) {
  const database = getDb()
  const stmt = database.prepare('DELETE FROM subtasks WHERE id = ?')
  stmt.run(id)
}

// Tag functions
export function getTags(userId?: string) {
  const database = getDb()
  const stmt = userId
    ? database.prepare('SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC')
    : database.prepare('SELECT * FROM tags ORDER BY name ASC')

  return (userId ? stmt.all(userId) : stmt.all()) as any[]
}

export function getTagById(id: string) {
  const database = getDb()
  const stmt = database.prepare('SELECT * FROM tags WHERE id = ?')
  return stmt.get(id) as any || null
}

export function createTag(userId: string, name: string, color: string) {
  const database = getDb()
  const id = uuidv4()
  const now = new Date().toISOString()

  const stmt = database.prepare(
    'INSERT INTO tags (id, user_id, name, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
  stmt.run(id, userId, name, color, now, now)
  return { id, user_id: userId, name, color, created_at: now, updated_at: now }
}

export function updateTag(id: string, data: any) {
  const database = getDb()
  const now = new Date().toISOString()

  const stmt = database.prepare(`
    UPDATE tags SET
      name = COALESCE(?, name),
      color = COALESCE(?, color),
      updated_at = ?
    WHERE id = ?
  `)

  stmt.run(data.name || null, data.color || null, now, id)
}

export function deleteTag(id: string) {
  const database = getDb()
  const tagStmt = database.prepare('DELETE FROM todo_tags WHERE tag_id = ?')
  tagStmt.run(id)
  const stmt = database.prepare('DELETE FROM tags WHERE id = ?')
  stmt.run(id)
}

// Template functions
export function getTemplates(userId?: string) {
  const database = getDb()
  const stmt = userId
    ? database.prepare('SELECT * FROM templates WHERE user_id = ? ORDER BY created_at DESC')
    : database.prepare('SELECT * FROM templates ORDER BY created_at DESC')

  const templates = (userId ? stmt.all(userId) : stmt.all()) as any[]
  return templates.map(t => ({
    ...t,
    subtasks_json: t.subtasks_json ? JSON.parse(t.subtasks_json) : []
  }))
}

export function getTemplateById(id: string) {
  const database = getDb()
  const stmt = database.prepare('SELECT * FROM templates WHERE id = ?')
  const template = stmt.get(id) as any
  if (template && template.subtasks_json) {
    template.subtasks_json = JSON.parse(template.subtasks_json)
  }
  return template || null
}

export function createTemplate(userId: string, data: any) {
  const database = getDb()
  const id = uuidv4()
  const now = new Date().toISOString()

  const stmt = database.prepare(`
    INSERT INTO templates (id, user_id, name, title, description, priority, category, subtasks_json, due_date_offset_days, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const subtasksJson = data.subtasks_json ? JSON.stringify(data.subtasks_json) : null

  stmt.run(
    id,
    userId,
    data.name,
    data.title,
    data.description || null,
    data.priority || null,
    data.category || null,
    subtasksJson,
    data.due_date_offset_days || null,
    now,
    now
  )

  return getTemplateById(id)
}

export function updateTemplate(id: string, data: any) {
  const database = getDb()
  const now = new Date().toISOString()

  const subtasksJson = data.subtasks_json ? JSON.stringify(data.subtasks_json) : null

  const stmt = database.prepare(`
    UPDATE templates SET
      name = COALESCE(?, name),
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      priority = COALESCE(?, priority),
      category = COALESCE(?, category),
      subtasks_json = COALESCE(?, subtasks_json),
      due_date_offset_days = COALESCE(?, due_date_offset_days),
      updated_at = ?
    WHERE id = ?
  `)

  stmt.run(
    data.name || null,
    data.title || null,
    data.description || null,
    data.priority || null,
    data.category || null,
    subtasksJson || null,
    data.due_date_offset_days !== undefined ? data.due_date_offset_days : null,
    now,
    id
  )
}

export function deleteTemplate(id: string) {
  const database = getDb()
  const stmt = database.prepare('DELETE FROM templates WHERE id = ?')
  stmt.run(id)
}

// Reminder functions
export function setReminderForTodo(todoId: string, reminderMinutes: number) {
  const database = getDb()
  const id = uuidv4()
  const now = new Date().toISOString()

  const stmt = database.prepare(
    'INSERT OR REPLACE INTO reminders (id, todo_id, reminder_minutes, created_at) VALUES (?, ?, ?, ?)'
  )
  stmt.run(id, todoId, reminderMinutes, now)
}

export function getDueReminders(now: Date) {
  const database = getDb()
  const stmt = database.prepare(`
    SELECT r.*, t.due_date, t.user_id FROM reminders r
    JOIN todos t ON r.todo_id = t.id
    WHERE t.due_date IS NOT NULL
    AND datetime(t.due_date, '-' || r.reminder_minutes || ' minutes') <= datetime(?)
    AND (r.last_notification_sent IS NULL OR datetime(r.last_notification_sent) < datetime('-1 hour'))
  `)
  return stmt.all(now.toISOString()) as any[]
}

export function markReminderSent(reminderId: string, nowIso: string) {
  const database = getDb()
  const stmt = database.prepare('UPDATE reminders SET last_notification_sent = ? WHERE id = ?')
  stmt.run(nowIso, reminderId)
}

// Holiday functions
export function getHolidays() {
  const database = getDb()
  const stmt = database.prepare('SELECT * FROM holidays ORDER BY date ASC')
  return stmt.all() as any[]
}

export function createHoliday(date: string, name: string, country: string) {
  const database = getDb()
  const id = uuidv4()
  const now = new Date().toISOString()

  const stmt = database.prepare(
    'INSERT OR IGNORE INTO holidays (id, date, name, country, created_at) VALUES (?, ?, ?, ?, ?)'
  )
  stmt.run(id, date, name, country, now)
}

// Utility functions
export function generateId(): string {
  return uuidv4()
}

export function initializeData() {
  // Seed holidays
  const holidays = [
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

  holidays.forEach(h => createHoliday(h.date, h.name, h.country))
}

export async function importAll(payload: any) {
  const database = getDb()

  // Start transaction
  const transaction = database.transaction(() => {
    // Import todos with relationships
    const todoIdMap = new Map()

    payload.todos?.forEach((todo: any) => {
      const newId = uuidv4()
      todoIdMap.set(todo.id, newId)

      const stmt = database.prepare(`
        INSERT INTO todos (id, user_id, title, description, priority, due_date, is_completed, is_recurring, recurrence_pattern, recurrence_end_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      stmt.run(
        newId,
        todo.user_id,
        todo.title,
        todo.description || null,
        todo.priority || 'medium',
        todo.due_date || null,
        todo.is_completed ? 1 : 0,
        todo.is_recurring ? 1 : 0,
        todo.recurrence_pattern || null,
        todo.recurrence_end_date || null,
        todo.created_at,
        todo.updated_at
      )

      // Import subtasks
      todo.subtasks?.forEach((subtask: any) => {
        const subtaskStmt = database.prepare(
          'INSERT INTO subtasks (id, todo_id, title, is_completed, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
        subtaskStmt.run(
          uuidv4(),
          newId,
          subtask.title,
          subtask.is_completed ? 1 : 0,
          subtask.position,
          subtask.created_at,
          subtask.updated_at
        )
      })

      // Import tag associations
      const tagIdMap = new Map()
      payload.tags?.forEach((tag: any) => {
        tagIdMap.set(tag.id, tag.id)
      })

      todo.tags?.forEach((tag: any) => {
        const tagId = tagIdMap.get(tag.id) || tag.id
        const tagStmt = database.prepare('INSERT OR IGNORE INTO todo_tags (todo_id, tag_id) VALUES (?, ?)')
        tagStmt.run(newId, tagId)
      })
    })

    // Import tags
    payload.tags?.forEach((tag: any) => {
      const stmt = database.prepare(
        'INSERT OR IGNORE INTO tags (id, user_id, name, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      stmt.run(tag.id, tag.user_id, tag.name, tag.color, tag.created_at, tag.updated_at)
    })

    // Import templates
    payload.templates?.forEach((template: any) => {
      const stmt = database.prepare(`
        INSERT INTO templates (id, user_id, name, title, description, priority, category, subtasks_json, due_date_offset_days, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const subtasksJson = template.subtasks_json
        ? typeof template.subtasks_json === 'string'
          ? template.subtasks_json
          : JSON.stringify(template.subtasks_json)
        : null

      stmt.run(
        template.id,
        template.user_id,
        template.name,
        template.title,
        template.description || null,
        template.priority || null,
        template.category || null,
        subtasksJson,
        template.due_date_offset_days || null,
        template.created_at,
        template.updated_at
      )
    })
  })

  transaction()
  return { success: true }
}

// Helper function to enrich todos with subtasks, tags, and reminders
function enrichTodoWithDetails(todo: any) {
  const database = getDb()

  const subtasks = database.prepare('SELECT * FROM subtasks WHERE todo_id = ? ORDER BY position ASC').all(todo.id) as any[]
  const tagRows = database.prepare(`
    SELECT t.* FROM tags t
    JOIN todo_tags tt ON t.id = tt.tag_id
    WHERE tt.todo_id = ?
  `).all(todo.id) as any[]
  const reminders = database.prepare('SELECT * FROM reminders WHERE todo_id = ?').all(todo.id) as any[]

  return {
    ...todo,
    is_completed: todo.is_completed === 1,
    is_recurring: todo.is_recurring === 1,
    subtasks: subtasks.map(s => ({
      ...s,
      is_completed: s.is_completed === 1
    })),
    tags: tagRows,
    reminders: reminders
  }
}
