'use client';

import { useState, useEffect } from 'react';
import { Priority, Todo, UpdateTodoInput } from '@/lib/db';
import { 
  formatSingaporeDate, 
  getMinimumDueDate, 
  getUrgencyColor, 
  getTimeUntil,
  isOverdue,
  formatForDateTimeLocal
} from '@/lib/timezone';

export default function TodoPage() {
  // State management
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit modal state
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  const [editDueDate, setEditDueDate] = useState('');

  // Fetch todos on mount
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/todos');
      
      if (response.status === 401) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch todos');
      }
      
      const data = await response.json();
      setTodos(data.todos);
      setIsLoggedIn(true);
      setError(null);
    } catch (err) {
      setError('Failed to load todos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    try {
      const response = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser' }),
      });

      if (response.ok) {
        setIsLoggedIn(true);
        fetchTodos();
      } else {
        alert('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      alert('Title is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          priority,
          due_date: dueDate || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to create todo');
        return;
      }

      const newTodo = await response.json();
      
      // Optimistic UI update
      setTodos(prev => [...prev, newTodo]);
      
      // Clear form
      setTitle('');
      setPriority('medium');
      setDueDate('');
    } catch (error) {
      console.error('Failed to create todo:', error);
      alert('Failed to create todo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    // Optimistic update
    setTodos(prev =>
      prev.map(t => (t.id === todo.id ? { ...t, completed: !t.completed } : t))
    );

    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed }),
      });

      if (!response.ok) {
        // Revert on failure
        setTodos(prev =>
          prev.map(t => (t.id === todo.id ? { ...t, completed: todo.completed } : t))
        );
        alert('Failed to update todo');
      } else {
        // Refresh to get potential new recurring instance
        fetchTodos();
      }
    } catch (error) {
      setTodos(prev =>
        prev.map(t => (t.id === todo.id ? { ...t, completed: todo.completed } : t))
      );
      alert('Failed to update todo');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this todo?')) {
      return;
    }

    // Optimistic delete
    setTodos(prev => prev.filter(t => t.id !== id));

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Refresh on failure to restore
        fetchTodos();
        alert('Failed to delete todo');
      }
    } catch (error) {
      fetchTodos();
      alert('Failed to delete todo');
    }
  };

  const openEditModal = (todo: Todo) => {
    setEditingTodo(todo);
    setEditTitle(todo.title);
    setEditPriority(todo.priority);
    setEditDueDate(todo.due_date ? formatForDateTimeLocal(todo.due_date) : '');
  };

  const closeEditModal = () => {
    setEditingTodo(null);
    setEditTitle('');
    setEditPriority('medium');
    setEditDueDate('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingTodo) return;

    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      alert('Title is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/todos/${editingTodo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          priority: editPriority,
          due_date: editDueDate || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to update todo');
        return;
      }

      const updated = await response.json();
      setTodos(prev =>
        prev.map(t => (t.id === editingTodo.id ? updated : t))
      );
      closeEditModal();
    } catch (error) {
      console.error('Failed to update todo:', error);
      alert('Failed to update todo');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Organize todos into sections
  const overdueTodos = todos.filter(t => !t.completed && t.due_date && isOverdue(t.due_date));
  const pendingTodos = todos.filter(t => !t.completed && (!t.due_date || !isOverdue(t.due_date)));
  const completedTodos = todos.filter(t => t.completed);

  const getPriorityColor = (priority: Priority): string => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const TodoItem = ({ todo }: { todo: Todo }) => (
    <div className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => handleToggleComplete(todo)}
        className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
      />

      <div className="flex-1 min-w-0">
        <h3 className={`font-medium text-gray-900 ${todo.completed ? 'line-through text-gray-500' : ''}`}>
          {todo.title}
        </h3>
        
        <div className="flex flex-wrap gap-2 mt-2">
          <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(todo.priority)}`}>
            {todo.priority.toUpperCase()}
          </span>

          {todo.due_date && (
            <span className={`text-sm font-medium ${getUrgencyColor(todo.due_date, todo.completed)}`}>
              {todo.completed 
                ? `Completed ${formatSingaporeDate(todo.due_date)}`
                : isOverdue(todo.due_date)
                  ? `Overdue by ${getTimeUntil(todo.due_date)}`
                  : `Due in ${getTimeUntil(todo.due_date)}`
              }
            </span>
          )}

          {todo.recurrence_pattern && (
            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded border border-purple-300">
              Repeats {todo.recurrence_pattern}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => openEditModal(todo)}
          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => handleDelete(todo.id)}
          className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Todo App</h1>
          <p className="text-gray-600 mb-6">Development Mode - Click to login</p>
          <button
            onClick={handleDevLogin}
            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login as Test User
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Todo App</h1>
          <p className="text-gray-600 mt-1">Manage your tasks efficiently</p>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Create Todo Form */}
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Todo</h2>
          
          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={formatForDateTimeLocal(new Date(getMinimumDueDate()))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Adding...' : 'Add Todo'}
            </button>
          </div>
        </form>

        {/* Overdue Section */}
        {overdueTodos.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-red-600 mb-4">
              Overdue ({overdueTodos.length})
            </h2>
            <div className="space-y-3">
              {overdueTodos.map(todo => (
                <TodoItem key={todo.id} todo={todo} />
              ))}
            </div>
          </section>
        )}

        {/* Pending Section */}
        {pendingTodos.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Pending ({pendingTodos.length})
            </h2>
            <div className="space-y-3">
              {pendingTodos.map(todo => (
                <TodoItem key={todo.id} todo={todo} />
              ))}
            </div>
          </section>
        )}

        {/* Completed Section */}
        {completedTodos.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-green-600 mb-4">
              Completed ({completedTodos.length})
            </h2>
            <div className="space-y-3">
              {completedTodos.map(todo => (
                <TodoItem key={todo.id} todo={todo} />
              ))}
            </div>
          </section>
        )}

        {todos.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No todos yet. Create one above to get started!
          </div>
        )}

        {/* Edit Modal */}
        {editingTodo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Todo</h2>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as Priority)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="datetime-local"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    min={formatForDateTimeLocal(new Date(getMinimumDueDate()))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? 'Updating...' : 'Update'}
                  </button>
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="flex-1 px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
