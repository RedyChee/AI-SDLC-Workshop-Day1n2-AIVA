import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { getSingaporeNow } from '@/lib/timezone';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get('year');
  const monthParam = searchParams.get('month'); // 1-12

  // Default to current month if not specified
  const now = getSingaporeNow();
  const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
  const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;

  // Validate inputs
  if (month < 1 || month > 12) {
    return NextResponse.json({ error: 'Invalid month' }, { status: 400 });
  }

  try {
    // Calculate month date range
    // Start: first day of month at 00:00:00
    // End: last day of month at 23:59:59
    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // Fetch todos with due dates in this month (or overlapping weeks)
    // Include a few days before/after to show todos from adjacent months that fall in week grid
    const gridStart = new Date(year, month - 1, 1);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay()); // Go back to Sunday
    const gridEnd = new Date(year, month, 0);
    gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay())); // Go forward to Saturday

    const gridStartStr = `${gridStart.getFullYear()}-${String(gridStart.getMonth() + 1).padStart(2, '0')}-${String(gridStart.getDate()).padStart(2, '0')}`;
    const gridEndStr = `${gridEnd.getFullYear()}-${String(gridEnd.getMonth() + 1).padStart(2, '0')}-${String(gridEnd.getDate()).padStart(2, '0')}`;

    // Fetch todos with due dates in the calendar grid range
    const stmt = db.prepare(`
      SELECT * FROM todos
      WHERE user_id = ?
        AND due_date IS NOT NULL
        AND DATE(due_date) >= ?
        AND DATE(due_date) <= ?
      ORDER BY due_date ASC, priority DESC
    `);
    const rows = stmt.all(session.userId, gridStartStr, gridEndStr) as Array<{
      id: number;
      title: string;
      completed: number;
      due_date: string | null;
      priority: string;
      recurrence_pattern: string | null;
      reminder_minutes: number | null;
    }>;
    const todos = rows.map(row => ({
      ...row,
      completed: Boolean(row.completed),
    }));

    // Fetch holidays for this month
    const holidayStmt = db.prepare(`
      SELECT * FROM holidays
      WHERE date >= ? AND date <= ?
      ORDER BY date ASC
    `);
    const holidays = holidayStmt.all(startOfMonth, endOfMonth) as Array<{
      id: number;
      date: string;
      name: string;
      type: string;
    }>;

    return NextResponse.json({
      year,
      month,
      todos,
      holidays,
      startDate: startOfMonth,
      endDate: endOfMonth,
    });
  } catch (error) {
    console.error('Calendar month fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    );
  }
}
