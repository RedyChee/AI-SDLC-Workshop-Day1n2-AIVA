'use client'

interface ProgressBarProps {
  completed: number
  total: number
  className?: string
}

export default function ProgressBar({ completed, total, className = '' }: ProgressBarProps) {
  if (total === 0) return null

  const percentage = Math.round((completed / total) * 100)
  const isComplete = percentage === 100

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isComplete ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${isComplete ? 'text-green-600' : 'text-gray-600'}`}>
        {completed}/{total} ({percentage}%)
      </span>
    </div>
  )
}
