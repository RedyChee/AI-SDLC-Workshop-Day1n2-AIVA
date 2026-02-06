'use client'

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import CalendarView from '../components/CalendarView'
import { TodoWithDetails } from '@/lib/types'
import { getSingaporeNow } from '@/lib/timezone'

function parseMonthParam(monthParam: string | null): Date {
  if (!monthParam) return getSingaporeNow()
  const parsed = new Date(`${monthParam}-01T00:00:00+08:00`)
  return Number.isNaN(parsed.getTime()) ? getSingaporeNow() : parsed
}

function CalendarPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const monthParam = searchParams.get('month')

  const [todos, setTodos] = useState<TodoWithDetails[]>([])
  const [holidays, setHolidays] = useState<{ date: string; name: string }[]>([])
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => parseMonthParam(monthParam))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const selectedTodos = useMemo(
    () => (selectedDate ? todos.filter(todo => todo.due_date === selectedDate) : []),
    [selectedDate, todos]
  )
  const selectedHoliday = useMemo(
    () => (selectedDate ? holidays.find(holiday => holiday.date === selectedDate) : null),
    [selectedDate, holidays]
  )

  useEffect(() => {
    setCalendarMonth(parseMonthParam(monthParam))
  }, [monthParam])

  const fetchTodos = useCallback(async () => {
    const response = await fetch('/api/todos')
    if (!response.ok) return
    const data = await response.json()
    setTodos(data.data || [])
  }, [])

  const fetchHolidays = useCallback(async () => {
    const response = await fetch('/api/holidays')
    if (!response.ok) return
    const data = await response.json()
    setHolidays(data.data || [])
  }, [])

  useEffect(() => {
    fetchTodos()
    fetchHolidays()
  }, [fetchTodos, fetchHolidays])

  const handleMonthChange = (next: Date) => {
    setCalendarMonth(next)
    const nextParam = format(next, 'yyyy-MM')
    router.replace(`/calendar?month=${nextParam}`)
  }

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Holiday Calendar</h1>
            <p className="text-sm text-gray-600">Monthly view of your todos.</p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => router.push('/')}
          >
            ← Back to Todos
          </button>
        </div>

        <CalendarView
          todos={todos}
          holidays={holidays}
          currentMonth={calendarMonth}
          onMonthChange={handleMonthChange}
          onDayClick={setSelectedDate}
          selectedDateKey={selectedDate}
        />

        {selectedDate && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            data-testid="calendar-modal"
          >
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">{selectedDate}</div>
                <button
                  className="text-sm text-gray-500 hover:text-gray-800"
                  onClick={() => setSelectedDate(null)}
                  data-testid="calendar-modal-close"
                >
                  Close
                </button>
              </div>
              {selectedHoliday && (
                <div className="text-sm text-red-600 mb-2">
                  {selectedHoliday.name}
                </div>
              )}
              {selectedTodos.length === 0 ? (
                <div className="text-sm text-gray-600">No todos for this day.</div>
              ) : (
                <ul className="space-y-2 text-sm">
                  {selectedTodos.map(todo => (
                    <li key={todo.id} className="bg-blue-50 text-blue-700 px-3 py-2 rounded">
                      {todo.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="text-center py-10">Loading calendar...</div>}>
      <CalendarPageContent />
    </Suspense>
  )
}
