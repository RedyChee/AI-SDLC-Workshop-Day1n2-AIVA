'use client'

import { TodoWithDetails, Tag } from '@/lib/types'
import { useState } from 'react'
import { formatSingaporeDate } from '@/lib/timezone'
import SubtaskManager from './SubtaskManager'
import ProgressBar from './ProgressBar'

interface TodoItemProps {
  todo: TodoWithDetails
  availableTags: Tag[]
  onDeleted: () => void
  onToggled: () => void
  onUpdated: () => void
}

export default function TodoItem({ todo, availableTags, onDeleted, onToggled, onUpdated }: TodoItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(todo.title)
  const [editPriority, setEditPriority] = useState(todo.priority)
  const [editDueDate, setEditDueDate] = useState(todo.due_date || '')

  const handleToggle = async () => {
    try {
      setIsUpdating(true)
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: !todo.is_completed }),
      })
      if (response.ok) {
        onToggled()
      }
    } catch (err) {
      console.error('Failed to toggle todo:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure?')) return
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        onDeleted()
      }
    } catch (err) {
      console.error('Failed to delete todo:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const priorityColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-amber-100 text-amber-800',
    low: 'bg-blue-100 text-blue-800',
  }
  const priorityLabel = todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const isOverdue = todo.due_date && todo.due_date < today && !todo.is_completed

  const availableToAdd = availableTags.filter(tag => !todo.tags.some((t: any) => t.id === tag.id))

  const handleAddTag = async (tagId: string) => {
    if (!tagId) return
    try {
      setIsUpdating(true)
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag_ids: [...todo.tags.map((t: any) => t.id), tagId] }),
      })
      if (response.ok) {
        onUpdated()
      }
    } catch (err) {
      console.error('Failed to add tag:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSaveEdit = async () => {
    try {
      setIsUpdating(true)
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          priority: editPriority,
          due_date: editDueDate || null,
        }),
      })
      if (response.ok) {
        setIsEditing(false)
        onUpdated()
      }
    } catch (err) {
      console.error('Failed to update todo:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div
      className={`card p-4 space-y-3 ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}
      data-testid="todo-item"
    >
      <div className="flex items-start gap-4">
        <input
          type="checkbox"
          checked={todo.is_completed}
          onChange={handleToggle}
          disabled={isUpdating}
          data-testid="todo-toggle"
          className="w-5 h-5 cursor-pointer mt-1"
        />
        
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="input"
                data-testid="todo-edit-title"
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as 'low' | 'medium' | 'high')}
                  className="input sm:w-40"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="input sm:w-48"
                />
              </div>
            </div>
          ) : (
            <>
              <h3 className={`font-medium ${todo.is_completed ? 'line-through text-gray-400' : ''}`}>
                {todo.title}
              </h3>
              {todo.description && (
                <p className="text-sm text-gray-600 mt-1">{todo.description}</p>
              )}
            </>
          )}
          
          <div className="flex flex-wrap gap-2 mt-2">
            {!isEditing && (
              <div className="flex items-center gap-1">
                <select
                  value={todo.priority}
                  onChange={async (e) => {
                    const newPriority = e.target.value as 'low' | 'medium' | 'high'
                    try {
                      setIsUpdating(true)
                      const response = await fetch(`/api/todos/${todo.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ priority: newPriority }),
                      })
                      if (response.ok) {
                        onUpdated()
                      }
                    } catch (err) {
                      console.error('Failed to update priority:', err)
                    } finally {
                      setIsUpdating(false)
                    }
                  }}
                  className="text-xs px-1 py-1 rounded border border-gray-300 cursor-pointer"
                  data-testid="todo-priority-select"
                  disabled={isUpdating}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <span className={`badge ${priorityColors[todo.priority as keyof typeof priorityColors]}`}>
                  {priorityLabel}
                </span>
              </div>
            )}
            {isEditing && (
              <span className={`badge ${priorityColors[todo.priority as keyof typeof priorityColors]}`}>
                {priorityLabel}
              </span>
            )}
            {todo.due_date && (
              <span className={`text-xs px-2 py-1 rounded ${isOverdue ? 'bg-red-200 text-red-800' : 'bg-gray-100 text-gray-700'}`}>
                {isOverdue ? 'Overdue' : 'Due'} {formatSingaporeDate(new Date(`${todo.due_date}T00:00:00+08:00`))}
              </span>
            )}
            {todo.is_recurring && (
              <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                Repeats {todo.recurrence_pattern}
              </span>
            )}
            {todo.reminders[0] && (
              <span className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-800">
                Remind {todo.reminders[0].reminder_minutes}m
              </span>
            )}
            {todo.subtasks.length > 0 && (
              <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800">
                {todo.subtasks.filter((s: any) => s.is_completed).length}/{todo.subtasks.length} subtasks
              </span>
            )}
            {todo.tags.map((tag: any) => (
              <span
                key={tag.id}
                className="text-xs px-2 py-1 rounded text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>

          {todo.subtasks.length > 0 && (
            <div className="mt-2">
              <ProgressBar
                completed={todo.subtasks.filter((s: any) => s.is_completed).length}
                total={todo.subtasks.length}
              />
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              className="input max-w-[220px]"
              onChange={(e) => handleAddTag(e.target.value)}
              value=""
              data-testid="todo-tag-picker"
            >
              <option value="">+ Add tag</option>
              {availableToAdd.map(tag => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>

          <SubtaskManager
            todoId={todo.id}
            subtasks={todo.subtasks}
            onSubtaskAdded={onToggled}
            onSubtaskDeleted={onToggled}
            onSubtaskToggled={onToggled}
          />
        </div>

        <div className="flex flex-col gap-1">
          <button
            onClick={() => {
              if (isEditing) {
                handleSaveEdit()
              } else {
                setIsEditing(true)
              }
            }}
            className="text-sm px-2 py-1 text-blue-600 hover:bg-blue-100 rounded"
          >
            {isEditing ? 'Save' : 'Edit'}
          </button>
          {isEditing && (
            <button
              onClick={() => {
                setIsEditing(false)
                setEditTitle(todo.title)
                setEditPriority(todo.priority)
                setEditDueDate(todo.due_date || '')
              }}
              className="text-sm px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-sm px-2 py-1 text-red-600 hover:bg-red-100 rounded"
          >
            Del
          </button>
        </div>
      </div>
    </div>
  )
}
