import Database from 'better-sqlite3';
import path from 'path';

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
  priority: Priority;
  due_date_offset_days: number | null;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: number | null;
  subtasks_json: string | null;
  created_at: string;
}

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
    name TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
    due_date_offset_days INTEGER,
    recurrence_pattern TEXT CHECK(recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly')),
    reminder_minutes INTEGER,
    subtasks_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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

    fields.push('updated_at = datetime("now")');
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
    priority?: Priority;
    due_date_offset_days?: number | null;
    recurrence_pattern?: RecurrencePattern | null;
    reminder_minutes?: number | null;
    subtasks_json?: string | null;
  }): Template => {
    const stmt = db.prepare(`
      INSERT INTO templates (user_id, name, priority, due_date_offset_days, recurrence_pattern, reminder_minutes, subtasks_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      data.user_id,
      data.name,
      data.priority || 'medium',
      data.due_date_offset_days || null,
      data.recurrence_pattern || null,
      data.reminder_minutes || null,
      data.subtasks_json || null
    );
    return templateDB.getById(info.lastInsertRowid as number)!;
  },

  getById: (id: number): Template | null => {
    const stmt = db.prepare('SELECT * FROM templates WHERE id = ?');
    return stmt.get(id) as Template | null;
  },

  getAllByUser: (userId: number): Template[] => {
    const stmt = db.prepare('SELECT * FROM templates WHERE user_id = ? ORDER BY name ASC');
    return stmt.all(userId) as Template[];
  },

  update: (id: number, data: {
    name?: string;
    priority?: Priority;
    due_date_offset_days?: number | null;
    recurrence_pattern?: RecurrencePattern | null;
    reminder_minutes?: number | null;
    subtasks_json?: string | null;
  }): Template => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.priority !== undefined) {
      fields.push('priority = ?');
      values.push(data.priority);
    }
    if (data.due_date_offset_days !== undefined) {
      fields.push('due_date_offset_days = ?');
      values.push(data.due_date_offset_days);
    }
    if (data.recurrence_pattern !== undefined) {
      fields.push('recurrence_pattern = ?');
      values.push(data.recurrence_pattern);
    }
    if (data.reminder_minutes !== undefined) {
      fields.push('reminder_minutes = ?');
      values.push(data.reminder_minutes);
    }
    if (data.subtasks_json !== undefined) {
      fields.push('subtasks_json = ?');
      values.push(data.subtasks_json);
    }

    values.push(id);

    const stmt = db.prepare(`UPDATE templates SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return templateDB.getById(id)!;
  },

  delete: (id: number): void => {
    const stmt = db.prepare('DELETE FROM templates WHERE id = ?');
    stmt.run(id);
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
