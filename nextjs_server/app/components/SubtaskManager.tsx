'use client'

import { useState } from 'react'
import { Subtask } from '@/lib/types'

interface SubtaskManagerProps {
  todoId: string
  subtasks: Subtask[]
  onSubtaskAdded: () => void
  onSubtaskDeleted: () => void
  onSubtaskToggled: () => void
}

export default function SubtaskManager({
  todoId,
  subtasks,
  onSubtaskAdded,
  onSubtaskDeleted,
  onSubtaskToggled,
}: SubtaskManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newTitle.trim()) {
      setError('Subtask title is required')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/todos/${todoId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add subtask')
      }

      setNewTitle('')
      setShowAddForm(false)
      onSubtaskAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add subtask')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleSubtask = async (subtaskId: string, isCompleted: boolean) => {
    try {
      const response = await fetch(`/api/subtasks/${subtaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: !isCompleted }),
      })

      if (response.ok) {
        onSubtaskToggled()
      }
    } catch (err) {
      console.error('Failed to toggle subtask:', err)
    }
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!window.confirm('Delete this subtask?')) return

    try {
      const response = await fetch(`/api/subtasks/${subtaskId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onSubtaskDeleted()
      }
    } catch (err) {
      console.error('Failed to delete subtask:', err)
    }
  }

  return (
    <div className="mt-3 space-y-2">
      {subtasks.length > 0 && (
        <div className="space-y-1 ml-6 border-l-2 border-gray-200 pl-3">
          {subtasks.map(subtask => (
            <div
              key={subtask.id}
              className="group flex items-center gap-2 text-sm py-1"
            >
              <input
                type="checkbox"
                checked={subtask.is_completed}
                onChange={() => handleToggleSubtask(subtask.id, subtask.is_completed)}
                className="w-4 h-4 cursor-pointer"
                data-testid="subtask-toggle"
              />
              <span
                className={subtask.is_completed ? 'line-through text-gray-400' : 'text-gray-700'}
              >
                {subtask.title}
              </span>
              <button
                onClick={() => handleDeleteSubtask(subtask.id)}
                className="ml-auto text-red-600 hover:text-red-800 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                data-testid="subtask-delete"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {!showAddForm ? (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          data-testid="subtask-add-button"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium ml-6 flex items-center gap-1"
        >
          + Add subtask
        </button>
      ) : (
        <form onSubmit={handleAddSubtask} className="ml-6 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Subtask title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              data-testid="subtask-title-input"
              className="input flex-1 text-sm py-1"
              disabled={isLoading}
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading}
              data-testid="subtask-submit"
              className="btn btn-primary text-sm px-3 py-1"
            >
              {isLoading ? 'Adding...' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false)
                setNewTitle('')
                setError(null)
              }}
              className="btn text-sm px-3 py-1"
            >
              Cancel
            </button>
          </div>
          {error && <p className="text-red-600 text-xs">{error}</p>}
        </form>
      )}
    </div>
  )
}
