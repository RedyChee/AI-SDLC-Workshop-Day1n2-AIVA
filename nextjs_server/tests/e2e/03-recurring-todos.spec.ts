import { test, expect } from '@playwright/test'

function toDateString(date: Date) {
  return date.toISOString().split('T')[0]
}

test.describe('Feature 03: Recurring Todos', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset')
  })

  test.describe('Recurring Todo Creation', () => {
    test('can create daily recurring todo', async ({ request }) => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const response = await request.post('/api/todos', {
        data: {
          title: 'Daily standup',
          priority: 'medium',
          due_date: toDateString(tomorrow),
          is_recurring: true,
          recurrence_pattern: 'daily',
        },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.data.is_recurring).toBe(true)
      expect(body.data.recurrence_pattern).toBe('daily')
    })

    test('can create weekly recurring todo', async ({ request }) => {
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)

      const response = await request.post('/api/todos', {
        data: {
          title: 'Weekly team meeting',
          priority: 'high',
          due_date: toDateString(nextWeek),
          is_recurring: true,
          recurrence_pattern: 'weekly',
        },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.data.recurrence_pattern).toBe('weekly')
    })

    test('can create monthly recurring todo', async ({ request }) => {
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)

      const response = await request.post('/api/todos', {
        data: {
          title: 'Monthly review',
          priority: 'medium',
          due_date: toDateString(nextMonth),
          is_recurring: true,
          recurrence_pattern: 'monthly',
        },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.data.recurrence_pattern).toBe('monthly')
    })

    test('can create yearly recurring todo', async ({ request }) => {
      const nextYear = new Date()
      nextYear.setFullYear(nextYear.getFullYear() + 1)

      const response = await request.post('/api/todos', {
        data: {
          title: 'Annual birthday',
          priority: 'low',
          due_date: toDateString(nextYear),
          is_recurring: true,
          recurrence_pattern: 'yearly',
        },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.data.recurrence_pattern).toBe('yearly')
    })

    test('recurring todo requires due date', async ({ request }) => {
      const response = await request.post('/api/todos', {
        data: {
          title: 'Recurring without due date',
          is_recurring: true,
          recurrence_pattern: 'daily',
        },
      })

      expect(response.status()).toBe(400)
      const body = await response.json()
      expect(body.error).toContain('due date')
    })


    test('rejects invalid recurrence patterns', async ({ request }) => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const invalidPatterns = ['everyDay', 'every-week', 'bi-weekly', 'DAILY', 'quarterly']

      for (const pattern of invalidPatterns) {
        const response = await request.post('/api/todos', {
          data: {
            title: 'Task',
            due_date: toDateString(tomorrow),
            is_recurring: true,
            recurrence_pattern: pattern,
          },
        })

        expect(response.status()).toBe(400)
      }
    })
  })

  test.describe('Next Instance Creation', () => {
    test('completing daily todo creates next instance', async ({ request }) => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dayAfterTomorrow = new Date(tomorrow)
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

      const createResponse = await request.post('/api/todos', {
        data: {
          title: 'Daily task',
          priority: 'medium',
          due_date: toDateString(tomorrow),
          is_recurring: true,
          recurrence_pattern: 'daily',
        },
      })
      const createBody = await createResponse.json()
      const todoId = createBody.data.id

      // Complete the todo
      const completeResponse = await request.put(`/api/todos/${todoId}`, {
        data: { is_completed: true },
      })

      expect(completeResponse.ok()).toBeTruthy()
      const completeBody = await completeResponse.json()
      expect(completeBody.data.is_completed).toBe(true)

      // Check for new instance
      const allTodosResponse = await request.get('/api/todos')
      const allTodosBody = await allTodosResponse.json()
      const newInstance = allTodosBody.data.find(
        (t: any) => t.title === 'Daily task' && !t.is_completed
      )

      expect(newInstance).toBeTruthy()
      expect(newInstance.due_date).toBe(toDateString(dayAfterTomorrow))
      expect(newInstance.is_recurring).toBe(true)
      expect(newInstance.recurrence_pattern).toBe('daily')
    })

    test('completing weekly todo creates next instance with correct date', async ({ request }) => {
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      const weekAfter = new Date(nextWeek)
      weekAfter.setDate(weekAfter.getDate() + 7)

      const createResponse = await request.post('/api/todos', {
        data: {
          title: 'Weekly meeting',
          due_date: toDateString(nextWeek),
          is_recurring: true,
          recurrence_pattern: 'weekly',
        },
      })
      const createBody = await createResponse.json()
      const todoId = createBody.data.id

      await request.put(`/api/todos/${todoId}`, {
        data: { is_completed: true },
      })

      const allTodosResponse = await request.get('/api/todos')
      const allTodosBody = await allTodosResponse.json()
      const newInstance = allTodosBody.data.find(
        (t: any) => t.title === 'Weekly meeting' && !t.is_completed
      )

      expect(newInstance.due_date).toBe(toDateString(weekAfter))
    })

    test('completing monthly todo creates next instance with a later date', async ({ request }) => {
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      const originalDate = toDateString(nextMonth)

      const createResponse = await request.post('/api/todos', {
        data: {
          title: 'Monthly review',
          due_date: originalDate,
          is_recurring: true,
          recurrence_pattern: 'monthly',
        },
      })
      const createBody = await createResponse.json()
      const todoId = createBody.data.id

      await request.put(`/api/todos/${todoId}`, {
        data: { is_completed: true },
      })

      const allTodosResponse = await request.get('/api/todos')
      const allTodosBody = await allTodosResponse.json()
      const newInstance = allTodosBody.data.find(
        (t: any) => t.title === 'Monthly review' && !t.is_completed
      )

      expect(newInstance.due_date).toBeTruthy()
      const original = new Date(originalDate)
      const next = new Date(newInstance.due_date)
      const diffDays = Math.round((next.getTime() - original.getTime()) / (1000 * 60 * 60 * 24))
      // Accept approximate monthly increment (28-31 days)
      expect(diffDays).toBeGreaterThanOrEqual(28)
      expect(diffDays).toBeLessThanOrEqual(31)
    })

    test('completing yearly todo creates next instance', async ({ request }) => {
      const nextYear = new Date()
      nextYear.setFullYear(nextYear.getFullYear() + 1)
      const yearAfter = new Date(nextYear)
      yearAfter.setFullYear(yearAfter.getFullYear() + 1)

      const createResponse = await request.post('/api/todos', {
        data: {
          title: 'Annual birthday',
          due_date: toDateString(nextYear),
          is_recurring: true,
          recurrence_pattern: 'yearly',
        },
      })
      const createBody = await createResponse.json()
      const todoId = createBody.data.id

      await request.put(`/api/todos/${todoId}`, {
        data: { is_completed: true },
      })

      const allTodosResponse = await request.get('/api/todos')
      const allTodosBody = await allTodosResponse.json()
      const newInstance = allTodosBody.data.find(
        (t: any) => t.title === 'Annual birthday' && !t.is_completed
      )

      expect(newInstance.due_date).toBe(toDateString(yearAfter))
    })
  })

  test.describe('Metadata Inheritance', () => {
    test('next instance inherits priority', async ({ request }) => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const createResponse = await request.post('/api/todos', {
        data: {
          title: 'High priority recurring',
          priority: 'high',
          due_date: toDateString(tomorrow),
          is_recurring: true,
          recurrence_pattern: 'daily',
        },
      })
      const createBody = await createResponse.json()
      const todoId = createBody.data.id

      await request.put(`/api/todos/${todoId}`, {
        data: { is_completed: true },
      })

      const allTodosResponse = await request.get('/api/todos')
      const allTodosBody = await allTodosResponse.json()
      const newInstance = allTodosBody.data.find(
        (t: any) => t.title === 'High priority recurring' && !t.is_completed
      )

      expect(newInstance.priority).toBe('high')
    })

    test('next instance inherits tags', async ({ request }) => {
      const tagResponse = await request.post('/api/tags', {
        data: { name: 'Work', color: '#3b82f6' },
      })
      const tagBody = await tagResponse.json()
      const tagId = tagBody.data.id

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const createResponse = await request.post('/api/todos', {
        data: {
          title: 'Recurring work task',
          priority: 'high',
          due_date: toDateString(tomorrow),
          is_recurring: true,
          recurrence_pattern: 'daily',
          tag_ids: [tagId],
        },
      })
      const createBody = await createResponse.json()
      const todoId = createBody.data.id

      await request.put(`/api/todos/${todoId}`, {
        data: { is_completed: true },
      })

      const allTodosResponse = await request.get('/api/todos')
      const allTodosBody = await allTodosResponse.json()
      const newInstance = allTodosBody.data.find(
        (t: any) => t.title === 'Recurring work task' && !t.is_completed
      )

      expect(newInstance.tags.length).toBe(1)
      expect(newInstance.tags[0].id).toBe(tagId)
    })

    test('next instance inherits reminder', async ({ request }) => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const createResponse = await request.post('/api/todos', {
        data: {
          title: 'Recurring with reminder',
          due_date: toDateString(tomorrow),
          reminder_minutes: 30,
          is_recurring: true,
          recurrence_pattern: 'daily',
        },
      })
      const createBody = await createResponse.json()
      const todoId = createBody.data.id

      await request.put(`/api/todos/${todoId}`, {
        data: { is_completed: true },
      })

      const allTodosResponse = await request.get('/api/todos')
      const allTodosBody = await allTodosResponse.json()
      const newInstance = allTodosBody.data.find(
        (t: any) => t.title === 'Recurring with reminder' && !t.is_completed
      )

      expect(newInstance.reminders?.length ?? 0).toBeGreaterThan(0)
      if (newInstance.reminders?.length) {
        expect(newInstance.reminders[0].reminder_minutes).toBe(30)
      }
    })

    test('next instance maintains recurrence pattern', async ({ request }) => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const createResponse = await request.post('/api/todos', {
        data: {
          title: 'Weekly task',
          due_date: toDateString(tomorrow),
          is_recurring: true,
          recurrence_pattern: 'weekly',
        },
      })
      const createBody = await createResponse.json()
      const todoId = createBody.data.id

      await request.put(`/api/todos/${todoId}`, {
        data: { is_completed: true },
      })

      const allTodosResponse = await request.get('/api/todos')
      const allTodosBody = await allTodosResponse.json()
      const newInstance = allTodosBody.data.find(
        (t: any) => t.title === 'Weekly task' && !t.is_completed
      )

      expect(newInstance.is_recurring).toBe(true)
      expect(newInstance.recurrence_pattern).toBe('weekly')
    })
  })

  test.describe('Recurring Cancellation', () => {
    test('can disable recurring on existing todo', async ({ request }) => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const createResponse = await request.post('/api/todos', {
        data: {
          title: 'Task to cancel recurring',
          due_date: toDateString(tomorrow),
          is_recurring: true,
          recurrence_pattern: 'daily',
        },
      })
      const createBody = await createResponse.json()
      const todoId = createBody.data.id

      const updateResponse = await request.put(`/api/todos/${todoId}`, {
        data: {
          is_recurring: false,
        },
      })

      expect(updateResponse.ok()).toBeTruthy()
      const updateBody = await updateResponse.json()
      expect(updateBody.data.is_recurring).toBe(false)
    })

    test('can change recurrence pattern', async ({ request }) => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const createResponse = await request.post('/api/todos', {
        data: {
          title: 'Change pattern task',
          due_date: toDateString(tomorrow),
          is_recurring: true,
          recurrence_pattern: 'daily',
        },
      })
      const createBody = await createResponse.json()
      const todoId = createBody.data.id

      const updateResponse = await request.put(`/api/todos/${todoId}`, {
        data: {
          recurrence_pattern: 'weekly',
        },
      })

      expect(updateResponse.ok()).toBeTruthy()
      const updateBody = await updateResponse.json()
      expect(updateBody.data.recurrence_pattern).toBe('weekly')
    })
  })

  test.describe('UI Interactions', () => {
    test('user can create daily recurring todo in UI', async ({ page }) => {
      await page.goto('/')

      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      await page.getByTestId('todo-advanced-toggle').click()
      await page.getByTestId('todo-title').fill('Daily standup')
      await page.getByTestId('todo-due-date').fill(toDateString(tomorrow))
      await page.getByTestId('todo-recurring').check()
      await page.getByTestId('todo-recurrence-pattern').selectOption('daily')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      const todoItem = page.getByTestId('todo-item')
      await expect(todoItem).toContainText('Daily standup')
      await expect(todoItem).toContainText('Repeats daily')
    })

    test('completing recurring todo in UI creates next instance', async ({ page }) => {
      await page.goto('/')

      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      await page.getByTestId('todo-advanced-toggle').click()
      await page.getByTestId('todo-title').fill('Recurring task')
      await page.getByTestId('todo-due-date').fill(toDateString(tomorrow))
      await page.getByTestId('todo-recurring').check()
      await page.getByTestId('todo-recurrence-pattern').selectOption('daily')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(500)

      await expect(page.getByTestId('todo-item')).toHaveCount(1)

      // Toggle completion
      await page.getByTestId('todo-toggle').first().click()
      await page.waitForTimeout(500)

      // Should show both completed and new instance entries
      await expect(page.getByTestId('todo-item').filter({ hasText: 'Recurring task' })).toHaveCount(2)
    })
  })

  test.describe('Edge Cases', () => {
    test('non-recurring todo is_recurring defaults to false', async ({ request }) => {
      const response = await request.post('/api/todos', {
        data: {
          title: 'Regular task',
        },
      })

      const body = await response.json()
      expect(body.data.is_recurring).toBe(false)
      expect(body.data.recurrence_pattern == null).toBeTruthy()
    })
  })
})
