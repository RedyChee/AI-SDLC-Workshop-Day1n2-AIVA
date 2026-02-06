'use client'

import { useState } from 'react'
import { Tag, Template } from '@/lib/types'

interface TodoFormProps {
  onTodoAdded: () => void
  tags: Tag[]
  templates: Template[]
  onUseTemplate: (templateId: string) => void
}

const REMINDER_OPTIONS = [
  { label: 'None', value: '' },
  { label: '15 min before', value: '15' },
  { label: '30 min before', value: '30' },
  { label: '1 hour before', value: '60' },
  { label: '2 hours before', value: '120' },
  { label: '1 day before', value: '1440' },
  { label: '2 days before', value: '2880' },
  { label: '1 week before', value: '10080' },
]

export default function TodoForm({ onTodoAdded, tags, templates, onUseTemplate }: TodoFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [dueDate, setDueDate] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrencePattern, setRecurrencePattern] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly')
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')
  const [reminderMinutes, setReminderMinutes] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (isRecurring && !dueDate) {
      setError('Due date is required for recurring todos')
      return
    }

    if (reminderMinutes && !dueDate) {
      setError('Due date is required for reminders')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          due_date: dueDate || undefined,
          is_recurring: isRecurring,
          recurrence_pattern: isRecurring ? recurrencePattern : undefined,
          recurrence_end_date: isRecurring && recurrenceEndDate ? recurrenceEndDate : undefined,
          reminder_minutes: reminderMinutes ? Number(reminderMinutes) : undefined,
          tag_ids: selectedTagIds,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create todo')
      }

      setTitle('')
      setDescription('')
      setDueDate('')
      setRecurrenceEndDate('')
      setPriority('medium')
      setIsRecurring(false)
      setRecurrencePattern('weekly')
      setReminderMinutes('')
      setSelectedTagIds([])
      setShowAdvanced(false)
      onTodoAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Add a new todo..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          data-testid="todo-title"
          className="input flex-1"
          disabled={isLoading}
        />

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
          data-testid="todo-priority"
          className="input w-32"
          disabled={isLoading}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          data-testid="todo-due-date"
          className="input w-40"
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={isLoading}
          data-testid="todo-add"
          className="btn btn-primary px-6"
        >
          {isLoading ? 'Adding...' : 'Add'}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-blue-600 text-sm hover:underline inline-flex items-center gap-2"
      >
        <span
          className={`inline-flex transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
            <path d="M7 5l6 5-6 5V5z" />
          </svg>
        </span>
        {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
      </button>

      {showAdvanced && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-[84px]"
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col lg:flex-row gap-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                id="recurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4"
                disabled={isLoading}
                data-testid="todo-recurring"
              />
              Repeat
            </label>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Reminder</label>
              <select
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(e.target.value)}
                className="input"
                disabled={isLoading || !dueDate}
              >
                {REMINDER_OPTIONS.map(option => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {!dueDate && (
                <p className="text-xs text-gray-500 mt-1">Set a due date to enable reminders.</p>
              )}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-3 items-center">
            <label className="text-sm font-medium">Use Template:</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => {
                const value = e.target.value
                setSelectedTemplateId(value)
                if (value) {
                  onUseTemplate(value)
                  setSelectedTemplateId('')
                }
              }}
              className="input"
            >
              <option value="">Select a template...</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 && (
                <span className="text-sm text-gray-500">Create tags to attach them.</span>
              )}
              {tags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-2 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedTagIds.includes(tag.id)
                      ? 'border-transparent text-white'
                      : 'border-gray-300 text-gray-700'
                  }`}
                  style={{ backgroundColor: selectedTagIds.includes(tag.id) ? tag.color : undefined }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {isRecurring && (
            <div className="space-y-3 pl-7 border-l-2 border-gray-300">
              <div>
                <label className="block text-sm font-medium mb-1">Repeat Pattern</label>
                <select
                  value={recurrencePattern}
                  onChange={(e) => setRecurrencePattern(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
                  className="input w-full"
                  disabled={isLoading}
                  data-testid="todo-recurrence-pattern"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium mb-1">
                  End Date (optional)
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={recurrenceEndDate}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                  className="input w-full"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for no end date
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  )
}
