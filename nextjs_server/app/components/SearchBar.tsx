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
      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">
        Search
      </span>
    </div>
  )
}
