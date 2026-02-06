'use client'

interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

export default function SearchBar({ searchQuery, onSearchChange }: SearchBarProps) {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search todos and subtasks..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        data-testid="todo-search"
        className="input w-full pl-10"
      />
      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path d="M12.9 14.32a7 7 0 1 1 1.41-1.41l3.69 3.68-1.41 1.42-3.69-3.69zM8 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
        </svg>
      </span>
    </div>
  )
}
