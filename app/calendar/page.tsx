'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSingaporeNow, formatSingaporeDate } from '@/lib/timezone';
import { Todo, Holiday, Priority } from '@/lib/db';

interface CalendarDay {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  todos: Todo[];
  holiday: Holiday | null;
}

export default function CalendarPage() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = getSingaporeNow();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [todos, setTodos] = useState<Todo[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalendarData(currentMonth);
  }, [currentMonth]);

  const fetchCalendarData = async (month: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/calendar?month=${month}`);
      if (response.ok) {
        const data = await response.json();
        setTodos(data.todos);
        setHolidays(data.holidays);
      }
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarDays = (): CalendarDay[] => {
    const [year, monthNum] = currentMonth.split('-').map(Number);
    const firstDay = new Date(year, monthNum - 1, 1);
    const lastDay = new Date(year, monthNum, 0);
    const startDayOfWeek = firstDay.getDay();

    const days: CalendarDay[] = [];
    const todayStr = formatSingaporeDate(getSingaporeNow());

    // Previous month days
    for (let i = 0; i < startDayOfWeek; i++) {
      const date = new Date(year, monthNum - 1, -startDayOfWeek + i + 1);
      const dateStr = formatSingaporeDate(date);
      days.push({
        date: dateStr,
        dayNumber: date.getDate(),
        isCurrentMonth: false,
        isToday: false,
        todos: [],
        holiday: null,
      });
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date: dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        todos: todos.filter((t) => t.due_date?.startsWith(dateStr)),
        holiday: holidays.find((h) => h.date === dateStr) || null,
      });
    }

    // Next month days to fill grid (6 rows × 7 days = 42 cells)
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(year, monthNum, i);
      const dateStr = formatSingaporeDate(date);
      days.push({
        date: dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: false,
        todos: [],
        holiday: null,
      });
    }

    return days;
  };

  const previousMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1); // month - 2 because JS months are 0-indexed
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const nextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month, 1); // month is next month
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const goToToday = () => {
    const now = getSingaporeNow();
    setCurrentMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  };

  const getMonthYearDisplay = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
      case 'low':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
    }
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              ← Back to List
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendar View</h1>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="mb-6 flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <button
            onClick={previousMonth}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            ◀
          </button>
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{getMonthYearDisplay()}</h2>
            <button
              onClick={goToToday}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
            >
              Today
            </button>
          </div>
          <button
            onClick={nextMonth}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            ▶
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-gray-100 dark:bg-gray-700">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="py-3 text-center font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`min-h-[120px] border-r border-b border-gray-200 dark:border-gray-600 p-2 ${
                  !day.isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900' : ''
                } ${day.isToday ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500' : ''} ${
                  day.holiday ? 'bg-green-50 dark:bg-green-900/20' : ''
                }`}
              >
                <div
                  className={`text-sm font-semibold mb-1 ${
                    !day.isCurrentMonth
                      ? 'text-gray-400 dark:text-gray-600'
                      : 'text-gray-900 dark:text-white'
                  } ${day.isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}
                >
                  {day.dayNumber}
                </div>

                {/* Holiday */}
                {day.holiday && (
                  <div className="text-xs text-green-700 dark:text-green-300 font-medium mb-1 truncate">
                    🎉 {day.holiday.name}
                  </div>
                )}

                {/* Todos */}
                <div className="space-y-1">
                  {day.todos.slice(0, 3).map((todo) => (
                    <div
                      key={todo.id}
                      className={`text-xs px-2 py-1 rounded truncate ${getPriorityColor(todo.priority)}`}
                      title={todo.title}
                    >
                      {todo.completed ? '✓ ' : ''}
                      {todo.title}
                    </div>
                  ))}
                  {day.todos.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                      +{day.todos.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
              Loading calendar...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
