'use client'

import { TodoWithDetails } from '@/lib/types'
import { format } from 'date-fns'
import { addDays, addMonths, endOfMonth, startOfMonth, startOfWeek, subMonths } from 'date-fns'
import { formatSingaporeDate, getSingaporeNow } from '@/lib/timezone'

interface CalendarViewProps {
  todos: TodoWithDetails[]
  holidays: { date: string; name: string }[]
  currentMonth: Date
  onMonthChange: (next: Date) => void
  onDayClick?: (dateKey: string) => void
  selectedDateKey?: string | null
}

export default function CalendarView({
  todos,
  holidays,
  currentMonth,
  onMonthChange,
  onDayClick,
  selectedDateKey,
}: CalendarViewProps) {
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })

  const days: Date[] = []
  let day = startDate

  while (day <= monthEnd || days.length % 7 !== 0) {
    days.push(day)
    day = addDays(day, 1)
  }

  const holidaysByDate = new Map(holidays.map(h => [h.date, h.name]))
  const todayKey = formatSingaporeDate(getSingaporeNow())

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <button
          className="btn btn-secondary"
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          data-testid="calendar-prev"
        >
          Prev
        </button>
        <div className="text-lg font-semibold" data-testid="calendar-month">
          {format(currentMonth, 'MMMM yyyy')}
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => onMonthChange(getSingaporeNow())}
          data-testid="calendar-today"
        >
          Today
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          data-testid="calendar-next"
        >
          Next
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-xs text-gray-500 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(label => (
          <div key={label} className="text-center">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((date) => {
          const dateKey = formatSingaporeDate(date)
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
          const dayTodos = todos.filter(todo => todo.due_date === dateKey)
          const holiday = holidaysByDate.get(dateKey)
          const isWeekend = date.getDay() === 0 || date.getDay() === 6
          const isToday = dateKey === todayKey
          const isSelected = selectedDateKey === dateKey

          return (
            <div
              key={dateKey}
              data-testid={`calendar-day-${dateKey}`}
              role={onDayClick ? 'button' : undefined}
              tabIndex={onDayClick ? 0 : undefined}
              onClick={onDayClick ? () => onDayClick(dateKey) : undefined}
              onKeyDown={
                onDayClick
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onDayClick(dateKey)
                      }
                    }
                  : undefined
              }
              className={`min-h-[110px] rounded border p-2 transition-colors ${
                isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
              } ${
                isWeekend && isCurrentMonth ? 'bg-amber-50' : ''
              } ${
                isToday ? 'border-blue-400 ring-1 ring-blue-200' : ''
              } ${
                isSelected ? 'border-indigo-400 ring-1 ring-indigo-200' : ''
              } ${
                onDayClick ? 'cursor-pointer hover:border-blue-300' : ''
              }`}
            >
              <div className="text-xs font-semibold">{date.getDate()}</div>
              {holiday && (
                <div className="text-[10px] text-red-600 font-medium truncate" title={holiday}>
                  {holiday}
                </div>
              )}
              {dayTodos.length > 0 && (
                <div className="mt-1">
                  <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 text-[10px] px-2 py-[2px]">
                    {dayTodos.length}
                  </span>
                </div>
              )}
              <div className="mt-1 space-y-1">
                {dayTodos.map(todo => (
                  <div key={todo.id} className="text-[11px] bg-blue-50 text-blue-700 px-2 py-1 rounded">
                    {todo.title}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
