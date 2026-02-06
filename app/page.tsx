'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Subtask {
  id: number;
  todo_id: number;
  title: string;
  completed: boolean;
  position: number;
}

interface Tag {
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: string;
}

interface Template {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  category: string | null;
  title_template: string;
  priority: Priority;
  is_recurring: boolean;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: number | null;
  subtasks_json: string | null;
  due_date_offset_days: number | null;
  created_at: string;
}

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  due_date: string | null;
  priority: 'high' | 'medium' | 'low';
  is_recurring: boolean;
  recurrence_pattern: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  reminder_minutes: number | null;
  subtasks: Subtask[];
  tags: Tag[];
  created_at: string;
}

interface User {
  id: number;
  username: string;
}

type Priority = 'high' | 'medium' | 'low';
type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>('weekly');
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(null);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [showCompleted, setShowCompleted] = useState(true);
  
  // Phase 3: Tag system state
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<number>>(new Set());
  const [tagFilter, setTagFilter] = useState<number | 'all'>('all');
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#3B82F6');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  
  // Phase 4: Template system state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  
  // Edit modal state
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  const [editIsRecurring, setEditIsRecurring] = useState(false);
  const [editRecurrencePattern, setEditRecurrencePattern] = useState<RecurrencePattern>('weekly');
  const [editReminderMinutes, setEditReminderMinutes] = useState<number | null>(null);
  const [editSelectedTagIds, setEditSelectedTagIds] = useState<Set<number>>(new Set());
  
  // Notification permission
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  
  // Subtask expansion state
  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<number>>(new Set());

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Notification polling
  useEffect(() => {
    if (notificationPermission !== 'granted') return;

    const checkNotifications = async () => {
      try {
        const res = await fetch('/api/notifications/check');
        if (res.ok) {
          const data = await res.json();
          data.notifications?.forEach((todo: Todo) => {
            new Notification(`Todo Reminder: ${todo.title}`, {
              body: `Due: ${todo.due_date ? new Date(todo.due_date).toLocaleString() : 'No due date'}`,
            });
          });
        }
      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    };

    // Check immediately and then every 60 seconds
    checkNotifications();
    const interval = setInterval(checkNotifications, 60000);
    return () => clearInterval(interval);
  }, [notificationPermission]);

  // Fetch current user
  useEffect(() => {
    fetchUser();
  }, []);

  // Fetch todos when user is loaded
  useEffect(() => {
    if (user) {
      fetchTodos();
      fetchTags();
      fetchTemplates();
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

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/tags');
      if (res.ok) {
        const data = await res.json();
        setTags(data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  // Phase 4: Template functions
  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleSaveAsTemplate = () => {
    if (!title.trim()) {
      alert('Please enter a todo title first');
      return;
    }
    setTemplateName(title);
    setTemplateDescription('');
    setTemplateCategory('');
    setShowSaveTemplateModal(true);
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!templateName.trim()) {
      alert('Template name is required');
      return;
    }

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          description: templateDescription || null,
          category: templateCategory || null,
          title_template: title,
          priority,
          is_recurring: isRecurring,
          recurrence_pattern: isRecurring ? recurrencePattern : null,
          reminder_minutes: reminderMinutes,
          subtasks_json: null, // Could be enhanced to save current subtasks
          due_date_offset_days: dueDate ? 7 : null, // Default 7 days offset
        }),
      });

      if (res.ok) {
        await fetchTemplates();
        setShowSaveTemplateModal(false);
        setTemplateName('');
        setTemplateDescription('');
        setTemplateCategory('');
        alert('Template saved successfully!');
      } else {
        const error = await res.json();
        alert(`Failed to save template: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Failed to save template');
    }
  };

  const handleUseTemplate = async (templateId: number) => {
    try {
      const res = await fetch(`/api/templates/${templateId}/use`, {
        method: 'POST',
      });

      if (res.ok) {
        await fetchTodos();
        alert('Todo created from template!');
      } else {
        const error = await res.json();
        alert(`Failed to use template: ${error.error}`);
      }
    } catch (error) {
      console.error('Error using template:', error);
      alert('Failed to use template');
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchTemplates();
        alert('Template deleted');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  // Phase 4: Export/Import functions
  const handleExportJSON = async () => {
    try {
      const response = await fetch('/api/todos/export?format=json');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `todos-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting JSON:', error);
      alert('Failed to export todos');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/todos/export?format=csv');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `todos-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export todos');
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const text = await file.text();
      try {
        const todos = JSON.parse(text);
        const response = await fetch('/api/todos/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(todos),
        });
        
        const result = await response.json();
        if (response.ok) {
          await fetchTodos();
          alert(result.message);
        } else {
          alert(`Error: ${result.error}`);
        }
      } catch (error) {
        console.error('Error importing:', error);
        alert('Invalid JSON format');
      }
    };
    input.click();
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Title cannot be empty');
      return;
    }

    // Validate recurring todos must have due date
    if (isRecurring && !dueDate) {
      alert('Recurring todos require a due date');
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
          is_recurring: isRecurring,
          recurrence_pattern: isRecurring ? recurrencePattern : null,
          reminder_minutes: reminderMinutes,
        }),
      });

      if (res.ok) {
        const newTodo = await res.json();
        
        // Assign tags if any selected
        if (selectedTagIds.size > 0) {
          await fetch(`/api/todos/${newTodo.id}/tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tagIds: Array.from(selectedTagIds) }),
          });
        }
        
        // Refresh todos to get updated with tags
        await fetchTodos();
        
        setTitle('');
        setDueDate('');
        setPriority('medium');
        setIsRecurring(false);
        setRecurrencePattern('weekly');
        setReminderMinutes(null);
        setSelectedTagIds(new Set());
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
        // Fetch all todos again to get the new recurring instance if created
        await fetchTodos();
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
    setEditIsRecurring(todo.is_recurring);
    setEditRecurrencePattern((todo.recurrence_pattern as RecurrencePattern) || 'weekly');
    setEditReminderMinutes(todo.reminder_minutes);
    setEditSelectedTagIds(new Set(todo.tags.map(t => t.id)));
  };

  const closeEditModal = () => {
    setEditingTodo(null);
    setEditTitle('');
    setEditDueDate('');
    setEditPriority('medium');
    setEditIsRecurring(false);
    setEditRecurrencePattern('weekly');
    setEditReminderMinutes(null);
    setEditSelectedTagIds(new Set());
  };

  const handleUpdateTodo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingTodo) return;

    if (!editTitle.trim()) {
      alert('Title cannot be empty');
      return;
    }

    // Validate recurring todos must have due date
    if (editIsRecurring && !editDueDate) {
      alert('Recurring todos require a due date');
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
          is_recurring: editIsRecurring,
          recurrence_pattern: editIsRecurring ? editRecurrencePattern : null,
          reminder_minutes: editDueDate ? editReminderMinutes : null, // Clear reminder if no due date
        }),
      });

      if (res.ok) {
        // Update tags separately
        await fetch(`/api/todos/${editingTodo.id}/tags`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tagIds: Array.from(editSelectedTagIds) }),
        });
        
        // Refresh todos to get updated data with tags
        await fetchTodos();
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

  // Subtask handlers
  const toggleSubtasksExpanded = (todoId: number) => {
    const newExpanded = new Set(expandedSubtasks);
    if (newExpanded.has(todoId)) {
      newExpanded.delete(todoId);
    } else {
      newExpanded.add(todoId);
    }
    setExpandedSubtasks(newExpanded);
  };

  const handleAddSubtask = async (todoId: number, subtaskTitle: string) => {
    if (!subtaskTitle.trim()) {
      alert('Subtask title cannot be empty');
      return;
    }

    try {
      const res = await fetch(`/api/todos/${todoId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: subtaskTitle.trim() }),
      });

      if (res.ok) {
        await fetchTodos(); // Refresh to get updated subtasks
      }
    } catch (error) {
      console.error('Error adding subtask:', error);
    }
  };

  const handleToggleSubtask = async (todoId: number, subtaskId: number, completed: boolean) => {
    try {
      const res = await fetch(`/api/todos/${todoId}/subtasks/${subtaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });

      if (res.ok) {
        await fetchTodos(); // Refresh to get updated subtasks
      }
    } catch (error) {
      console.error('Error toggling subtask:', error);
    }
  };

  const handleDeleteSubtask = async (todoId: number, subtaskId: number) => {
    try {
      const res = await fetch(`/api/todos/${todoId}/subtasks/${subtaskId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchTodos(); // Refresh to get updated subtasks
      }
    } catch (error) {
      console.error('Error deleting subtask:', error);
    }
  };

  // Phase 3: Tag handlers
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tagName.trim()) {
      alert('Tag name cannot be empty');
      return;
    }

    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagName.trim(), color: tagColor }),
      });

      if (res.ok) {
        await fetchTags();
        setTagName('');
        setTagColor('#3B82F6');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create tag');
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      alert('Failed to create tag');
    }
  };

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingTag) return;

    if (!tagName.trim()) {
      alert('Tag name cannot be empty');
      return;
    }

    try {
      const res = await fetch(`/api/tags/${editingTag.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagName.trim(), color: tagColor }),
      });

      if (res.ok) {
        await fetchTags();
        await fetchTodos(); // Refresh todos to show updated tag colors
        setEditingTag(null);
        setTagName('');
        setTagColor('#3B82F6');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update tag');
      }
    } catch (error) {
      console.error('Error updating tag:', error);
      alert('Failed to update tag');
    }
  };

  const openEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagColor(tag.color);
  };

  const cancelEditTag = () => {
    setEditingTag(null);
    setTagName('');
    setTagColor('#3B82F6');
  };

  const handleDeleteTag = async (tagId: number) => {
    if (!confirm('Delete this tag? It will be removed from all todos.')) return;

    try {
      const res = await fetch(`/api/tags/${tagId}`, { method: 'DELETE' });

      if (res.ok) {
        await fetchTags();
        await fetchTodos(); // Refresh todos to remove deleted tags
        // Clear tag filter if it was the deleted tag
        if (tagFilter === tagId) {
          setTagFilter('all');
        }
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  const toggleTagSelection = (tagId: number) => {
    const newSelected = new Set(selectedTagIds);
    if (newSelected.has(tagId)) {
      newSelected.delete(tagId);
    } else {
      newSelected.add(tagId);
    }
    setSelectedTagIds(newSelected);
  };

  const toggleEditTagSelection = (tagId: number) => {
    const newSelected = new Set(editSelectedTagIds);
    if (newSelected.has(tagId)) {
      newSelected.delete(tagId);
    } else {
      newSelected.add(tagId);
    }
    setEditSelectedTagIds(newSelected);
  };

  // Helper functions
  const getReminderLabel = (minutes: number | null): string => {
    if (!minutes) return '';
    switch (minutes) {
      case 15: return '15m';
      case 30: return '30m';
      case 60: return '1h';
      case 120: return '2h';
      case 1440: return '1d';
      case 2880: return '2d';
      case 10080: return '1w';
      default: return `${minutes}m`;
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
    // Phase 3: Text search (title + subtask titles)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const titleMatch = todo.title.toLowerCase().includes(query);
      const subtaskMatch = todo.subtasks?.some(s => s.title.toLowerCase().includes(query));
      if (!titleMatch && !subtaskMatch) {
        return false;
      }
    }

    // Priority filter
    if (priorityFilter !== 'all' && todo.priority !== priorityFilter) {
      return false;
    }

    // Phase 3: Tag filter
    if (tagFilter !== 'all') {
      if (!todo.tags?.some(t => t.id === tagFilter)) {
        return false;
      }
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center mb-4">
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
          
          {/* Phase 4: Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => router.push('/calendar')}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              📅 Calendar
            </button>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              📋 Templates
            </button>
            <button
              onClick={handleExportJSON}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              📥 Export JSON
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 transition-colors"
            >
              📊 Export CSV
            </button>
            <button
              onClick={handleImport}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              📤 Import
            </button>
            <button
              onClick={() => setShowTagModal(true)}
              className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 transition-colors"
            >
              🏷️ Manage Tags
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
            </div>
            
            {/* Phase 2: Recurring and Reminder Controls */}
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  disabled={!dueDate}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
                />
                <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Repeat
                </label>
              </div>
              
              {isRecurring && (
                <div className="flex-1 min-w-[150px]">
                  <select
                    value={recurrencePattern}
                    onChange={(e) => setRecurrencePattern(e.target.value as RecurrencePattern)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}
              
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reminder
                </label>
                <select
                  value={reminderMinutes ?? ''}
                  onChange={(e) => setReminderMinutes(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={!dueDate}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">No reminder</option>
                  <option value="15">15 minutes before</option>
                  <option value="30">30 minutes before</option>
                  <option value="60">1 hour before</option>
                  <option value="120">2 hours before</option>
                  <option value="1440">1 day before</option>
                  <option value="2880">2 days before</option>
                  <option value="10080">1 week before</option>
                </select>
              </div>
            </div>

            {/* Phase 3: Tag Selection Pills */}
            {tags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => {
                    const isSelected = selectedTagIds.has(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTagSelection(tag.id)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          isSelected
                            ? 'text-gray-900 dark:text-gray-900'
                            : 'bg-white dark:bg-gray-700 border-2 text-gray-700 dark:text-gray-300'
                        }`}
                        style={isSelected ? { backgroundColor: tag.color, borderColor: tag.color } : { borderColor: tag.color }}
                      >
                        {isSelected && '✓ '}{tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              {notificationPermission !== 'granted' && (
                <button
                  type="button"
                  onClick={requestNotificationPermission}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  🔔 Enable notifications
                </button>
              )}
              
              {/* Phase 4: Template Actions */}
              {templates.length > 0 && (
                <select
                  onChange={(e) => e.target.value && handleUseTemplate(parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value=""
                >
                  <option value="">Use Template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}{template.category ? ` (${template.category})` : ''}
                    </option>
                  ))}
                </select>
              )}
              
              {title.trim() && (
                <button
                  type="button"
                  onClick={handleSaveAsTemplate}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  💾 Save as Template
                </button>
              )}
              
              <button
                type="submit"
                className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Add
              </button>
            </div>
          </form>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex gap-4 flex-wrap items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search todos and subtasks..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
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
            
            {/* Phase 3: Tag Filter */}
            {tags.length > 0 && (
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tag
                </label>
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Tags</option>
                  {tags.map(tag => (
                    <option key={tag.id} value={tag.id}>{tag.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex items-center gap-2">
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
            
            {/* Phase 3: Manage Tags Button */}
            <div>
              <button
                onClick={() => setShowTagModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                🏷️ Manage Tags
              </button>
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
                  expandedSubtasks={expandedSubtasks}
                  toggleSubtasksExpanded={toggleSubtasksExpanded}
                  handleAddSubtask={handleAddSubtask}
                  handleToggleSubtask={handleToggleSubtask}
                  handleDeleteSubtask={handleDeleteSubtask}
                  getReminderLabel={getReminderLabel}
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
                  expandedSubtasks={expandedSubtasks}
                  toggleSubtasksExpanded={toggleSubtasksExpanded}
                  handleAddSubtask={handleAddSubtask}
                  handleToggleSubtask={handleToggleSubtask}
                  handleDeleteSubtask={handleDeleteSubtask}
                  getReminderLabel={getReminderLabel}
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
                  expandedSubtasks={expandedSubtasks}
                  toggleSubtasksExpanded={toggleSubtasksExpanded}
                  handleAddSubtask={handleAddSubtask}
                  handleToggleSubtask={handleToggleSubtask}
                  handleDeleteSubtask={handleDeleteSubtask}
                  getReminderLabel={getReminderLabel}
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
              
              {/* Phase 2: Recurring and Reminder Controls */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsRecurring"
                  checked={editIsRecurring}
                  onChange={(e) => setEditIsRecurring(e.target.checked)}
                  disabled={!editDueDate}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
                />
                <label htmlFor="editIsRecurring" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Repeat
                </label>
              </div>
              
              {editIsRecurring && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Recurrence Pattern
                  </label>
                  <select
                    value={editRecurrencePattern}
                    onChange={(e) => setEditRecurrencePattern(e.target.value as RecurrencePattern)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reminder
                </label>
                <select
                  value={editReminderMinutes ?? ''}
                  onChange={(e) => setEditReminderMinutes(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={!editDueDate}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">No reminder</option>
                  <option value="15">15 minutes before</option>
                  <option value="30">30 minutes before</option>
                  <option value="60">1 hour before</option>
                  <option value="120">2 hours before</option>
                  <option value="1440">1 day before</option>
                  <option value="2880">2 days before</option>
                  <option value="10080">1 week before</option>
                </select>
              </div>
              
              {/* Phase 3: Tag Selection Pills */}
              {tags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => {
                      const isSelected = editSelectedTagIds.has(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleEditTagSelection(tag.id)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            isSelected
                              ? 'text-gray-900 dark:text-gray-900'
                              : 'bg-white dark:bg-gray-700 border-2 text-gray-700 dark:text-gray-300'
                          }`}
                          style={isSelected ? { backgroundColor: tag.color, borderColor: tag.color } : { borderColor: tag.color }}
                        >
                          {isSelected && '✓ '}{tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
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

      {/* Phase 3: Tag Management Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Manage Tags</h2>
              <button
                onClick={() => {
                  setShowTagModal(false);
                  cancelEditTag();
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Create/Edit Tag Form */}
            <form onSubmit={editingTag ? handleUpdateTag : handleCreateTag} className="mb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tag Name
                  </label>
                  <input
                    type="text"
                    value={tagName}
                    onChange={(e) => setTagName(e.target.value)}
                    placeholder="Enter tag name..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={tagColor}
                      onChange={(e) => setTagColor(e.target.value)}
                      className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={tagColor}
                      onChange={(e) => setTagColor(e.target.value)}
                      placeholder="#3B82F6"
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {editingTag ? (
                  <>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Update Tag
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditTag}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 font-medium"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    Create Tag
                  </button>
                )}
              </div>
            </form>

            {/* Tag List */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Your Tags</h3>
              {tags.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No tags yet. Create one to get started!
                </p>
              ) : (
                <div className="space-y-2">
                  {tags.map(tag => (
                    <div key={tag.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="font-medium text-gray-900 dark:text-white">{tag.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{tag.color}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditTag(tag)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Phase 4: Template Manager Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Template Library</h2>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              {templates.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No templates yet. Create a todo and save it as a template!
                </p>
              ) : (
                <div className="space-y-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {template.name}
                          </h3>
                          {template.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {template.description}
                            </p>
                          )}
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                            Creates: "{template.title_template}"
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              handleUseTemplate(template.id);
                              setShowTemplateModal(false);
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Use
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 flex-wrap mt-3">
                        {template.category && (
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs rounded-full">
                            {template.category}
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          template.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' :
                          template.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' :
                          'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                        }`}>
                          {template.priority}
                        </span>
                        {template.is_recurring && (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs rounded-full">
                            🔄 {template.recurrence_pattern}
                          </span>
                        )}
                        {template.reminder_minutes && (
                          <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 text-xs rounded-full">
                            🔔 {template.reminder_minutes}m before
                          </span>
                        )}
                        {template.due_date_offset_days !== null && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                            📅 Due in {template.due_date_offset_days} days
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Phase 4: Save Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Save as Template</h2>
                <button
                  onClick={() => setShowSaveTemplateModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateTemplate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., Weekly Review"
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="Optional description..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value)}
                    placeholder="e.g., Work, Personal, Finance"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    This template will save:
                  </p>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <li>• Title: "{title}"</li>
                    <li>• Priority: {priority}</li>
                    {isRecurring && <li>• Recurring: {recurrencePattern}</li>}
                    {reminderMinutes && <li>• Reminder: {reminderMinutes} minutes before</li>}
                  </ul>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowSaveTemplateModal(false)}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Save Template
                  </button>
                </div>
              </form>
            </div>
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
  expandedSubtasks,
  toggleSubtasksExpanded,
  handleAddSubtask,
  handleToggleSubtask,
  handleDeleteSubtask,
  getReminderLabel,
}: {
  todo: Todo;
  onToggle: (todo: Todo) => void;
  onDelete: (id: number) => void;
  onEdit: (todo: Todo) => void;
  getTimeDifference: (dueDate: string | null) => { text: string; color: string } | null;
  priorityClasses: Record<Priority, string>;
  expandedSubtasks: Set<number>;
  toggleSubtasksExpanded: (todoId: number) => void;
  handleAddSubtask: (todoId: number, title: string) => Promise<void>;
  handleToggleSubtask: (todoId: number, subtaskId: number, completed: boolean) => Promise<void>;
  handleDeleteSubtask: (todoId: number, subtaskId: number) => Promise<void>;
  getReminderLabel: (minutes: number | null) => string;
}) {
  const timeDisplay = getTimeDifference(todo.due_date);
  const [subtaskInput, setSubtaskInput] = useState('');
  
  // Calculate subtask progress
  const completedSubtasks = todo.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = todo.subtasks?.length || 0;
  const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const handleSubtaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subtaskInput.trim()) {
      await handleAddSubtask(todo.id, subtaskInput);
      setSubtaskInput('');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-start gap-4">
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
            {/* Priority Badge */}
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityClasses[todo.priority]}`}>
              {todo.priority}
            </span>
            {/* Phase 2: Recurring Badge */}
            {todo.is_recurring && todo.recurrence_pattern && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                🔄 {todo.recurrence_pattern}
              </span>
            )}
            {/* Phase 2: Reminder Badge */}
            {todo.reminder_minutes && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                🔔 {getReminderLabel(todo.reminder_minutes)}
              </span>
            )}
            {/* Phase 3: Tag Pills */}
            {todo.tags?.map(tag => (
              <span
                key={tag.id}
                className="px-2 py-0.5 rounded-full text-xs font-medium text-gray-900 dark:text-gray-900"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
          {timeDisplay && (
            <p className={`text-sm ${timeDisplay.color} mb-2`}>
              {timeDisplay.text}
            </p>
          )}
          
          {/* Phase 2: Subtasks Section */}
          {totalSubtasks > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {completedSubtasks}/{totalSubtasks}
                </span>
              </div>
              <button
                onClick={() => toggleSubtasksExpanded(todo.id)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {expandedSubtasks.has(todo.id) ? '▼ Hide subtasks' : '▶ Show subtasks'}
              </button>
            </div>
          )}
          
          {/* Phase 2: Subtasks List (Expanded) */}
          {expandedSubtasks.has(todo.id) && (
            <div className="mt-3 space-y-2 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
              {todo.subtasks?.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => handleToggleSubtask(todo.id, subtask.id, subtask.completed)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
                  />
                  <span
                    className={`text-sm flex-1 ${
                      subtask.completed
                        ? 'line-through text-gray-400 dark:text-gray-500'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {subtask.title}
                  </span>
                  <button
                    onClick={() => handleDeleteSubtask(todo.id, subtask.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
              
              {/* Add Subtask Form */}
              <form onSubmit={handleSubtaskSubmit} className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  placeholder="Add a subtask..."
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Add
                </button>
              </form>
            </div>
          )}
          
          {/* Show "Add subtasks" button if no subtasks yet */}
          {totalSubtasks === 0 && !expandedSubtasks.has(todo.id) && (
            <button
              onClick={() => toggleSubtasksExpanded(todo.id)}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              + Add subtasks
            </button>
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
    </div>
  );
}
