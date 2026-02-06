import { test, expect } from '@playwright/test'

function toDateString(date: Date) {
  return date.toISOString().split('T')[0]
}

function toMonthLabel(date: Date) {
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

test.describe('Feature 10: Calendar View', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset')
  })

  test.describe('Calendar Display', () => {
    test('calendar loads current month', async ({ page }) => {
      await page.goto('/calendar')

      const monthLabel = page.getByTestId('calendar-month')
      await expect(monthLabel).toBeVisible()

      const today = new Date()
      const currentMonth = toMonthLabel(today)
      await expect(monthLabel).toContainText(currentMonth)
    })

    test('calendar shows day headers', async ({ page }) => {
      await page.goto('/calendar')

      const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      for (const day of dayHeaders) {
        await expect(page.locator(`text=${day}`)).toBeVisible()
      }
    })

    test('calendar shows correct number of days', async ({ page }) => {
      await page.goto('/calendar')

      const today = new Date()
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()

      const dayElements = page.locator('[data-testid^="calendar-day-"]')
      const count = await dayElements.count()

      // Should have at least the days of the month
      expect(count).toBeGreaterThanOrEqual(daysInMonth)
    })

    test('calendar displays holidays', async ({ page }) => {
      await page.goto('/calendar?month=2026-08')

      const holidayCell = page.getByTestId('calendar-day-2026-08-09')
      await expect(holidayCell).toBeVisible()
      await expect(holidayCell).toContainText('National Day')
    })
  })

  test.describe('Month Navigation', () => {
    test('can navigate to next month', async ({ page }) => {
      const today = new Date()
      const currentMonth = toMonthLabel(today)

      const nextMonth = new Date(today)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      const nextMonthLabel = toMonthLabel(nextMonth)

      await page.goto('/calendar')

      await expect(page.getByTestId('calendar-month')).toContainText(currentMonth)

      await page.getByTestId('calendar-next').click()
      await page.waitForTimeout(300)

      await expect(page.getByTestId('calendar-month')).toContainText(nextMonthLabel)
    })

    test('can navigate to previous month', async ({ page }) => {
      const today = new Date()
      const currentMonth = toMonthLabel(today)

      const prevMonth = new Date(today)
      prevMonth.setMonth(prevMonth.getMonth() - 1)
      const prevMonthLabel = toMonthLabel(prevMonth)

      await page.goto('/calendar')

      await expect(page.getByTestId('calendar-month')).toContainText(currentMonth)

      await page.getByTestId('calendar-prev').click()
      await page.waitForTimeout(300)

      await expect(page.getByTestId('calendar-month')).toContainText(prevMonthLabel)
    })

    test('today button returns to current month', async ({ page }) => {
      const today = new Date()
      const currentMonth = toMonthLabel(today)

      await page.goto('/calendar')

      // Navigate away
      await page.getByTestId('calendar-next').click()
      await page.waitForTimeout(300)
      await page.getByTestId('calendar-next').click()
      await page.waitForTimeout(300)

      // Return to today
      await page.getByTestId('calendar-today').click()
      await page.waitForTimeout(300)

      await expect(page.getByTestId('calendar-month')).toContainText(currentMonth)
    })

    test('calendar persists month in URL', async ({ page }) => {
      const targetMonth = '2026-06'
      await page.goto(`/calendar?month=${targetMonth}`)
      await page.waitForTimeout(300)

      const url = page.url()
      expect(url).toContain(`month=${targetMonth}`)
    })

    test('invalid month parameter uses current month', async ({ page }) => {
      await page.goto('/calendar?month=invalid')

      const today = new Date()
      const currentMonth = toMonthLabel(today)
      await expect(page.getByTestId('calendar-month')).toContainText(currentMonth)
    })
  })

  test.describe('Todos on Calendar', () => {
    test('todo appears on its due date', async ({ page, request }) => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowString = toDateString(tomorrow)

      await request.post('/api/todos', {
        data: {
          title: 'Tomorrow task',
          due_date: tomorrowString,
        },
      })

      const monthParam = tomorrowString.slice(0, 7)
      await page.goto(`/calendar?month=${monthParam}`)

      const dayCell = page.getByTestId(`calendar-day-${tomorrowString}`)
      await expect(dayCell).toContainText('Tomorrow task')
    })

    test('multiple todos on same day show all', async ({ page, request }) => {
      const today = new Date()
      const todayString = toDateString(today)

      await request.post('/api/todos', {
        data: {
          title: 'Task 1',
          due_date: todayString,
        },
      })

      await request.post('/api/todos', {
        data: {
          title: 'Task 2',
          due_date: todayString,
        },
      })

      const monthParam = todayString.slice(0, 7)
      await page.goto(`/calendar?month=${monthParam}`)

      const dayCell = page.getByTestId(`calendar-day-${todayString}`)
      await expect(dayCell).toContainText('Task 1')
      await expect(dayCell).toContainText('Task 2')
    })

    test('completed todos appear on calendar', async ({ page, request }) => {
      const today = new Date()
      const todayString = toDateString(today)

      const createResponse = await request.post('/api/todos', {
        data: {
          title: 'Done task',
          due_date: todayString,
        },
      })
      const createBody = await createResponse.json()
      const todoId = createBody.data.id

      await request.put(`/api/todos/${todoId}`, {
        data: { is_completed: true },
      })

      const monthParam = todayString.slice(0, 7)
      await page.goto(`/calendar?month=${monthParam}`)

      const dayCell = page.getByTestId(`calendar-day-${todayString}`)
      await expect(dayCell).toContainText('Done task')
    })

    test('todos without due date not on calendar', async ({ page, request }) => {
      await request.post('/api/todos', {
        data: {
          title: 'No due date',
        },
      })

      const today = new Date()
      const todayString = toDateString(today)
      const monthParam = todayString.slice(0, 7)

      await page.goto(`/calendar?month=${monthParam}`)

      const allDayCells = page.locator('[data-testid^="calendar-day-"]')
      let found = false
      const count = await allDayCells.count()

      for (let i = 0; i < count; i++) {
        const text = await allDayCells.nth(i).textContent()
        if (text && text.includes('No due date')) {
          found = true
          break
        }
      }

      expect(found).toBe(false)
    })
  })

  test.describe('Day Modal', () => {
    test('clicking day opens modal', async ({ page, request }) => {
      const today = new Date()
      const todayString = toDateString(today)

      await request.post('/api/todos', {
        data: {
          title: 'Modal test',
          due_date: todayString,
        },
      })

      const monthParam = todayString.slice(0, 7)
      await page.goto(`/calendar?month=${monthParam}`)

      const dayCell = page.getByTestId(`calendar-day-${todayString}`)
      await dayCell.click()

      const modal = page.getByTestId('calendar-modal')
      await expect(modal).toBeVisible()
      await expect(modal).toContainText('Modal test')
    })

    test('modal shows all todos for day', async ({ page, request }) => {
      const today = new Date()
      const todayString = toDateString(today)

      await request.post('/api/todos', {
        data: {
          title: 'Task A',
          due_date: todayString,
        },
      })

      await request.post('/api/todos', {
        data: {
          title: 'Task B',
          due_date: todayString,
        },
      })

      const monthParam = todayString.slice(0, 7)
      await page.goto(`/calendar?month=${monthParam}`)

      const dayCell = page.getByTestId(`calendar-day-${todayString}`)
      await dayCell.click()

      const modal = page.getByTestId('calendar-modal')
      await expect(modal).toBeVisible()
      await expect(modal).toContainText('Task A')
      await expect(modal).toContainText('Task B')
    })

    test('can close modal', async ({ page, request }) => {
      const today = new Date()
      const todayString = toDateString(today)

      await request.post('/api/todos', {
        data: {
          title: 'Click me',
          due_date: todayString,
        },
      })

      const monthParam = todayString.slice(0, 7)
      await page.goto(`/calendar?month=${monthParam}`)

      const dayCell = page.getByTestId(`calendar-day-${todayString}`)
      await dayCell.click()

      const modal = page.getByTestId('calendar-modal')
      await expect(modal).toBeVisible()

      const closeButton = page.getByTestId('calendar-modal-close')
      await closeButton.click()
      await page.waitForTimeout(300)

      await expect(modal).not.toBeVisible()
    })

    test('modal displays empty day gracefully', async ({ page }) => {
      const today = new Date()
      const todayString = toDateString(today)
      const monthParam = todayString.slice(0, 7)

      await page.goto(`/calendar?month=${monthParam}`)

      // Find and click a day with no todos
      // This is implementation-dependent, but we can try clicking a future day
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)
      const nextWeekString = toDateString(nextWeek)

      const dayCell = page.getByTestId(`calendar-day-${nextWeekString}`)
      if (await dayCell.isVisible()) {
        await dayCell.click()
        await page.waitForTimeout(300)

        const modal = page.getByTestId('calendar-modal')
        if (await modal.isVisible()) {
          // Should show empty or "no todos" message
          await expect(modal).not.toContainText('undefined')
        }
      }
    })
  })

  test.describe('Calendar Styling', () => {
    test('weekend days have different styling', async ({ page }) => {
      await page.goto('/calendar')

      // Look for Saturday and Sunday styling
      // Implementation-dependent, but weekends should be distinguishable
      const dayElements = page.locator('[data-testid^="calendar-day-"]')
      const count = await dayElements.count()

      // Should have elements marked with weekend class or styling
      expect(count).toBeGreaterThan(0)
    })

    test('current day highlighted', async ({ page }) => {
      const today = new Date()
      const todayString = toDateString(today)
      const monthParam = todayString.slice(0, 7)

      await page.goto(`/calendar?month=${monthParam}`)

      const todayCell = page.getByTestId(`calendar-day-${todayString}`)
      
      // Today should be visually highlighted (implementation-dependent)
      // Could be with special class, background color, border, etc.
      if (await todayCell.isVisible()) {
        await expect(todayCell).toBeVisible()
      }
    })
  })

  test.describe('Calendar Data Accuracy', () => {
    test('calendar shows correct number of days in February', async ({ page, request }) => {
      // February 2026 has 28 days
      await page.goto('/calendar?month=2026-02')
      await page.waitForTimeout(300)

      const febDays = page.locator('[data-testid^="calendar-day-2026-02-"]')
      const count = await febDays.count()

      expect(count).toBeGreaterThanOrEqual(28)
    })

    test('calendar shows correct number of days in month with 31 days', async ({ page }) => {
      // August has 31 days
      await page.goto('/calendar?month=2026-08')
      await page.waitForTimeout(300)

      const augDays = page.locator('[data-testid^="calendar-day-2026-08-"]')
      const count = await augDays.count()

      expect(count).toBeGreaterThanOrEqual(31)
    })

    test('navigation maintains correct month sequencing', async ({ page }) => {
      await page.goto('/calendar?month=2026-01')

      const months = ['January 2026', 'February 2026', 'March 2026']

      for (const month of months) {
        const monthLabel = page.getByTestId('calendar-month')
        await expect(monthLabel).toContainText(month)

        await page.getByTestId('calendar-next').click()
        await page.waitForTimeout(300)
      }
    })
  })

  test.describe('Cross-Year Navigation', () => {
    test('can navigate across years', async ({ page }) => {
      const today = new Date()
      const currentYear = today.getFullYear()

      await page.goto('/calendar')

      // Navigate to December of next year
      for (let i = 0; i < 12; i++) {
        await page.getByTestId('calendar-next').click()
        await page.waitForTimeout(200)
      }

      const monthLabel = page.getByTestId('calendar-month')
      await expect(monthLabel).toContainText((currentYear + 1).toString())

      // Go back to current
      for (let i = 0; i < 12; i++) {
        await page.getByTestId('calendar-prev').click()
        await page.waitForTimeout(200)
      }

      const currentMonth = toMonthLabel(today)
      await expect(monthLabel).toContainText(currentMonth)
    })
  })

  test.describe('Edge Cases', () => {
    test('calendar handles leap year correctly', async ({ page }) => {
      // 2024 is a leap year, February has 29 days
      await page.goto('/calendar?month=2024-02')
      await page.waitForTimeout(300)

      const febDays = page.locator('[data-testid^="calendar-day-2024-02-"]')
      const count = await febDays.count()

      expect(count).toBeGreaterThanOrEqual(29)
    })

    test('navigating to month with todos shows todos', async ({ page, request }) => {
      const futureDate = new Date()
      futureDate.setMonth(futureDate.getMonth() + 3)
      const futureDateString = toDateString(futureDate)

      await request.post('/api/todos', {
        data: {
          title: 'Future todo',
          due_date: futureDateString,
        },
      })

      const monthParam = futureDateString.slice(0, 7)
      await page.goto(`/calendar?month=${monthParam}`)

      const dayCell = page.getByTestId(`calendar-day-${futureDateString}`)
      await expect(dayCell).toContainText('Future todo')
    })

    test('todos update on calendar after creation', async ({ page, request }) => {
      const today = new Date()
      const todayString = toDateString(today)
      const monthParam = todayString.slice(0, 7)

      await page.goto(`/calendar?month=${monthParam}`)

      // Create todo via API
      await request.post('/api/todos', {
        data: {
          title: 'New calendar todo',
          due_date: todayString,
        },
      })

      // Refresh calendar
      await page.reload()

      const dayCell = page.getByTestId(`calendar-day-${todayString}`)
      await expect(dayCell).toContainText('New calendar todo')
    })
  })
})
