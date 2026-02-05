'use client'

interface PriorityFilterProps {
  onFilterChange: (priority: 'all' | 'high' | 'medium' | 'low') => void
  currentFilter: 'all' | 'high' | 'medium' | 'low'
}

export default function PriorityFilter({ onFilterChange, currentFilter }: PriorityFilterProps) {
  return (
    <select
      value={currentFilter}
      onChange={(e) => onFilterChange(e.target.value as any)}
      data-testid="priority-filter"
      className="input"
    >
      <option value="all">All Priorities</option>
      <option value="high">High</option>
      <option value="medium">Medium</option>
      <option value="low">Low</option>
    </select>
  )
}
