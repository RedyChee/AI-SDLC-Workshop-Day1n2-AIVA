'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  due_date: string | null;
  priority: 'high' | 'medium' | 'low';
  is_recurring: boolean;
  recurrence_pattern: string | null;
  reminder_minutes: number | null;
  subtasks: any[];
  tags: any[];
  created_at: string;
}

interface User {
  id: number;
  username: string;
}

type Priority = 'high' | 'medium' | 'low';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [showCompleted, setShowCompleted] = useState(true);
  
  // Edit modal state
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');

  // Fetch current user
  useEffect(() => {
    fetchUser();
  }, []);

  // Fetch todos when user is loaded
  useEffect(() => {
    if (user) {
      fetchTodos();
    }
  }, [user]);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      router.push('/login');
    }
  };

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/todos');
      if (res.ok) {
        const data = await res.json();
        setTodos(data);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Title cannot be empty');
      return;
    }

    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          due_date: dueDate || null,
          priority,
        }),
      });

      if (res.ok) {
        const newTodo = await res.json();
        setTodos([newTodo, ...todos]);
        setTitle('');
        setDueDate('');
        setPriority('medium');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create todo');
      }
    } catch (error) {
      console.error('Error creating todo:', error);
      alert('Failed to create todo');
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed }),
      });

      if (res.ok) {
        const updatedTodo = await res.json();
        setTodos(todos.map(t => t.id === todo.id ? updatedTodo : t));
      }
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });

      if (res.ok) {
        setTodos(todos.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const openEditModal = (todo: Todo) => {
    setEditingTodo(todo);
    setEditTitle(todo.title);
    setEditDueDate(todo.due_date || '');
    setEditPriority(todo.priority);
  };

  const closeEditModal = () => {
    setEditingTodo(null);
    setEditTitle('');
    setEditDueDate('');
    setEditPriority('medium');
  };

  const handleUpdateTodo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingTodo) return;

    if (!editTitle.trim()) {
      alert('Title cannot be empty');
      return;
    }

    try {
      const res = await fetch(`/api/todos/${editingTodo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          due_date: editDueDate || null,
          priority: editPriority,
        }),
      });

      if (res.ok) {
        const updatedTodo = await res.json();
        setTodos(todos.map(t => t.id === editingTodo.id ? updatedTodo : t));
        closeEditModal();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update todo');
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      alert('Failed to update todo');
    }
  };

  // Helper: Get time difference display
  const getTimeDifference = (dueDate: string | null) => {
    if (!dueDate) return null;

    const now = new Date();
    const due = new Date(dueDate);
    const diff = due.getTime() - now.getTime();
    const absDiff = Math.abs(diff);

    const minutes = Math.floor(absDiff / 60000);
    const hours = Math.floor(absDiff / 3600000);
    const days = Math.floor(absDiff / 86400000);

    let text = '';
    let color = '';

    if (diff < 0) {
      // Overdue
      if (minutes < 60) {
        text = `${minutes} minutes overdue`;
      } else if (hours < 24) {
        text = `${hours} hours overdue`;
      } else {
        text = `${days} days overdue`;
      }
      color = 'text-red-600 dark:text-red-400';
    } else {
      // Future
      if (minutes < 60) {
        text = `Due in ${minutes} minutes`;
        color = 'text-red-600 dark:text-red-400';
      } else if (hours < 24) {
        text = `Due in ${hours} hours (${new Date(dueDate).toLocaleString()})`;
        color = 'text-orange-600 dark:text-orange-400';
      } else if (days < 7) {
        text = `Due in ${days} days (${new Date(dueDate).toLocaleString()})`;
        color = 'text-yellow-600 dark:text-yellow-400';
      } else {
        text = new Date(dueDate).toLocaleString();
        color = 'text-blue-600 dark:text-blue-400';
      }
    }

    return { text, color };
  };

  // Helper: Check if todo is overdue
  const isOverdue = (todo: Todo) => {
    if (!todo.due_date || todo.completed) return false;
    return new Date(todo.due_date) < new Date();
  };

  // Sorting logic
  const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

  const sortTodos = (todosToSort: Todo[]) => {
    return [...todosToSort].sort((a, b) => {
      // 1. Priority (high first)
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // 2. Due date (earliest first)
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;

      // 3. Creation date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  };

  // Filter todos
  const filteredTodos = todos.filter(todo => {
    // Search filter
    if (searchQuery && !todo.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Priority filter
    if (priorityFilter !== 'all' && todo.priority !== priorityFilter) {
      return false;
    }

    // Completed filter
    if (!showCompleted && todo.completed) {
      return false;
    }

    return true;
  });

  // Organize into sections
  const overdueTodos = sortTodos(filteredTodos.filter(todo => isOverdue(todo)));
  const pendingTodos = sortTodos(filteredTodos.filter(todo => !todo.completed && !isOverdue(todo)));
  const completedTodos = sortTodos(filteredTodos.filter(todo => todo.completed));

  // Priority badge classes
  const priorityClasses: Record<Priority, string> = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Todo App</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 dark:text-gray-300">Welcome, {user?.username}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Todo Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleAddTodo} className="space-y-4">
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Add
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search todos..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority Filter
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as Priority | 'all')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Show Completed
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Overdue Section */}
        {overdueTodos.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
              ⚠️ Overdue ({overdueTodos.length})
            </h2>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 space-y-3">
              {overdueTodos.map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={handleToggleComplete}
                  onDelete={handleDeleteTodo}
                  onEdit={openEditModal}
                  getTimeDifference={getTimeDifference}
                  priorityClasses={priorityClasses}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pending Section */}
        {pendingTodos.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-3">
              Pending ({pendingTodos.length})
            </h2>
            <div className="space-y-3">
              {pendingTodos.map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={handleToggleComplete}
                  onDelete={handleDeleteTodo}
                  onEdit={openEditModal}
                  getTimeDifference={getTimeDifference}
                  priorityClasses={priorityClasses}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Section */}
        {showCompleted && completedTodos.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-3">
              Completed ({completedTodos.length})
            </h2>
            <div className="space-y-3">
              {completedTodos.map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={handleToggleComplete}
                  onDelete={handleDeleteTodo}
                  onEdit={openEditModal}
                  getTimeDifference={getTimeDifference}
                  priorityClasses={priorityClasses}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredTodos.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No todos found. Create one to get started!
            </p>
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {editingTodo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Todo</h2>
            <form onSubmit={handleUpdateTodo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as Priority)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// TodoItem Component
function TodoItem({
  todo,
  onToggle,
  onDelete,
  onEdit,
  getTimeDifference,
  priorityClasses,
}: {
  todo: Todo;
  onToggle: (todo: Todo) => void;
  onDelete: (id: number) => void;
  onEdit: (todo: Todo) => void;
  getTimeDifference: (dueDate: string | null) => { text: string; color: string } | null;
  priorityClasses: Record<Priority, string>;
}) {
  const timeDisplay = getTimeDifference(todo.due_date);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-start gap-4">
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo)}
        className="mt-1 w-5 h-5 rounded border-gray-300 dark:border-gray-600 cursor-pointer"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap mb-2">
          <h3
            className={`text-lg font-medium ${
              todo.completed
                ? 'line-through text-gray-400 dark:text-gray-500'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            {todo.title}
          </h3>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityClasses[todo.priority]}`}>
            {todo.priority}
          </span>
        </div>
        {timeDisplay && (
          <p className={`text-sm ${timeDisplay.color}`}>
            {timeDisplay.text}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(todo)}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(todo.id)}
          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
