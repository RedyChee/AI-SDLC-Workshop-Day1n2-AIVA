'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Priority, Todo, Holiday } from '@/lib/db-types';
import { getSingaporeNow, formatSingaporeDate } from '@/lib/timezone';

interface CalendarData {
  year: number;
  month: number;
  todos: Todo[];
  holidays: Holiday[];
}

const getPriorityColor = (priority: Priority): string => {
  switch (priority) {
    case 'high': return 'bg-red-500 text-white';
    case 'medium': return 'bg-yellow-500 text-white';
    case 'low': return 'bg-blue-500 text-white';
  }
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const router = useRouter();
  const now = getSingaporeNow();
  
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1); // 1-12
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCalendarData();
  }, [currentYear, currentMonth]);

  const fetchCalendarData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/calendar/month?year=${currentYear}&month=${currentMonth}`);
      if (!response.ok) {
        throw new Error('Failed to fetch calendar data');
      }
      const data = await response.json();
      setCalendarData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar');
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    const today = getSingaporeNow();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
  };

  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 (Sun) to 6 (Sat)

    const days: Array<{
      date: number;
      month: number;
      year: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isPast: boolean;
    }> = [];

    // Add days from previous month
    if (startingDayOfWeek > 0) {
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
      
      for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const date = daysInPrevMonth - i;
        days.push({
          date,
          month: prevMonth,
          year: prevYear,
          isCurrentMonth: false,
          isToday: false,
          isPast: true,
        });
      }
    }

    // Add days from current month
    const todayDate = getSingaporeNow();
    const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
    
    for (let date = 1; date <= daysInMonth; date++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const isPast = dateStr < todayStr;
      
      days.push({
        date,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true,
        isToday,
        isPast,
      });
    }

    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    
    for (let date = 1; date <= remainingDays; date++) {
      days.push({
        date,
        month: nextMonth,
        year: nextYear,
        isCurrentMonth: false,
        isToday: false,
        isPast: false,
      });
    }

    return days;
  };

  const getTodosForDate = (year: number, month: number, date: number): Todo[] => {
    if (!calendarData) return [];
    
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    
    return calendarData.todos.filter(todo => {
      if (!todo.due_date) return false;
      const todoDate = todo.due_date.split('T')[0]; // Get YYYY-MM-DD part
      return todoDate === dateStr;
    });
  };

  const getHolidaysForDate = (year: number, month: number, date: number): Holiday[] => {
    if (!calendarData) return [];
    
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    
    return calendarData.holidays.filter(holiday => holiday.date === dateStr);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-600">Loading calendar...</div>
          </div>
        </div>
      </div>
    );
  }

  const calendarDays = generateCalendarDays();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendar View</h1>
            <p className="text-gray-600 mt-1">Visualize your todos by date</p>
          </div>
          
          <div className="flex gap-3">
            {/* Back to List Button */}
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              ← Back to List
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Calendar Controls */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4 bg-white p-4 rounded-lg shadow-md">
          <button
            onClick={goToPreviousMonth}
            className="px-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            ◀ Prev
          </button>
          
          <h2 className="text-2xl font-bold text-gray-900">
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </h2>
          
          <div className="flex gap-3">
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-purple-100 text-purple-800 border border-purple-300 rounded-lg font-medium hover:bg-purple-200 transition-colors"
            >
              Today
            </button>
            
            <button
              onClick={goToNextMonth}
              className="px-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Next ▶
            </button>
          </div>
        </div>

        {/* Priority Legend */}
        <div className="mb-4 flex gap-4 flex-wrap justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-700">High Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-gray-700">Medium Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-gray-700">Low Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
            <span className="text-gray-700">Holiday</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-0 border-b border-gray-200">
            {DAY_NAMES.map(day => (
              <div
                key={day}
                className="p-3 text-center font-semibold text-gray-700 bg-gray-50 border-r border-gray-200 last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-0">
            {calendarDays.map((day, index) => {
              const todos = getTodosForDate(day.year, day.month, day.date);
              const holidays = getHolidaysForDate(day.year, day.month, day.date);
              
              return (
                <div
                  key={index}
                  className={`min-h-32 p-2 border-r border-b border-gray-200 ${
                    !day.isCurrentMonth ? 'bg-gray-50' : ''
                  } ${day.isToday ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset' : ''} ${
                    day.isPast && day.isCurrentMonth ? 'opacity-60' : ''
                  }`}
                >
                  {/* Date Number */}
                  <div className={`text-sm font-semibold mb-2 ${
                    !day.isCurrentMonth ? 'text-gray-400' : day.isToday ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    {day.date}
                    {day.isToday && <span className="ml-2 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">Today</span>}
                  </div>

                  {/* Holidays */}
                  {holidays.map(holiday => (
                    <div
                      key={holiday.id}
                      className="mb-1 px-2 py-1 bg-orange-100 border border-orange-300 rounded text-xs font-medium text-orange-800 truncate"
                      title={holiday.name}
                    >
                      🎉 {holiday.name}
                    </div>
                  ))}

                  {/* Todos */}
                  {todos.slice(0, 3).map(todo => (
                    <div
                      key={todo.id}
                      className={`mb-1 px-2 py-1 rounded text-xs font-medium truncate cursor-pointer hover:opacity-80 transition-opacity ${
                        getPriorityColor(todo.priority)
                      } ${todo.completed ? 'line-through opacity-60' : ''}`}
                      title={`${todo.title} ${todo.completed ? '(Completed)' : ''}`}
                      onClick={() => router.push('/')}
                    >
                      {todo.title}
                    </div>
                  ))}
                  
                  {/* Show "+X more" if there are more than 3 todos */}
                  {todos.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium px-2">
                      +{todos.length - 3} more
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {calendarData && calendarData.todos.length === 0 && calendarData.holidays.length === 0 && (
          <div className="mt-8 text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 text-lg">No todos or holidays scheduled this month</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Add Your First Todo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
