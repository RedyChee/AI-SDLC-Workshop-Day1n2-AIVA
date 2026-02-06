'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { Priority, Todo, UpdateTodoInput, RecurrencePattern, Subtask, SubtaskProgress, TodoWithSubtasks } from '@/lib/db';
import { REMINDER_OPTIONS, ReminderMinutes, getReminderAbbreviation, calculateProgress } from '@/lib/types';
import { 
  formatSingaporeDate, 
  getMinimumDueDate, 
  getUrgencyColor, 
  getTimeUntil,
  isOverdue,
  formatForDateTimeLocal
} from '@/lib/timezone';
import { useNotifications } from '@/lib/hooks/useNotifications';

// Helper functions
const getPriorityColor = (priority: Priority): string => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700';
    case 'low': return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700';
  }
};

const getPriorityLabel = (priority: Priority): string => {
  return priority.toUpperCase();
};

// TodoItem component - moved outside to prevent re-creation
const TodoItem = memo(({ 
  todo, 
  expandedTodos,
  subtaskInputs,
  onToggleComplete,
  onToggleSubtasks,
  onOpenEditModal,
  onDelete,
  onSubtaskInputChange,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask
}: { 
  todo: TodoWithSubtasks;
  expandedTodos: Set<number>;
  subtaskInputs: Record<number, string>;
  onToggleComplete: (todo: TodoWithSubtasks) => void;
  onToggleSubtasks: (todoId: number) => void;
  onOpenEditModal: (todo: TodoWithSubtasks) => void;
  onDelete: (id: number) => void;
  onSubtaskInputChange: (todoId: number, value: string) => void;
  onAddSubtask: (todoId: number) => void;
  onToggleSubtask: (todoId: number, subtaskId: number, completed: boolean) => void;
  onDeleteSubtask: (todoId: number, subtaskId: number) => void;
}) => {
  const isExpanded = expandedTodos.has(todo.id);
  const hasSubtasks = (todo.subtasks?.length ?? 0) > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 p-4">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggleComplete(todo)}
          className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />

        <div className="flex-1 min-w-0">
          <h3 className={`font-medium text-gray-900 ${todo.completed ? 'line-through text-gray-500' : ''}`}>
            {todo.title}
          </h3>
          
          <div className="flex flex-wrap gap-2 mt-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(todo.priority)}`}>
              {getPriorityLabel(todo.priority)}
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
            
            {todo.reminder_minutes && (
              <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded border border-orange-300">
                🔔 {getReminderAbbreviation(todo.reminder_minutes as ReminderMinutes)}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {hasSubtasks && (
            <div className="mt-3">
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                <span>{todo.progress.completed}/{todo.progress.total} subtasks</span>
                <span className="text-gray-400">•</span>
                <span>{todo.progress.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${todo.progress.percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onToggleSubtasks(todo.id)}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
          >
            {isExpanded ? '▼' : '▶'} Subtasks
          </button>
          <button
            onClick={() => onOpenEditModal(todo)}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(todo.id)}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Subtasks section */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="mt-3 space-y-2">
            {(todo.subtasks || []).map((subtask) => (
              <div key={subtask.id} className="flex items-center gap-2 group">
                <input
                  type="checkbox"
                  checked={subtask.completed}
                  onChange={() => onToggleSubtask(todo.id, subtask.id, !subtask.completed)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className={`flex-1 text-sm ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                  {subtask.title}
                </span>
                <button
                  onClick={() => onDeleteSubtask(todo.id, subtask.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-sm transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}

            {/* Add subtask input */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
              <input
                type="text"
                value={subtaskInputs[todo.id] || ''}
                onChange={(e) => onSubtaskInputChange(todo.id, e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    onAddSubtask(todo.id);
                  }
                }}
                placeholder="Add a subtask..."
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={() => onAddSubtask(todo.id)}
                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

TodoItem.displayName = 'TodoItem';

export default function TodoPage() {
  // State management
  const [todos, setTodos] = useState<TodoWithSubtasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Subtask state
  const [expandedTodos, setExpandedTodos] = useState<Set<number>>(new Set());
  const [subtaskInputs, setSubtaskInputs] = useState<Record<number, string>>({});
  
  // Form state
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern | ''>('');
  const [reminderMinutes, setReminderMinutes] = useState<ReminderMinutes>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit modal state
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editRecurrencePattern, setEditRecurrencePattern] = useState<RecurrencePattern | ''>('');
  const [editReminderMinutes, setEditReminderMinutes] = useState<ReminderMinutes>(null);
  
  // Filter state
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  
  // Notifications hook
  const { 
    permission, 
    enabled, 
    isPolling,
    requestPermission, 
    startPolling, 
    stopPolling 
  } = useNotifications();

  // Fetch todos on mount
  useEffect(() => {
    fetchTodos();
  }, []);
  
  // Start notification polling when logged in
  useEffect(() => {
    if (isLoggedIn && enabled) {
      startPolling();
      return () => stopPolling();
    }
  }, [isLoggedIn, enabled, startPolling, stopPolling]);

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
  
  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      startPolling();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      alert('Title is required');
      return;
    }
    
    // Validate recurrence pattern requires due date
    if (recurrencePattern && !dueDate) {
      alert('Recurring todos require a due date');
      return;
    }
    
    // Validate reminder requires due date
    if (reminderMinutes && !dueDate) {
      alert('Reminders require a due date');
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
          recurrence_pattern: recurrencePattern || null,
          reminder_minutes: reminderMinutes,
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
      setRecurrencePattern('');
      setReminderMinutes(null);
    } catch (error) {
      console.error('Failed to create todo:', error);
      alert('Failed to create todo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleComplete = async (todo: TodoWithSubtasks) => {
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

  // Subtask handlers
  const handleSubtaskInputChange = useCallback((todoId: number, value: string) => {
    setSubtaskInputs(prev => ({ ...prev, [todoId]: value }));
  }, []);

  const toggleSubtasks = useCallback((todoId: number) => {
    setExpandedTodos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(todoId)) {
        newSet.delete(todoId);
      } else {
        newSet.add(todoId);
      }
      return newSet;
    });
  }, []);

  const handleAddSubtask = useCallback(async (todoId: number) => {
    const title = subtaskInputs[todoId]?.trim();
    if (!title) return;

    try {
      const response = await fetch(`/api/todos/${todoId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to create subtask');
        return;
      }

      const { subtask, progress } = await response.json();

      // Update todos with new subtask
      setTodos(prev => prev.map(todo =>
        todo.id === todoId
          ? { ...todo, subtasks: [...(todo.subtasks || []), subtask], progress }
          : todo
      ));

      // Clear input
      setSubtaskInputs(prev => ({ ...prev, [todoId]: '' }));
    } catch (error) {
      console.error('Failed to create subtask:', error);
      alert('Failed to create subtask');
    }
  }, [subtaskInputs]);

  const handleToggleSubtask = useCallback(async (todoId: number, subtaskId: number, completed: boolean) => {
    // Optimistic update
    setTodos(prev => prev.map(todo =>
      todo.id === todoId
        ? {
            ...todo,
            subtasks: todo.subtasks.map(st =>
              st.id === subtaskId ? { ...st, completed } : st
            ),
            progress: calculateProgress(
              todo.subtasks.map(st =>
                st.id === subtaskId ? { ...st, completed } : st
              )
            ),
          }
        : todo
    ));

    try {
      const response = await fetch(`/api/todos/${todoId}/subtasks/${subtaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });

      if (!response.ok) {
        // Revert on failure
        fetchTodos();
        alert('Failed to update subtask');
      }
    } catch (error) {
      fetchTodos();
      alert('Failed to update subtask');
    }
  }, []);

  const handleDeleteSubtask = useCallback(async (todoId: number, subtaskId: number) => {
    // Optimistic update
    setTodos(prev => prev.map(todo =>
      todo.id === todoId
        ? {
            ...todo,
            subtasks: todo.subtasks.filter(st => st.id !== subtaskId),
            progress: calculateProgress(todo.subtasks.filter(st => st.id !== subtaskId)),
          }
        : todo
    ));

    try {
      const response = await fetch(`/api/todos/${todoId}/subtasks/${subtaskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Revert on failure
        fetchTodos();
        alert('Failed to delete subtask');
      }
    } catch (error) {
      fetchTodos();
      alert('Failed to delete subtask');
    }
  }, []);

  const openEditModal = (todo: TodoWithSubtasks) => {
    setEditingTodo(todo);
    setEditTitle(todo.title);
    setEditPriority(todo.priority);
    setEditDueDate(todo.due_date ? formatForDateTimeLocal(todo.due_date) : '');
    setEditRecurrencePattern(todo.recurrence_pattern || '');
    setEditReminderMinutes((todo.reminder_minutes ?? null) as ReminderMinutes);
  };

  const closeEditModal = () => {
    setEditingTodo(null);
    setEditTitle('');
    setEditPriority('medium');
    setEditDueDate('');
    setEditRecurrencePattern('');
    setEditReminderMinutes(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingTodo) return;

    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      alert('Title is required');
      return;
    }
    
    // Validate recurrence pattern requires due date
    if (editRecurrencePattern && !editDueDate) {
      alert('Recurring todos require a due date');
      return;
    }
    
    // Validate reminder requires due date
    if (editReminderMinutes && !editDueDate) {
      alert('Reminders require a due date');
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
          recurrence_pattern: editRecurrencePattern || null,
          reminder_minutes: editReminderMinutes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to update todo');
        return;
      }

      // Fetch fresh todos to get complete data with subtasks
      await fetchTodos();
      closeEditModal();
    } catch (error) {
      console.error('Failed to update todo:', error);
      alert('Failed to update todo');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Organize todos into sections with priority filtering
  const filteredTodos = priorityFilter === 'all' 
    ? todos 
    : todos.filter(todo => todo.priority === priorityFilter);
  
  const overdueTodos = filteredTodos.filter(t => !t.completed && t.due_date && isOverdue(t.due_date));
  const pendingTodos = filteredTodos.filter(t => !t.completed && (!t.due_date || !isOverdue(t.due_date)));
  const completedTodos = filteredTodos.filter(t => t.completed);
  
  // Priority statistics
  const priorityCounts = {
    high: todos.filter(t => !t.completed && t.priority === 'high').length,
    medium: todos.filter(t => !t.completed && t.priority === 'medium').length,
    low: todos.filter(t => !t.completed && t.priority === 'low').length,
  };

  const getPriorityEmoji = (priority: Priority): string => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🔵';
    }
  };

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
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Todo App</h1>
            <p className="text-gray-600 mt-1">Manage your tasks efficiently</p>
          </div>
          
          {/* Notification Permission Button */}
          <button
            onClick={handleEnableNotifications}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              enabled
                ? 'bg-green-100 text-green-800 border border-green-300 cursor-default'
                : 'bg-orange-100 text-orange-800 border border-orange-300 hover:bg-orange-200'
            }`}
          >
            🔔 {enabled ? 'Notifications On' : 'Enable Notifications'}
          </button>
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
                  <option value="high">🔴 High Priority</option>
                  <option value="medium">🟡 Medium Priority</option>
                  <option value="low">🔵 Low Priority</option>
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

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence Pattern (Optional)</label>
                <select
                  value={recurrencePattern}
                  onChange={(e) => setRecurrencePattern(e.target.value as RecurrencePattern | '')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                >
                  <option value="">No Recurrence</option>
                  <option value="daily">🔄 Daily</option>
                  <option value="weekly">🔄 Weekly</option>
                  <option value="monthly">🔄 Monthly</option>
                  <option value="yearly">🔄 Yearly</option>
                </select>
                {recurrencePattern && !dueDate && (
                  <p className="mt-1 text-sm text-amber-600">⚠️ Recurring todos require a due date</p>
                )}
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reminder (Optional)</label>
                <select
                  value={reminderMinutes === null ? '' : reminderMinutes}
                  onChange={(e) => setReminderMinutes(e.target.value === '' ? null : parseInt(e.target.value) as ReminderMinutes)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting || !dueDate}
                >
                  {REMINDER_OPTIONS.map(option => (
                    <option key={option.value ?? 'none'} value={option.value ?? ''}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {reminderMinutes && !dueDate && (
                  <p className="mt-1 text-sm text-amber-600">⚠️ Reminders require a due date</p>
                )}
                {!dueDate && (
                  <p className="mt-1 text-sm text-gray-500">Set a due date to enable reminders</p>
                )}
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

        {/* Priority Filter and Statistics */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Filter by Priority:</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as Priority | 'all')}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🔵 Low</option>
              </select>
            </div>
            
            {/* Priority Statistics */}
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-1 bg-red-100 text-red-800 border border-red-300 rounded-full text-xs font-semibold">
                  HIGH
                </span>
                <span className="text-gray-600">{priorityCounts.high}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-full text-xs font-semibold">
                  MED
                </span>
                <span className="text-gray-600">{priorityCounts.medium}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 border border-blue-300 rounded-full text-xs font-semibold">
                  LOW
                </span>
                <span className="text-gray-600">{priorityCounts.low}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Overdue Section */}
        {overdueTodos.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-red-600 mb-4">
              Overdue ({overdueTodos.length})
            </h2>
            <div className="space-y-3">
              {overdueTodos.map(todo => (
                <TodoItem 
                  key={todo.id} 
                  todo={todo}
                  expandedTodos={expandedTodos}
                  subtaskInputs={subtaskInputs}
                  onToggleComplete={handleToggleComplete}
                  onToggleSubtasks={toggleSubtasks}
                  onOpenEditModal={openEditModal}
                  onDelete={handleDelete}
                  onSubtaskInputChange={handleSubtaskInputChange}
                  onAddSubtask={handleAddSubtask}
                  onToggleSubtask={handleToggleSubtask}
                  onDeleteSubtask={handleDeleteSubtask}
                />
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
                <TodoItem 
                  key={todo.id} 
                  todo={todo}
                  expandedTodos={expandedTodos}
                  subtaskInputs={subtaskInputs}
                  onToggleComplete={handleToggleComplete}
                  onToggleSubtasks={toggleSubtasks}
                  onOpenEditModal={openEditModal}
                  onDelete={handleDelete}
                  onSubtaskInputChange={handleSubtaskInputChange}
                  onAddSubtask={handleAddSubtask}
                  onToggleSubtask={handleToggleSubtask}
                  onDeleteSubtask={handleDeleteSubtask}
                />
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
                <TodoItem 
                  key={todo.id} 
                  todo={todo}
                  expandedTodos={expandedTodos}
                  subtaskInputs={subtaskInputs}
                  onToggleComplete={handleToggleComplete}
                  onToggleSubtasks={toggleSubtasks}
                  onOpenEditModal={openEditModal}
                  onDelete={handleDelete}
                  onSubtaskInputChange={handleSubtaskInputChange}
                  onAddSubtask={handleAddSubtask}
                  onToggleSubtask={handleToggleSubtask}
                  onDeleteSubtask={handleDeleteSubtask}
                />
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
                    <option value="high">🔴 High Priority</option>
                    <option value="medium">🟡 Medium Priority</option>
                    <option value="low">🔵 Low Priority</option>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence Pattern</label>
                  <select
                    value={editRecurrencePattern}
                    onChange={(e) => setEditRecurrencePattern(e.target.value as RecurrencePattern | '')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                  >
                    <option value="">No Recurrence</option>
                    <option value="daily">🔄 Daily</option>
                    <option value="weekly">🔄 Weekly</option>
                    <option value="monthly">🔄 Monthly</option>
                    <option value="yearly">🔄 Yearly</option>
                  </select>
                  {editRecurrencePattern && !editDueDate && (
                    <p className="mt-1 text-sm text-amber-600">⚠️ Recurring todos require a due date</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reminder</label>
                  <select
                    value={editReminderMinutes === null ? '' : editReminderMinutes}
                    onChange={(e) => setEditReminderMinutes(e.target.value === '' ? null : parseInt(e.target.value) as ReminderMinutes)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting || !editDueDate}
                  >
                    {REMINDER_OPTIONS.map(option => (
                      <option key={option.value ?? 'none'} value={option.value ?? ''}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {editReminderMinutes && !editDueDate && (
                    <p className="mt-1 text-sm text-amber-600">⚠️ Reminders require a due date</p>
                  )}
                  {!editDueDate && (
                    <p className="mt-1 text-sm text-gray-500">Set a due date to enable reminders</p>
                  )}
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
