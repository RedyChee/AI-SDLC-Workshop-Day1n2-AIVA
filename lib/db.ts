import Database from 'better-sqlite3';
import path from 'path';
import { isoBase64URL } from '@simplewebauthn/server/helpers';

// Database file path (in project root)
const dbPath = path.join(process.cwd(), 'todos.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// TypeScript Interfaces
export type Priority = 'high' | 'medium' | 'low';
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
  due_date: string | null;
  priority: Priority;
  is_recurring: boolean;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: number | null;
  last_notification_sent: string | null;
  created_at: string;
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
  title: string;
  priority: Priority;
  due_date_offset_days: number;
  subtasks_json: string;
  created_at: string;
}

export interface Holiday {
  id: number;
  date: string;
  name: string;
  created_at: string;
}

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS authenticators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    counter INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT 0,
    due_date TEXT,
    priority TEXT DEFAULT 'medium',
    is_recurring BOOLEAN DEFAULT 0,
    recurrence_pattern TEXT,
    reminder_minutes INTEGER,
    last_notification_sent TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS subtasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    todo_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT 0,
    position INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS todo_tags (
    todo_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (todo_id, tag_id),
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    priority TEXT DEFAULT 'medium',
    due_date_offset_days INTEGER DEFAULT 0,
    subtasks_json TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS holidays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// User Operations
export const userDB = {
  create(username: string): User {
    const stmt = db.prepare('INSERT INTO users (username) VALUES (?)');
    const result = stmt.run(username);
    return this.getById(Number(result.lastInsertRowid))!;
  },

  getById(id: number): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | undefined;
  },

  getByUsername(username: string): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username) as User | undefined;
  },
};

// Authenticator Operations
export const authenticatorDB = {
  create(authenticator: Omit<Authenticator, 'id' | 'created_at'>): Authenticator {
    const stmt = db.prepare(`
      INSERT INTO authenticators (user_id, credential_id, public_key, counter)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(
      authenticator.user_id,
      authenticator.credential_id,
      authenticator.public_key,
      authenticator.counter
    );
    return this.getById(Number(result.lastInsertRowid))!;
  },

  getById(id: number): Authenticator | undefined {
    const stmt = db.prepare('SELECT * FROM authenticators WHERE id = ?');
    return stmt.get(id) as Authenticator | undefined;
  },

  getByCredentialId(credentialId: string): Authenticator | undefined {
    const stmt = db.prepare('SELECT * FROM authenticators WHERE credential_id = ?');
    return stmt.get(credentialId) as Authenticator | undefined;
  },

  getByUserId(userId: number): Authenticator[] {
    const stmt = db.prepare('SELECT * FROM authenticators WHERE user_id = ?');
    return stmt.all(userId) as Authenticator[];
  },

  updateCounter(id: number, counter: number): void {
    const stmt = db.prepare('UPDATE authenticators SET counter = ? WHERE id = ?');
    stmt.run(counter, id);
  },
};

// Todo Operations
export const todoDB = {
  getAll(userId: number): Todo[] {
    const stmt = db.prepare('SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC');
    return stmt.all(userId) as Todo[];
  },

  getById(id: number, userId: number): Todo | undefined {
    const stmt = db.prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?');
    return stmt.get(id, userId) as Todo | undefined;
  },

  create(todo: Omit<Todo, 'id' | 'created_at'>): Todo {
    const stmt = db.prepare(`
      INSERT INTO todos (
        user_id, title, completed, due_date, priority,
        is_recurring, recurrence_pattern, reminder_minutes, last_notification_sent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      todo.user_id,
      todo.title,
      todo.completed ? 1 : 0,
      todo.due_date,
      todo.priority,
      todo.is_recurring ? 1 : 0,
      todo.recurrence_pattern,
      todo.reminder_minutes,
      todo.last_notification_sent
    );
    return this.getById(Number(result.lastInsertRowid), todo.user_id)!;
  },

  update(id: number, userId: number, updates: Partial<Omit<Todo, 'id' | 'user_id' | 'created_at'>>): Todo {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.completed !== undefined) {
      fields.push('completed = ?');
      values.push(updates.completed ? 1 : 0);
    }
    if (updates.due_date !== undefined) {
      fields.push('due_date = ?');
      values.push(updates.due_date);
    }
    if (updates.priority !== undefined) {
      fields.push('priority = ?');
      values.push(updates.priority);
    }
    if (updates.is_recurring !== undefined) {
      fields.push('is_recurring = ?');
      values.push(updates.is_recurring ? 1 : 0);
    }
    if (updates.recurrence_pattern !== undefined) {
      fields.push('recurrence_pattern = ?');
      values.push(updates.recurrence_pattern);
    }
    if (updates.reminder_minutes !== undefined) {
      fields.push('reminder_minutes = ?');
      values.push(updates.reminder_minutes);
    }
    if (updates.last_notification_sent !== undefined) {
      fields.push('last_notification_sent = ?');
      values.push(updates.last_notification_sent);
    }

    if (fields.length === 0) {
      return this.getById(id, userId)!;
    }

    values.push(id, userId);
    const stmt = db.prepare(`UPDATE todos SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`);
    stmt.run(...values);

    return this.getById(id, userId)!;
  },

  delete(id: number, userId: number): void {
    const stmt = db.prepare('DELETE FROM todos WHERE id = ? AND user_id = ?');
    stmt.run(id, userId);
  },
};

// Subtask Operations
export const subtaskDB = {
  getByTodoId(todoId: number): Subtask[] {
    const stmt = db.prepare('SELECT * FROM subtasks WHERE todo_id = ? ORDER BY position');
    return stmt.all(todoId) as Subtask[];
  },

  create(subtask: Omit<Subtask, 'id' | 'created_at'>): Subtask {
    const stmt = db.prepare(`
      INSERT INTO subtasks (todo_id, title, completed, position)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(
      subtask.todo_id,
      subtask.title,
      subtask.completed ? 1 : 0,
      subtask.position
    );
    return this.getById(Number(result.lastInsertRowid))!;
  },

  getById(id: number): Subtask | undefined {
    const stmt = db.prepare('SELECT * FROM subtasks WHERE id = ?');
    return stmt.get(id) as Subtask | undefined;
  },

  update(id: number, updates: Partial<Omit<Subtask, 'id' | 'todo_id' | 'created_at'>>): Subtask {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.completed !== undefined) {
      fields.push('completed = ?');
      values.push(updates.completed ? 1 : 0);
    }
    if (updates.position !== undefined) {
      fields.push('position = ?');
      values.push(updates.position);
    }

    if (fields.length === 0) {
      return this.getById(id)!;
    }

    values.push(id);
    const stmt = db.prepare(`UPDATE subtasks SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.getById(id)!;
  },

  delete(id: number): void {
    const stmt = db.prepare('DELETE FROM subtasks WHERE id = ?');
    stmt.run(id);
  },
};

// Tag Operations
export const tagDB = {
  getAll(userId: number): Tag[] {
    const stmt = db.prepare('SELECT * FROM tags WHERE user_id = ? ORDER BY name');
    return stmt.all(userId) as Tag[];
  },

  getById(id: number, userId: number): Tag | undefined {
    const stmt = db.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?');
    return stmt.get(id, userId) as Tag | undefined;
  },

  create(tag: Omit<Tag, 'id' | 'created_at'>): Tag {
    const stmt = db.prepare('INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)');
    const result = stmt.run(tag.user_id, tag.name, tag.color);
    return this.getById(Number(result.lastInsertRowid), tag.user_id)!;
  },

  update(id: number, userId: number, updates: Partial<Omit<Tag, 'id' | 'user_id' | 'created_at'>>): Tag {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.color !== undefined) {
      fields.push('color = ?');
      values.push(updates.color);
    }

    if (fields.length === 0) {
      return this.getById(id, userId)!;
    }

    values.push(id, userId);
    const stmt = db.prepare(`UPDATE tags SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`);
    stmt.run(...values);

    return this.getById(id, userId)!;
  },

  delete(id: number, userId: number): void {
    const stmt = db.prepare('DELETE FROM tags WHERE id = ? AND user_id = ?');
    stmt.run(id, userId);
  },
};

// TodoTag Operations (Many-to-Many)
export const todoTagDB = {
  getTagsForTodo(todoId: number): Tag[] {
    const stmt = db.prepare(`
      SELECT tags.* FROM tags
      INNER JOIN todo_tags ON tags.id = todo_tags.tag_id
      WHERE todo_tags.todo_id = ?
      ORDER BY tags.name
    `);
    return stmt.all(todoId) as Tag[];
  },

  getTodosForTag(tagId: number): number[] {
    const stmt = db.prepare('SELECT todo_id FROM todo_tags WHERE tag_id = ?');
    const results = stmt.all(tagId) as { todo_id: number }[];
    return results.map((r) => r.todo_id);
  },

  add(todoId: number, tagId: number): void {
    const stmt = db.prepare('INSERT OR IGNORE INTO todo_tags (todo_id, tag_id) VALUES (?, ?)');
    stmt.run(todoId, tagId);
  },

  remove(todoId: number, tagId: number): void {
    const stmt = db.prepare('DELETE FROM todo_tags WHERE todo_id = ? AND tag_id = ?');
    stmt.run(todoId, tagId);
  },

  removeAllForTodo(todoId: number): void {
    const stmt = db.prepare('DELETE FROM todo_tags WHERE todo_id = ?');
    stmt.run(todoId);
  },
};

// Template Operations
export const templateDB = {
  getAll(userId: number): Template[] {
    const stmt = db.prepare('SELECT * FROM templates WHERE user_id = ? ORDER BY name');
    return stmt.all(userId) as Template[];
  },

  getById(id: number, userId: number): Template | undefined {
    const stmt = db.prepare('SELECT * FROM templates WHERE id = ? AND user_id = ?');
    return stmt.get(id, userId) as Template | undefined;
  },

  create(template: Omit<Template, 'id' | 'created_at'>): Template {
    const stmt = db.prepare(`
      INSERT INTO templates (user_id, name, title, priority, due_date_offset_days, subtasks_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      template.user_id,
      template.name,
      template.title,
      template.priority,
      template.due_date_offset_days,
      template.subtasks_json
    );
    return this.getById(Number(result.lastInsertRowid), template.user_id)!;
  },

  delete(id: number, userId: number): void {
    const stmt = db.prepare('DELETE FROM templates WHERE id = ? AND user_id = ?');
    stmt.run(id, userId);
  },
};

// Holiday Operations
export const holidayDB = {
  getAll(): Holiday[] {
    const stmt = db.prepare('SELECT * FROM holidays ORDER BY date');
    return stmt.all() as Holiday[];
  },

  getByDate(date: string): Holiday | undefined {
    const stmt = db.prepare('SELECT * FROM holidays WHERE date = ?');
    return stmt.get(date) as Holiday | undefined;
  },

  create(holiday: Omit<Holiday, 'id' | 'created_at'>): Holiday {
    const stmt = db.prepare('INSERT OR IGNORE INTO holidays (date, name) VALUES (?, ?)');
    const result = stmt.run(holiday.date, holiday.name);
    return this.getByDate(holiday.date)!;
  },

  deleteAll(): void {
    const stmt = db.prepare('DELETE FROM holidays');
    stmt.run();
  },
};

export default db;
