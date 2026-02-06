'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Priority, Todo, UpdateTodoInput, RecurrencePattern, Subtask, SubtaskProgress, TodoWithSubtasks, Tag, TemplateWithSubtasks, SubtaskInput, SUGGESTED_CATEGORIES, DUE_OFFSET_PRESETS } from '@/lib/db-types';
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
            
            {/* Tags */}
            {(todo as any).tags && (todo as any).tags.length > 0 && (
              (todo as any).tags.map((tag: Tag) => (
                <span
                  key={tag.id}
                  className="text-xs px-2 py-1 rounded-full font-medium text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              ))
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
  const router = useRouter();
  
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
  const [tagFilter, setTagFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [completionFilter, setCompletionFilter] = useState<'all' | 'incomplete' | 'completed'>('all');
  const [dueDateFrom, setDueDateFrom] = useState('');
  const [dueDateTo, setDueDateTo] = useState('');
  
  // Tag management state
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [editSelectedTags, setEditSelectedTags] = useState<number[]>([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#3B82F6');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editTagName, setEditTagName] = useState('');
  const [editTagColor, setEditTagColor] = useState('');
  
  // Template management state
  const [templates, setTemplates] = useState<TemplateWithSubtasks[]>([]);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [templateDueOffset, setTemplateDueOffset] = useState<number | null>(null);
  const [customDueOffset, setCustomDueOffset] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<TemplateWithSubtasks | null>(null);
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [editTemplateName, setEditTemplateName] = useState('');
  const [editTemplateDescription, setEditTemplateDescription] = useState('');
  const [editTemplateCategory, setEditTemplateCategory] = useState('');
  
  // Filter preset state
  interface FilterPreset {
    id: string;
    name: string;
    searchQuery: string;
    priorityFilter: Priority | 'all';
    tagFilter: number | null;
    completionFilter: 'all' | 'incomplete' | 'completed';
    dueDateFrom: string;
    dueDateTo: string;
  }
  
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>([]);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  
  // Import ref
  const importFileInputRef = useState<HTMLInputElement | null>(null)[0];
  
  // Load filter presets from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('filterPresets');
    if (saved) {
      try {
        setFilterPresets(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load filter presets:', e);
      }
    }
  }, []);
  
  // Save filter presets to localStorage whenever they change
  useEffect(() => {
    if (filterPresets.length > 0) {
      localStorage.setItem('filterPresets', JSON.stringify(filterPresets));
    } else {
      localStorage.removeItem('filterPresets');
    }
  }, [filterPresets]);
  
  // Notifications hook
  const { 
    permission, 
    enabled, 
    isPolling,
    requestPermission, 
    startPolling, 
    stopPolling 
  } = useNotifications();

  // Fetch todos and tags on mount
  useEffect(() => {
    fetchTodos();
    fetchTags();
    fetchTemplates();
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

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      
      if (response.status === 401) {
        return; // Not logged in yet
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }
      
      const data = await response.json();
      setTags(data);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      
      if (response.status === 401) {
        return; // Not logged in yet
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      
      const data = await response.json();
      setTemplates(data.templates);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = tagName.trim();
    if (!trimmedName) {
      alert('Tag name is required');
      return;
    }
    
    if (trimmedName.length > 50) {
      alert('Tag name must be 50 characters or less');
      return;
    }

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          color: tagColor,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to create tag');
        return;
      }

      const newTag = await response.json();
      setTags(prev => [...prev, newTag]);
      setTagName('');
      setTagColor('#3B82F6');
    } catch (error) {
      console.error('Failed to create tag:', error);
      alert('Failed to create tag');
    }
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setEditTagName(tag.name);
    setEditTagColor(tag.color);
  };

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTag) return;
    
    const trimmedName = editTagName.trim();
    if (!trimmedName) {
      alert('Tag name is required');
      return;
    }
    
    if (trimmedName.length > 50) {
      alert('Tag name must be 50 characters or less');
      return;
    }

    try {
      const response = await fetch(`/api/tags/${editingTag.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          color: editTagColor,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to update tag');
        return;
      }

      const updatedTag = await response.json();
      setTags(prev => prev.map(t => t.id === updatedTag.id ? updatedTag : t));
      setEditingTag(null);
      setEditTagName('');
      setEditTagColor('');
      
      // Refresh todos to get updated tag colors
      fetchTodos();
    } catch (error) {
      console.error('Failed to update tag:', error);
      alert('Failed to update tag');
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    if (!confirm('Are you sure you want to delete this tag? It will be removed from all todos.')) {
      return;
    }

    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to delete tag');
        return;
      }

      setTags(prev => prev.filter(t => t.id !== tagId));
      setSelectedTags(prev => prev.filter(id => id !== tagId));
      setEditSelectedTags(prev => prev.filter(id => id !== tagId));
      if (tagFilter === tagId) {
        setTagFilter(null);
      }
      
      // Refresh todos to remove deleted tag from todo items
      fetchTodos();
    } catch (error) {
      console.error('Failed to delete tag:', error);
      alert('Failed to delete tag');
    }
  };

  const toggleTagSelection = (tagId: number) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const toggleEditTagSelection = (tagId: number) => {
    setEditSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Template management functions
  const handleSaveAsTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = templateName.trim();
    if (!trimmedName) {
      alert('Template name is required');
      return;
    }
    
    if (!title.trim()) {
      alert('Cannot save template without a todo title');
      return;
    }

    // Get current subtasks from form (if subtask list exists in state)
    const currentSubtasks: SubtaskInput[] = [];
    // Note: Subtasks in form are managed differently. We'll leave this empty for now
    // Users can add subtasks to templates by editing them after creation

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          description: templateDescription.trim() || null,
          category: templateCategory.trim() || null,
          title_template: title.trim(),
          priority,
          recurrence_enabled: recurrencePattern ? 1 : 0,
          recurrence_pattern: recurrencePattern || null,
          reminder_minutes: reminderMinutes,
          due_offset_days: templateDueOffset,
          subtasks: currentSubtasks,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to create template');
        return;
      }

      alert('Template saved successfully!');
      setTemplateName('');
      setTemplateDescription('');
      setTemplateCategory('');
      setTemplateDueOffset(null);
      setCustomDueOffset('');
      setShowSaveTemplateModal(false);
      
      await fetchTemplates();
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template');
    }
  };

  const handleUseTemplate = async (templateId: number) => {
    try {
      const response = await fetch(`/api/templates/${templateId}/use`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to create todo from template');
        return;
      }

      await fetchTodos();
      alert('Todo created from template!');
    } catch (error) {
      console.error('Failed to use template:', error);
      alert('Failed to create todo from template');
    }
  };

  const handleEditTemplate = (template: TemplateWithSubtasks) => {
    setEditingTemplate(template);
    setEditTemplateName(template.name);
    setEditTemplateDescription(template.description || '');
    setEditTemplateCategory(template.category || '');
    setShowEditTemplateModal(true);
  };

  const handleUpdateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTemplate) return;
    
    const trimmedName = editTemplateName.trim();
    if (!trimmedName) {
      alert('Template name is required');
      return;
    }

    try {
      const response = await fetch(`/api/templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          description: editTemplateDescription.trim() || null,
          category: editTemplateCategory.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to update template');
        return;
      }

      setShowEditTemplateModal(false);
      setEditingTemplate(null);
      await fetchTemplates();
      alert('Template updated successfully!');
    } catch (error) {
      console.error('Failed to update template:', error);
      alert('Failed to update template');
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template? This will not affect existing todos.')) {
      return;
    }

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to delete template');
        return;
      }

      await fetchTemplates();
      alert('Template deleted successfully!');
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template');
    }
  };

  // Export/Import handlers
  const handleExportJSON = async () => {
    try {
      const response = await fetch('/api/todos/export?format=json');
      if (!response.ok) {
        throw new Error('Failed to export todos');
      }

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export todos');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/todos/export?format=csv');
      if (!response.ok) {
        throw new Error('Failed to export todos');
      }

      const csvContent = await response.text();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `todos-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export todos');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be selected again
    event.target.value = '';

    if (!confirm('This will create new todos from the import file. Importing the same file multiple times will create duplicates. Continue?')) {
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const response = await fetch('/api/todos/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to import todos');
      }

      setError(null);
      // Show success message temporarily
      const successMsg = result.message || 'Successfully imported todos';
      setError(successMsg);
      setTimeout(() => setError(null), 5000);
      
      // Refresh todos list
      fetchTodos();
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to import todos');
      }
      setTimeout(() => setError(null), 5000);
    }
  };

  // Filter preset management functions
  const saveFilterPreset = () => {
    const trimmedName = presetName.trim();
    if (!trimmedName) {
      alert('Preset name is required');
      return;
    }
    
    if (trimmedName.length > 50) {
      alert('Preset name must be 50 characters or less');
      return;
    }

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: trimmedName,
      searchQuery,
      priorityFilter,
      tagFilter,
      completionFilter,
      dueDateFrom,
      dueDateTo,
    };

    setFilterPresets(prev => [...prev, newPreset]);
    setPresetName('');
    setShowSavePresetModal(false);
  };

  const applyFilterPreset = (preset: FilterPreset) => {
    setSearchQuery(preset.searchQuery);
    setPriorityFilter(preset.priorityFilter);
    setTagFilter(preset.tagFilter);
    setCompletionFilter(preset.completionFilter);
    setDueDateFrom(preset.dueDateFrom);
    setDueDateTo(preset.dueDateTo);
    if (preset.dueDateFrom || preset.dueDateTo || preset.completionFilter !== 'all') {
      setShowAdvancedFilters(true);
    }
  };

  const deleteFilterPreset = (presetId: string) => {
    if (!confirm('Are you sure you want to delete this filter preset?')) {
      return;
    }
    setFilterPresets(prev => prev.filter(p => p.id !== presetId));
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setPriorityFilter('all');
    setTagFilter(null);
    setCompletionFilter('all');
    setDueDateFrom('');
    setDueDateTo('');
  };

  const hasActiveFilters = () => {
    return searchQuery !== '' ||
           priorityFilter !== 'all' ||
           tagFilter !== null ||
           completionFilter !== 'all' ||
           dueDateFrom !== '' ||
           dueDateTo !== '';
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
        fetchTags();
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
          tag_ids: selectedTags,
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
      setSelectedTags([]);
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
        const errorData = await response.json();
        console.error('Failed to update todo:', errorData);
        // Revert on failure
        setTodos(prev =>
          prev.map(t => (t.id === todo.id ? { ...t, completed: todo.completed } : t))
        );
        alert(`Failed to update todo: ${errorData.error || 'Unknown error'}`);
      } else {
        // Refresh to get potential new recurring instance
        fetchTodos();
      }
    } catch (error) {
      console.error('Error updating todo:', error);
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

  // Comprehensive filtering logic with search
  let filteredTodos = todos;
  
  // Apply search filter (searches both todo titles and subtask titles)
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filteredTodos = filteredTodos.filter(todo => {
      // Search in todo title
      if (todo.title.toLowerCase().includes(query)) {
        return true;
      }
      // Search in subtask titles
      if (todo.subtasks && todo.subtasks.length > 0) {
        return todo.subtasks.some(subtask => 
          subtask.title.toLowerCase().includes(query)
        );
      }
      return false;
    });
  }
  
  // Apply priority filter
  if (priorityFilter !== 'all') {
    filteredTodos = filteredTodos.filter(todo => todo.priority === priorityFilter);
  }
  
  // Apply tag filter
  if (tagFilter !== null) {
    filteredTodos = filteredTodos.filter(todo => {
      const todoTags = (todo as any).tags || [];
      return todoTags.some((tag: Tag) => tag.id === tagFilter);
    });
  }
  
  // Apply completion status filter
  if (completionFilter === 'incomplete') {
    filteredTodos = filteredTodos.filter(todo => !todo.completed);
  } else if (completionFilter === 'completed') {
    filteredTodos = filteredTodos.filter(todo => todo.completed);
  }
  
  // Apply date range filter (only shows todos WITH due dates)
  if (dueDateFrom || dueDateTo) {
    filteredTodos = filteredTodos.filter(todo => {
      if (!todo.due_date) return false; // Exclude todos without due dates
      
      const todoDate = new Date(todo.due_date);
      
      if (dueDateFrom && dueDateTo) {
        const fromDate = new Date(dueDateFrom);
        const toDate = new Date(dueDateTo);
        toDate.setHours(23, 59, 59, 999); // Include entire end date
        return todoDate >= fromDate && todoDate <= toDate;
      } else if (dueDateFrom) {
        const fromDate = new Date(dueDateFrom);
        return todoDate >= fromDate;
      } else if (dueDateTo) {
        const toDate = new Date(dueDateTo);
        toDate.setHours(23, 59, 59, 999);
        return todoDate <= toDate;
      }
      
      return true;
    });
  }
  
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
          
          <div className="flex gap-3 flex-wrap">
            {/* Export JSON Button */}
            <button
              onClick={handleExportJSON}
              className="px-4 py-2 bg-green-100 text-green-800 border border-green-300 rounded-lg font-medium hover:bg-green-200 transition-colors"
            >
              📥 Export JSON
            </button>
            
            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-700 text-white border border-green-800 rounded-lg font-medium hover:bg-green-800 transition-colors"
            >
              📊 Export CSV
            </button>
            
            {/* Import Button */}
            <label className="px-4 py-2 bg-blue-100 text-blue-800 border border-blue-300 rounded-lg font-medium hover:bg-blue-200 transition-colors cursor-pointer">
              📤 Import
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            
            {/* Templates Button */}
            <button
              onClick={() => setShowTemplateManager(true)}
              className="px-4 py-2 bg-purple-100 text-purple-800 border border-purple-300 rounded-lg font-medium hover:bg-purple-200 transition-colors"
            >
              📋 Templates {templates.length > 0 && `(${templates.length})`}
            </button>
            
            {/* Calendar Button */}
            <button
              onClick={() => router.push('/calendar')}
              className="px-4 py-2 bg-indigo-100 text-indigo-800 border border-indigo-300 rounded-lg font-medium hover:bg-indigo-200 transition-colors"
            >
              📅 Calendar
            </button>
            
            {/* tton>
            
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
          </div>
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

            {/* Template Selector */}
            {templates.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Use Template</label>
                <select
                  onChange={(e) => {
                    const templateId = parseInt(e.target.value, 10);
                    if (templateId) {
                      handleUseTemplate(templateId);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a template to create todo instantly...</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} {template.category && `(${template.category})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

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

            {/* Tag Selection */}
            {tags.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Tags (Optional)</label>
                  <button
                    type="button"
                    onClick={() => setShowTagModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    ✚ Manage Tags
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTagSelection(tag.id)}
                      className={`px-3 py-1.5 text-sm rounded-full font-medium transition-all ${
                        selectedTags.includes(tag.id)
                          ? 'text-white border-2'
                          : 'bg-white border-2 text-gray-700'
                      }`}
                      style={{
                        backgroundColor: selectedTags.includes(tag.id) ? tag.color : 'white',
                        borderColor: tag.color,
                      }}
                    >
                      {selectedTags.includes(tag.id) && '✓ '}
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {tags.length === 0 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">No tags yet</p>
                <button
                  type="button"
                  onClick={() => setShowTagModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  ✚ Create Tags
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Adding...' : 'Add Todo'}
              </button>
              
              {title.trim() && (
                <button
                  type="button"
                  onClick={() => setShowSaveTemplateModal(true)}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Save current form as template"
                >
                  💾 Save as Template
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Search Input */}
        <div className="mb-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search todos and subtasks..."
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl font-bold"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Quick Filters (Priority and Tag) with Statistics */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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
              
              {tags.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Filter by Tag:</label>
                  <select
                    value={tagFilter ?? ''}
                    onChange={(e) => setTagFilter(e.target.value === '' ? null : parseInt(e.target.value))}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Tags</option>
                    {tags.map(tag => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                  {tagFilter && (
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ backgroundColor: tags.find(t => t.id === tagFilter)?.color }}
                    />
                  )}
                </div>
              )}
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
          
          {/* Advanced Filters Toggle and Clear All */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {showAdvancedFilters ? '▼' : '▶'} Advanced
            </button>
            
            {hasActiveFilters() && (
              <>
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Clear All
                </button>
                
                <button
                  onClick={() => setShowSavePresetModal(true)}
                  className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                >
                  💾 Save Filter
                </button>
              </>
            )}
          </div>
          
          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className={`mt-4 p-4 rounded-lg border-2 ${hasActiveFilters() ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Completion Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completion Status</label>
                  <select
                    value={completionFilter}
                    onChange={(e) => setCompletionFilter(e.target.value as 'all' | 'incomplete' | 'completed')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="all">All Todos</option>
                    <option value="incomplete">Incomplete Only</option>
                    <option value="completed">Completed Only</option>
                  </select>
                </div>
                
                {/* Due Date From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date From</label>
                  <input
                    type="date"
                    value={dueDateFrom}
                    onChange={(e) => setDueDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
                
                {/* Due Date To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date To</label>
                  <input
                    type="date"
                    value={dueDateTo}
                    onChange={(e) => setDueDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>
              
              {/* Saved Filter Presets */}
              {filterPresets.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Saved Filter Presets</h4>
                  <div className="flex flex-wrap gap-2">
                    {filterPresets.map(preset => (
                      <div key={preset.id} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-full">
                        <button
                          onClick={() => applyFilterPreset(preset)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {preset.name}
                        </button>
                        <button
                          onClick={() => deleteFilterPreset(preset.id)}
                          className="text-gray-400 hover:text-red-600 font-bold"
                          title="Delete preset"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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
        
        {/* Tag Management Modal */}
        {showTagModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Manage Tags</h2>
                  <button
                    onClick={() => {
                      setShowTagModal(false);
                      setEditingTag(null);
                      setEditTagName('');
                      setEditTagColor('');
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Create New Tag Form */}
                <form onSubmit={handleCreateTag} className="space-y-4 pb-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Create New Tag</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={tagName}
                      onChange={(e) => setTagName(e.target.value)}
                      placeholder="Tag name..."
                      maxLength={50}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={tagColor}
                        onChange={(e) => setTagColor(e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        title="Choose tag color"
                      />
                      <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors whitespace-nowrap"
                      >
                        Create Tag
                      </button>
                    </div>
                  </div>
                </form>

                {/* Tag List */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Tags</h3>
                  {tags.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No tags yet. Create one above!</p>
                  ) : (
                    <div className="space-y-3">
                      {tags.map(tag => (
                        <div key={tag.id} className="border border-gray-200 rounded-lg p-4">
                          {editingTag?.id === tag.id ? (
                            // Edit mode
                            <form onSubmit={handleUpdateTag} className="space-y-3">
                              <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                  type="text"
                                  value={editTagName}
                                  onChange={(e) => setEditTagName(e.target.value)}
                                  maxLength={50}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <input
                                  type="color"
                                  value={editTagColor}
                                  onChange={(e) => setEditTagColor(e.target.value)}
                                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                                >
                                  Update
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTag(null);
                                    setEditTagName('');
                                    setEditTagColor('');
                                  }}
                                  className="px-4 py-1.5 bg-gray-200 text-gray-800 text-sm font-medium rounded hover:bg-gray-300 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            // Display mode
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span
                                  className="px-4 py-2 rounded-full text-white font-medium"
                                  style={{ backgroundColor: tag.color }}
                                >
                                  {tag.name}
                                </span>
                                <span className="text-sm text-gray-500">{tag.color}</span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditTag(tag)}
                                  className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTag(tag.id)}
                                  className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Save Filter Preset Modal */}
        {showSavePresetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Save Filter Preset</h2>
                  <button
                    onClick={() => {
                      setShowSavePresetModal(false);
                      setPresetName('');
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Current Filter Settings:</h3>
                  <div className="space-y-1 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {searchQuery && <p>• Search: "{searchQuery}"</p>}
                    {priorityFilter !== 'all' && <p>• Priority: {priorityFilter.toUpperCase()}</p>}
                    {tagFilter && <p>• Tag: {tags.find(t => t.id === tagFilter)?.name}</p>}
                    {completionFilter !== 'all' && <p>• Status: {completionFilter}</p>}
                    {dueDateFrom && <p>• From: {dueDateFrom}</p>}
                    {dueDateTo && <p>• To: {dueDateTo}</p>}
                    {!hasActiveFilters() && <p className="text-gray-400">No active filters</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preset Name</label>
                  <input
                    type="text"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="e.g., This week's work tasks"
                    maxLength={50}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={saveFilterPreset}
                    className="flex-1 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowSavePresetModal(false);
                      setPresetName('');
                    }}
                    className="flex-1 px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Template Modal */}
        {showSaveTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4">Save as Template</h2>
              
              <form onSubmit={handleSaveAsTemplate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., Weekly Report"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="Brief description of this template"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    maxLength={500}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category (Optional)
                  </label>
                  <input
                    type="text"
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value)}
                    placeholder="e.g., Work, Personal"
                    list="category-suggestions"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    maxLength={50}
                  />
                  <datalist id="category-suggestions">
                    {SUGGESTED_CATEGORIES.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due in (Optional)
                  </label>
                  <select
                    value={templateDueOffset ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'custom') {
                        setTemplateDueOffset(null);
                      } else {
                        setTemplateDueOffset(val === '' ? null : parseInt(val));
                        setCustomDueOffset('');
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">No due date offset</option>
                    {DUE_OFFSET_PRESETS.filter(p => p.value !== null).map(preset => (
                      <option key={preset.value} value={preset.value}>
                        {preset.label}
                      </option>
                    ))}
                    <option value="custom">Custom...</option>
                  </select>
                </div>

                {templateDueOffset === null && customDueOffset === '' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custom Days (1-365)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={customDueOffset}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val >= 1 && val <= 365) {
                          setTemplateDueOffset(val);
                        }
                        setCustomDueOffset(e.target.value);
                      }}
                      placeholder="Enter number of days"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  This template will save the current todo settings (title: "{title}", priority, recurrence, reminder)
                </p>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700"
                  >
                    Save Template
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSaveTemplateModal(false);
                      setTemplateName('');
                      setTemplateDescription('');
                      setTemplateCategory('');
                      setTemplateDueOffset(null);
                      setCustomDueOffset('');
                    }}
                    className="flex-1 px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Template Manager Modal */}
        {showTemplateManager && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Template Library</h2>
              
              {templates.length === 0 ? (
                <p className="text-center py-8 text-gray-500">
                  No templates yet. Save your first template from the todo form!
                </p>
              ) : (
                <div className="space-y-6">
                  {/* Group templates by category */}
                  {Object.entries(
                    templates.reduce((acc, template) => {
                      const cat = template.category || 'Uncategorized';
                      if (!acc[cat]) acc[cat] = [];
                      acc[cat].push(template);
                      return acc;
                    }, {} as Record<string, TemplateWithSubtasks[]>)
                  ).map(([category, categoryTemplates]) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold mb-3 text-gray-800">
                        {category}
                      </h3>
                      
                      <div className="space-y-3">
                        {categoryTemplates.map(template => (
                          <div
                            key={template.id}
                            className="border rounded-lg p-4 hover:bg-gray-50"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <h4 className="font-bold text-lg mb-1">
                                  {template.name}
                                </h4>
                                
                                {template.description && (
                                  <p className="text-sm text-gray-600 mb-2">
                                    {template.description}
                                  </p>
                                )}
                                
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {/* Priority badge */}
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(template.priority)}`}>
                                    🎯 {template.priority.toUpperCase()}
                                  </span>
                                  
                                  {/* Recurrence badge */}
                                  {template.recurrence_enabled === 1 && template.recurrence_pattern && (
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300">
                                      🔄 {template.recurrence_pattern}
                                    </span>
                                  )}
                                  
                                  {/* Reminder badge */}
                                  {template.reminder_minutes && (
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300">
                                      🔔 {getReminderAbbreviation(template.reminder_minutes as ReminderMinutes)}
                                    </span>
                                  )}
                                  
                                  {/* Subtasks badge */}
                                  {template.subtasks.length > 0 && (
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300">
                                      📝 {template.subtasks.length} subtasks
                                    </span>
                                  )}
                                  
                                  {/* Due offset badge */}
                                  {template.due_offset_days && (
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-300">
                                      📅 {template.due_offset_days}d offset
                                    </span>
                                  )}
                                </div>
                                
                                <p className="text-xs text-gray-500">
                                  Title: "{template.title_template}"
                                </p>
                              </div>
                              
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => {
                                    handleUseTemplate(template.id);
                                    setShowTemplateManager(false);
                                  }}
                                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                  Use
                                </button>
                                <button
                                  onClick={() => handleEditTemplate(template)}
                                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTemplate(template.id)}
                                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <button
                onClick={() => setShowTemplateManager(false)}
                className="mt-6 w-full px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Edit Template Modal */}
        {showEditTemplateModal && editingTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4">Edit Template</h2>
              
              <form onSubmit={handleUpdateTemplate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={editTemplateName}
                    onChange={(e) => setEditTemplateName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editTemplateDescription}
                    onChange={(e) => setEditTemplateDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    maxLength={500}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={editTemplateCategory}
                    onChange={(e) => setEditTemplateCategory(e.target.value)}
                    list="edit-category-suggestions"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    maxLength={50}
                  />
                  <datalist id="edit-category-suggestions">
                    {SUGGESTED_CATEGORIES.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                <p className="text-xs text-gray-500">
                  Note: You can only edit name, description, and category. Template settings (priority, recurrence, etc.) cannot be changed.
                </p>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditTemplateModal(false);
                      setEditingTemplate(null);
                    }}
                    className="flex-1 px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300"
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
