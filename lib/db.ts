import Database from 'better-sqlite3';
import path from 'path';
import { REMINDER_OPTIONS, validateReminderMinutes, getReminderAbbreviation, calculateProgress, validateSubtaskTitle } from './types';
import type { ReminderMinutes } from './types';

// Re-export for convenience
export { REMINDER_OPTIONS, validateReminderMinutes, getReminderAbbreviation, calculateProgress, validateSubtaskTitle } from './types';
export type { ReminderMinutes } from './types';

// Initialize database
const dbPath = path.join(process.cwd(), 'todos.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Type definitions
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

export interface PendingNotification {
  id: number;
  title: string;
  due_date: string;
  reminder_minutes: number;
}

// Initialize database schema
db.exec(`
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Authenticators table for WebAuthn
  CREATE TABLE IF NOT EXISTS authenticators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    counter INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Todos table
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT 0,
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
    due_date TEXT,
    recurrence_pattern TEXT CHECK(recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly')),
    reminder_minutes INTEGER,
    last_notification_sent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Subtasks table
  CREATE TABLE IF NOT EXISTS subtasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    todo_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
  );

  -- Tags table
  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3B82F6',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
  );

  -- Todo-Tags junction table
  CREATE TABLE IF NOT EXISTS todo_tags (
    todo_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (todo_id, tag_id),
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
  );

  -- Templates table
  CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL CHECK(length(trim(name)) > 0 AND length(name) <= 100),
    description TEXT DEFAULT NULL CHECK(description IS NULL OR length(description) <= 500),
    category TEXT DEFAULT NULL CHECK(category IS NULL OR length(category) <= 50),
    title_template TEXT NOT NULL CHECK(length(trim(title_template)) > 0),
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
    recurrence_enabled INTEGER NOT NULL DEFAULT 0 CHECK(recurrence_enabled IN (0, 1)),
    recurrence_pattern TEXT DEFAULT NULL CHECK(recurrence_pattern IS NULL OR recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly')),
    reminder_minutes INTEGER DEFAULT NULL CHECK(reminder_minutes IS NULL OR reminder_minutes IN (15, 30, 60, 120, 1440, 2880, 10080)),
    due_offset_days INTEGER DEFAULT NULL CHECK(due_offset_days IS NULL OR (due_offset_days >= 1 AND due_offset_days <= 365)),
    subtasks_json TEXT DEFAULT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name COLLATE NOCASE)
  );

  -- Holidays table
  CREATE TABLE IF NOT EXISTS holidays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'SG'
  );

  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
  CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
  CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
  CREATE INDEX IF NOT EXISTS idx_todos_user_priority ON todos(user_id, priority);
  CREATE INDEX IF NOT EXISTS idx_subtasks_todo_id ON subtasks(todo_id);
  CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
  CREATE INDEX IF NOT EXISTS idx_authenticators_user_id ON authenticators(user_id);
  CREATE INDEX IF NOT EXISTS idx_authenticators_credential_id ON authenticators(credential_id);
`);

// Database migrations for templates table (handle existing databases)
// These migrations run at module load time to update existing databases
try {
  db.exec(`ALTER TABLE templates ADD COLUMN description TEXT DEFAULT NULL CHECK(description IS NULL OR length(description) <= 500)`);
} catch (e: any) {
  // Column already exists or other error - ignore
}
try {
  db.exec(`ALTER TABLE templates ADD COLUMN category TEXT DEFAULT NULL CHECK(category IS NULL OR length(category) <= 50)`);
} catch (e: any) {
  // Column already exists or other error - ignore
}
try {
  db.exec(`ALTER TABLE templates ADD COLUMN title_template TEXT NOT NULL DEFAULT ''`);
} catch (e: any) {
  // Column already exists or other error - ignore
}
try {
  db.exec(`ALTER TABLE templates ADD COLUMN recurrence_enabled INTEGER NOT NULL DEFAULT 0 CHECK(recurrence_enabled IN (0, 1))`);
} catch (e: any) {
  // Column already exists or other error - ignore
}
try {
  db.exec(`ALTER TABLE templates ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'))`);
} catch (e: any) {
  // Column already exists or other error - ignore
}
try {
  // Check if migration from old schema to new schema is needed
  const columns = db.prepare("PRAGMA table_info(templates)").all() as any[];
  const columnNames = columns.map((col: any) => col.name);
  
  // If old column name exists, need to migrate
  const hasOldColumn = columnNames.includes('due_date_offset_days');
  const hasNewColumn = columnNames.includes('due_offset_days');
  const needsMigration = hasOldColumn && !hasNewColumn;
  
  if (needsMigration) {
    // Build SELECT list based on existing columns
    const selectFields: string[] = [];
    selectFields.push('id', 'user_id', 'name');
    selectFields.push(columnNames.includes('description') ? 'description' : 'NULL as description');
    selectFields.push(columnNames.includes('category') ? 'category' : 'NULL as category');
    selectFields.push(columnNames.includes('title_template') ? 'title_template' : 'name as title_template');
    selectFields.push(columnNames.includes('priority') ? 'priority' : "'medium' as priority");
    selectFields.push(columnNames.includes('recurrence_enabled') ? 'recurrence_enabled' : '0 as recurrence_enabled');
    selectFields.push(columnNames.includes('recurrence_pattern') ? 'recurrence_pattern' : 'NULL as recurrence_pattern');
    selectFields.push(columnNames.includes('reminder_minutes') ? 'reminder_minutes' : 'NULL as reminder_minutes');
    selectFields.push('due_date_offset_days as due_offset_days');
    selectFields.push(columnNames.includes('subtasks_json') ? 'subtasks_json' : 'NULL as subtasks_json');
    selectFields.push(columnNames.includes('created_at') ? 'created_at' : "datetime('now') as created_at");
    selectFields.push(columnNames.includes('updated_at') ? 'updated_at' : "datetime('now') as updated_at");
    
    db.exec(`
      CREATE TABLE templates_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL CHECK(length(trim(name)) > 0 AND length(name) <= 100),
        description TEXT DEFAULT NULL CHECK(description IS NULL OR length(description) <= 500),
        category TEXT DEFAULT NULL CHECK(category IS NULL OR length(category) <= 50),
        title_template TEXT NOT NULL CHECK(length(trim(title_template)) > 0),
        priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
        recurrence_enabled INTEGER NOT NULL DEFAULT 0 CHECK(recurrence_enabled IN (0, 1)),
        recurrence_pattern TEXT DEFAULT NULL CHECK(recurrence_pattern IS NULL OR recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly')),
        reminder_minutes INTEGER DEFAULT NULL CHECK(reminder_minutes IS NULL OR reminder_minutes IN (15, 30, 60, 120, 1440, 2880, 10080)),
        due_offset_days INTEGER DEFAULT NULL CHECK(due_offset_days IS NULL OR (due_offset_days >= 1 AND due_offset_days <= 365)),
        subtasks_json TEXT DEFAULT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, name COLLATE NOCASE)
      );
      INSERT INTO templates_new (id, user_id, name, description, category, title_template, priority, recurrence_enabled, recurrence_pattern, reminder_minutes, due_offset_days, subtasks_json, created_at, updated_at)
      SELECT ${selectFields.join(', ')} FROM templates;
      DROP TABLE templates;
      ALTER TABLE templates_new RENAME TO templates;
      CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
      CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(user_id, category);
    `);
  }
} catch (e: any) {
  // Migration failed or not needed - ignore
  console.error('Template migration error (non-fatal):', e.message);
}

// Create template indexes (safe to run even if they exist)
// These need to be created AFTER migrations to ensure columns exist
try {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
    CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(user_id, category);
  `);
} catch (e: any) {
  // Index creation failed - ignore (columns might not exist yet)
  console.error('Template index creation error (non-fatal):', e.message);
}

// Template validation and helper functions
export function validateTemplateName(name: any): string | null {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > 100) return null;
  return trimmed;
}

export function validateTemplateDescription(description: any): string | null {
  if (description === null || description === undefined) return null;
  if (typeof description !== 'string') return null;
  const trimmed = description.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > 500) return null;
  return trimmed;
}

export function validateCategory(category: any): string | null {
  if (category === null || category === undefined) return null;
  if (typeof category !== 'string') return null;
  const trimmed = category.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > 50) return null;
  return trimmed;
}

export function validateDueOffsetDays(days: any): number | null {
  if (days === null || days === undefined) return null;
  const num = typeof days === 'string' ? parseInt(days, 10) : days;
  if (isNaN(num)) return null;
  if (num < 1 || num > 365) return null;
  return num;
}

export function serializeSubtasks(subtasks: SubtaskInput[]): string | null {
  if (!subtasks || subtasks.length === 0) return null;
  return JSON.stringify(subtasks);
}

export function deserializeSubtasks(json: string | null): SubtaskInput[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SubtaskInput =>
        typeof item === 'object' &&
        typeof item.title === 'string' &&
        typeof item.position === 'number'
    );
  } catch {
    return [];
  }
}

export function isTemplateNameUnique(
  userId: number,
  name: string,
  excludeTemplateId?: number
): boolean {
  const query = excludeTemplateId
    ? `SELECT COUNT(*) as count FROM templates WHERE user_id = ? AND LOWER(name) = LOWER(?) AND id != ?`
    : `SELECT COUNT(*) as count FROM templates WHERE user_id = ? AND LOWER(name) = LOWER(?)`;
  
  const params = excludeTemplateId ? [userId, name, excludeTemplateId] : [userId, name];
  const result = db.prepare(query).get(...params) as { count: number };
  return result.count === 0;
}

export function calculateDueDateFromOffset(offsetDays: number | null): string | null {
  if (offsetDays === null) return null;
  
  const { getSingaporeNow, toSingaporeISO } = require('./timezone');
  const now = getSingaporeNow();
  now.setDate(now.getDate() + offsetDays);
  return toSingaporeISO(now);
}

// Database operations - all synchronous (better-sqlite3)

// User operations
export const userDB = {
  create: (username: string): User => {
    const stmt = db.prepare('INSERT INTO users (username) VALUES (?)');
    const info = stmt.run(username);
    return userDB.getById(info.lastInsertRowid as number)!;
  },

  getById: (id: number): User | null => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | null;
  },

  getByUsername: (username: string): User | null => {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username) as User | null;
  },

  delete: (id: number): void => {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(id);
  },
};

// Authenticator operations
export const authenticatorDB = {
  create: (data: {
    user_id: number;
    credential_id: string;
    public_key: string;
    counter: number;
  }): Authenticator => {
    const stmt = db.prepare(`
      INSERT INTO authenticators (user_id, credential_id, public_key, counter)
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(data.user_id, data.credential_id, data.public_key, data.counter);
    return authenticatorDB.getById(info.lastInsertRowid as number)!;
  },

  getById: (id: number): Authenticator | null => {
    const stmt = db.prepare('SELECT * FROM authenticators WHERE id = ?');
    return stmt.get(id) as Authenticator | null;
  },

  getByCredentialId: (credentialId: string): Authenticator | null => {
    const stmt = db.prepare('SELECT * FROM authenticators WHERE credential_id = ?');
    return stmt.get(credentialId) as Authenticator | null;
  },

  getByUserId: (userId: number): Authenticator[] => {
    const stmt = db.prepare('SELECT * FROM authenticators WHERE user_id = ?');
    return stmt.all(userId) as Authenticator[];
  },

  updateCounter: (id: number, counter: number): void => {
    const stmt = db.prepare('UPDATE authenticators SET counter = ? WHERE id = ?');
    stmt.run(counter, id);
  },

  delete: (id: number): void => {
    const stmt = db.prepare('DELETE FROM authenticators WHERE id = ?');
    stmt.run(id);
  },
};

// Todo operations
export const todoDB = {
  create: (data: CreateTodoInput): Todo => {
    const stmt = db.prepare(`
      INSERT INTO todos (user_id, title, priority, due_date, recurrence_pattern, reminder_minutes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      data.user_id,
      data.title,
      data.priority || 'medium',
      data.due_date || null,
      data.recurrence_pattern || null,
      data.reminder_minutes || null
    );

    return todoDB.getById(info.lastInsertRowid as number)!;
  },

  getById: (id: number): Todo | null => {
    const stmt = db.prepare('SELECT * FROM todos WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      ...row,
      completed: Boolean(row.completed),
    };
  },

  getAllByUser: (userId: number): Todo[] => {
    const stmt = db.prepare(`
      SELECT * FROM todos 
      WHERE user_id = ? 
      ORDER BY 
        completed ASC,
        CASE priority 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'low' THEN 3 
        END ASC,
        due_date ASC NULLS LAST,
        created_at DESC
    `);
    const rows = stmt.all(userId) as any[];
    return rows.map(row => ({
      ...row,
      completed: Boolean(row.completed),
    }));
  },

  update: (id: number, data: UpdateTodoInput): Todo => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
    }
    if (data.priority !== undefined) {
      fields.push('priority = ?');
      values.push(data.priority);
    }
    if (data.due_date !== undefined) {
      fields.push('due_date = ?');
      values.push(data.due_date);
    }
    if (data.completed !== undefined) {
      fields.push('completed = ?');
      values.push(data.completed ? 1 : 0);
    }
    if (data.recurrence_pattern !== undefined) {
      fields.push('recurrence_pattern = ?');
      values.push(data.recurrence_pattern);
    }
    if (data.reminder_minutes !== undefined) {
      fields.push('reminder_minutes = ?');
      values.push(data.reminder_minutes);
    }
    if (data.last_notification_sent !== undefined) {
      fields.push('last_notification_sent = ?');
      values.push(data.last_notification_sent);
    }

    fields.push("updated_at = datetime('now')");
    values.push(id);

    const stmt = db.prepare(`
      UPDATE todos SET ${fields.join(', ')} WHERE id = ?
    `);
    stmt.run(...values);

    return todoDB.getById(id)!;
  },

  delete: (id: number): void => {
    const stmt = db.prepare('DELETE FROM todos WHERE id = ?');
    stmt.run(id);
  },

  getByUserAndPriority: (userId: number, priority: Priority): Todo[] => {
    const stmt = db.prepare(`
      SELECT * FROM todos 
      WHERE user_id = ? AND priority = ?
      ORDER BY 
        completed ASC,
        CASE 
          WHEN due_date IS NULL THEN 1
          ELSE 0
        END ASC,
        due_date ASC,
        created_at DESC
    `);
    const rows = stmt.all(userId, priority) as any[];
    return rows.map(row => ({
      ...row,
      completed: Boolean(row.completed),
    }));
  },

  countByPriority: (userId: number): Record<Priority, number> => {
    const stmt = db.prepare(`
      SELECT priority, COUNT(*) as count
      FROM todos
      WHERE user_id = ? AND completed = 0
      GROUP BY priority
    `);
    const results = stmt.all(userId) as Array<{ priority: Priority; count: number }>;
    
    return {
      high: results.find(r => r.priority === 'high')?.count || 0,
      medium: results.find(r => r.priority === 'medium')?.count || 0,
      low: results.find(r => r.priority === 'low')?.count || 0,
    };
  },

  // Get pending notifications for user
  getPendingNotifications: (userId: number): PendingNotification[] => {
    const stmt = db.prepare(`
      SELECT id, title, due_date, reminder_minutes
      FROM todos
      WHERE user_id = ?
        AND completed = 0
        AND due_date IS NOT NULL
        AND reminder_minutes IS NOT NULL
        AND last_notification_sent IS NULL
        AND datetime(due_date, '-' || reminder_minutes || ' minutes') <= datetime('now')
      ORDER BY due_date ASC
    `);
    return stmt.all(userId) as PendingNotification[];
  },

  // Mark notification as sent
  markNotificationSent: (todoId: number, userId: number): void => {
    const stmt = db.prepare(`
      UPDATE todos
      SET last_notification_sent = datetime('now'), updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `);
    stmt.run(todoId, userId);
  },
};

// Subtask operations
export const subtaskDB = {
  create: (data: {
    todo_id: number;
    title: string;
    position: number;
  }): Subtask => {
    const stmt = db.prepare(`
      INSERT INTO subtasks (todo_id, title, position)
      VALUES (?, ?, ?)
    `);
    const info = stmt.run(data.todo_id, data.title, data.position);
    return subtaskDB.getById(info.lastInsertRowid as number)!;
  },

  getById: (id: number): Subtask | null => {
    const stmt = db.prepare('SELECT * FROM subtasks WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      ...row,
      completed: Boolean(row.completed),
    };
  },

  getByTodoId: (todoId: number): Subtask[] => {
    const stmt = db.prepare('SELECT * FROM subtasks WHERE todo_id = ? ORDER BY position ASC');
    const rows = stmt.all(todoId) as any[];
    return rows.map(row => ({
      ...row,
      completed: Boolean(row.completed),
    }));
  },

  update: (id: number, data: {
    title?: string;
    completed?: boolean;
    position?: number;
  }): Subtask => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
    }
    if (data.completed !== undefined) {
      fields.push('completed = ?');
      values.push(data.completed ? 1 : 0);
    }
    if (data.position !== undefined) {
      fields.push('position = ?');
      values.push(data.position);
    }

    values.push(id);

    const stmt = db.prepare(`UPDATE subtasks SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return subtaskDB.getById(id)!;
  },

  delete: (id: number): void => {
    const stmt = db.prepare('DELETE FROM subtasks WHERE id = ?');
    stmt.run(id);
  },

  getNextPosition: (todoId: number): number => {
    const stmt = db.prepare(`
      SELECT COALESCE(MAX(position), -1) + 1 as next_position 
      FROM subtasks 
      WHERE todo_id = ?
    `);
    const result = stmt.get(todoId) as { next_position: number } | undefined;
    return result?.next_position ?? 0;
  },
};

// Tag operations
export const tagDB = {
  create: (data: {
    user_id: number;
    name: string;
    color?: string;
  }): Tag => {
    const stmt = db.prepare(`
      INSERT INTO tags (user_id, name, color)
      VALUES (?, ?, ?)
    `);
    const info = stmt.run(data.user_id, data.name, data.color || '#3B82F6');
    return tagDB.getById(info.lastInsertRowid as number)!;
  },

  getById: (id: number): Tag | null => {
    const stmt = db.prepare('SELECT * FROM tags WHERE id = ?');
    return stmt.get(id) as Tag | null;
  },

  getAllByUser: (userId: number): Tag[] => {
    const stmt = db.prepare('SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC');
    return stmt.all(userId) as Tag[];
  },

  update: (id: number, data: { name?: string; color?: string }): Tag => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.color !== undefined) {
      fields.push('color = ?');
      values.push(data.color);
    }

    values.push(id);

    const stmt = db.prepare(`UPDATE tags SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return tagDB.getById(id)!;
  },

  delete: (id: number): void => {
    const stmt = db.prepare('DELETE FROM tags WHERE id = ?');
    stmt.run(id);
  },
};

// Todo-Tag operations
export const todoTagDB = {
  add: (todoId: number, tagId: number): void => {
    const stmt = db.prepare('INSERT OR IGNORE INTO todo_tags (todo_id, tag_id) VALUES (?, ?)');
    stmt.run(todoId, tagId);
  },

  remove: (todoId: number, tagId: number): void => {
    const stmt = db.prepare('DELETE FROM todo_tags WHERE todo_id = ? AND tag_id = ?');
    stmt.run(todoId, tagId);
  },

  getTagsByTodo: (todoId: number): Tag[] => {
    const stmt = db.prepare(`
      SELECT t.* FROM tags t
      INNER JOIN todo_tags tt ON t.id = tt.tag_id
      WHERE tt.todo_id = ?
      ORDER BY t.name ASC
    `);
    return stmt.all(todoId) as Tag[];
  },

  getTodosByTag: (tagId: number): Todo[] => {
    const stmt = db.prepare(`
      SELECT t.* FROM todos t
      INNER JOIN todo_tags tt ON t.id = tt.todo_id
      WHERE tt.tag_id = ?
      ORDER BY t.created_at DESC
    `);
    const rows = stmt.all(tagId) as any[];
    return rows.map(row => ({
      ...row,
      completed: Boolean(row.completed),
    }));
  },

  removeAllByTodo: (todoId: number): void => {
    const stmt = db.prepare('DELETE FROM todo_tags WHERE todo_id = ?');
    stmt.run(todoId);
  },
};

// Template operations
export const templateDB = {
  create: (data: {
    user_id: number;
    name: string;
    description?: string | null;
    category?: string | null;
    title_template: string;
    priority?: Priority;
    recurrence_enabled?: 0 | 1;
    recurrence_pattern?: RecurrencePattern | null;
    reminder_minutes?: number | null;
    due_offset_days?: number | null;
    subtasks?: SubtaskInput[];
  }): Template => {
    const { getSingaporeNow, toSingaporeISO } = require('./timezone');
    const now = toSingaporeISO(getSingaporeNow());
    
    const name = validateTemplateName(data.name);
    if (!name) {
      throw new Error('Invalid template name');
    }
    
    // Check uniqueness
    if (!isTemplateNameUnique(data.user_id, name)) {
      throw new Error('Template name already exists');
    }
    
    const description = validateTemplateDescription(data.description);
    const category = validateCategory(data.category);
    const subtasksJson = data.subtasks ? serializeSubtasks(data.subtasks) : null;
    const dueOffset = validateDueOffsetDays(data.due_offset_days);
    
    const stmt = db.prepare(`
      INSERT INTO templates (
        user_id, name, description, category, title_template,
        priority, recurrence_enabled, recurrence_pattern,
        reminder_minutes, due_offset_days, subtasks_json,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      data.user_id,
      name,
      description,
      category,
      data.title_template,
      data.priority || 'medium',
      data.recurrence_enabled ?? 0,
      data.recurrence_pattern ?? null,
      data.reminder_minutes ?? null,
      dueOffset,
      subtasksJson,
      now,
      now
    );
    return templateDB.getById(info.lastInsertRowid as number)!;
  },

  getById: (id: number): Template | null => {
    const stmt = db.prepare('SELECT * FROM templates WHERE id = ?');
    return stmt.get(id) as Template | null;
  },

  getAllByUser: (userId: number): Template[] => {
    const stmt = db.prepare(`
      SELECT * FROM templates 
      WHERE user_id = ? 
      ORDER BY category NULLS LAST, name COLLATE NOCASE ASC
    `);
    return stmt.all(userId) as Template[];
  },

  getByCategory: (userId: number, category: string): Template[] => {
    const stmt = db.prepare(`
      SELECT * FROM templates 
      WHERE user_id = ? AND category = ?
      ORDER BY name COLLATE NOCASE ASC
    `);
    return stmt.all(userId, category) as Template[];
  },

  update: (id: number, userId: number, data: {
    name?: string;
    description?: string | null;
    category?: string | null;
  }): Template => {
    const { getSingaporeNow, toSingaporeISO } = require('./timezone');
    const now = toSingaporeISO(getSingaporeNow());
    
    const existing = templateDB.getById(id);
    if (!existing || existing.user_id !== userId) {
      throw new Error('Template not found');
    }
    
    // Validate and update name if provided
    let name = existing.name;
    if (data.name !== undefined) {
      const validated = validateTemplateName(data.name);
      if (!validated) {
        throw new Error('Invalid template name');
      }
      // Check uniqueness (excluding current template)
      if (!isTemplateNameUnique(userId, validated, id)) {
        throw new Error('Template name already exists');
      }
      name = validated;
    }
    
    // Validate and update description if provided
    let description = existing.description;
    if ('description' in data) {
      description = validateTemplateDescription(data.description);
    }
    
    // Validate and update category if provided
    let category = existing.category;
    if ('category' in data) {
      category = validateCategory(data.category);
    }
    
    const stmt = db.prepare(`
      UPDATE templates 
      SET name = ?, description = ?, category = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `);
    stmt.run(name, description, category, now, id, userId);
    return templateDB.getById(id)!;
  },

  delete: (id: number, userId: number): void => {
    const template = templateDB.getById(id);
    if (!template || template.user_id !== userId) {
      throw new Error('Template not found');
    }
    
    const stmt = db.prepare('DELETE FROM templates WHERE id = ? AND user_id = ?');
    stmt.run(id, userId);
  },

  use: (id: number, userId: number): Todo => {
    const template = templateDB.getById(id);
    if (!template || template.user_id !== userId) {
      throw new Error('Template not found');
    }
    
    // Calculate due date from offset
    const dueDate = calculateDueDateFromOffset(template.due_offset_days);
    
    // Create todo
    const todo = todoDB.create({
      user_id: userId,
      title: template.title_template,
      priority: template.priority,
      due_date: dueDate,
      recurrence_pattern: template.recurrence_enabled === 1 && template.recurrence_pattern 
        ? template.recurrence_pattern 
        : null,
      reminder_minutes: template.reminder_minutes,
    });
    
    // Create subtasks if template has them
    const subtasks = deserializeSubtasks(template.subtasks_json);
    for (const subtaskInput of subtasks) {
      subtaskDB.create({
        todo_id: todo.id,
        title: subtaskInput.title,
        position: subtaskInput.position,
      });
    }
    
    return todo;
  },

  getWithSubtasks: (id: number): TemplateWithSubtasks | null => {
    const template = templateDB.getById(id);
    if (!template) return null;
    const subtasks = deserializeSubtasks(template.subtasks_json);
    return { ...template, subtasks };
  },

  getAllWithSubtasks: (userId: number): TemplateWithSubtasks[] => {
    const templates = templateDB.getAllByUser(userId);
    return templates.map(template => {
      const subtasks = deserializeSubtasks(template.subtasks_json);
      return { ...template, subtasks };
    });
  },
};

// Holiday operations
export const holidayDB = {
  create: (data: { date: string; name: string; country?: string }): Holiday => {
    const stmt = db.prepare(`
      INSERT INTO holidays (date, name, country)
      VALUES (?, ?, ?)
    `);
    const info = stmt.run(data.date, data.name, data.country || 'SG');
    return holidayDB.getById(info.lastInsertRowid as number)!;
  },

  getById: (id: number): Holiday | null => {
    const stmt = db.prepare('SELECT * FROM holidays WHERE id = ?');
    return stmt.get(id) as Holiday | null;
  },

  getByDate: (date: string): Holiday | null => {
    const stmt = db.prepare('SELECT * FROM holidays WHERE date = ?');
    return stmt.get(date) as Holiday | null;
  },

  getAllByMonth: (year: number, month: number): Holiday[] => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = month === 12 
      ? `${year + 1}-01-01` 
      : `${year}-${String(month + 1).padStart(2, '0')}-01`;
    
    const stmt = db.prepare(`
      SELECT * FROM holidays 
      WHERE date >= ? AND date < ?
      ORDER BY date ASC
    `);
    return stmt.all(startDate, endDate) as Holiday[];
  },

  delete: (id: number): void => {
    const stmt = db.prepare('DELETE FROM holidays WHERE id = ?');
    stmt.run(id);
  },
};

export default db;
