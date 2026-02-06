'use client'

import { TodoWithDetails, Tag } from '@/lib/types'
import TodoItem from './TodoItem'

interface TodoListProps {
  todos: TodoWithDetails[]
  availableTags: Tag[]
  onTodoDeleted: () => void
  onTodoToggled: () => void
  onTodoUpdated: () => void
}

export default function TodoList({
  todos,
  availableTags,
  onTodoDeleted,
  onTodoToggled,
  onTodoUpdated,
}: TodoListProps) {
  if (todos.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <p className="text-gray-600">No todos yet. Add one above!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          availableTags={availableTags}
          onDeleted={onTodoDeleted}
          onToggled={onTodoToggled}
          onUpdated={onTodoUpdated}
        />
      ))}
    </div>
  )
}
