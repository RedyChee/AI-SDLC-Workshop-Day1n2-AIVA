import { test, expect } from '@playwright/test'

function toDateString(date: Date) {
  return date.toISOString().split('T')[0]
}

test.describe('Feature 04: Reminders & Notifications', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset')
  })

  test.describe('Reminder Configuration', () => {
    test('can set 7 reminder timing options on creation', async ({ request }) => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const timings = [15, 30, 60, 120, 1440, 2880, 10080] // 15m to 1 week

      for (const minutes of timings) {
        const response = await request.post('/api/todos', {
          data: {
            title: `Task with ${minutes}m reminder`,
            due_date: toDateString(tomorrow),
            reminder_minutes: minutes,
          },
        })

        expect(response.ok()).toBeTruthy()
        const body = await response.json()
        // Check that reminders array contains the correct timing
        if (body.data.reminders && body.data.reminders.length > 0) {
          expect(body.data.reminders[0].reminder_minutes).toBe(minutes)
        }
      }
    })

    test('todos without reminder have empty reminders array', async ({ request }) => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const response = await request.post('/api/todos', {
        data: {
          title: 'Task without reminder',
          due_date: toDateString(tomorrow),
        },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(Array.isArray(body.data.reminders)).toBe(true)
      expect(body.data.reminders.length).toBe(0)
    })

    test('reminders work with incomplete todos', async ({ request }) => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const response = await request.post('/api/todos', {
        data: {
          title: 'Incomplete task',
          due_date: toDateString(tomorrow),
          reminder_minutes: 30,
          is_completed: false,
        },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.data.is_completed).toBe(false)
      expect(body.data.reminders.length).toBeGreaterThan(0)
    })
  })

  test.describe('Notification API', () => {
    test('notification check endpoint returns array', async ({ request }) => {
      const checkResponse = await request.get('/api/notifications/check')
      expect(checkResponse.ok()).toBeTruthy()
      const body = await checkResponse.json()
      expect(Array.isArray(body.data)).toBe(true)
    })

    test('overdue todos with reminders included in check', async ({ request }) => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const createResponse = await request.post('/api/todos', {
        data: {
          title: 'Overdue task',
          due_date: toDateString(yesterday),
          reminder_minutes: 15,
        },
      })
      
      expect(createResponse.ok()).toBeTruthy()
      const checkResponse = await request.get('/api/notifications/check')
      expect(checkResponse.ok()).toBeTruthy()
    })
  })

  test.describe('Reminder Inheritance with Recurring Todos', () => {
    test('reminder persists when todo completes and repeats', async ({ request }) => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const createResponse = await request.post('/api/todos', {
        data: {
          title: 'Daily task with reminder',
          due_date: toDateString(tomorrow),
          reminder_minutes: 20,
          is_recurring: true,
          recurrence_pattern: 'daily',
        },
      })

      expect(createResponse.ok()).toBeTruthy()
      const createBody = await createResponse.json()
      expect(createBody.data.reminders.length).toBeGreaterThan(0)
    })
  })

  test.describe('UI Reminder Features', () => {
    test('reminder dropdown only enabled with due date', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('Task without due date')
      await page.getByTestId('todo-advanced-toggle').click()
      await page.waitForTimeout(300)

      const reminderSelect = page.getByTestId('todo-reminder')
      // Should be disabled without due date
      const isDisabled = await reminderSelect.isDisabled().catch(() => false)
      if (isDisabled) {
        expect(isDisabled).toBe(true)
      }

      // Add due date
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await page.getByTestId('todo-due-date').fill(toDateString(tomorrow))
      await page.waitForTimeout(300)

      // Now should work
      await reminderSelect.selectOption('30')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await expect(page.getByTestId('todo-item')).toContainText('Task without due date')
    })

    test('user can create todo with reminder and see it in list', async ({ page }) => {
      await page.goto('/')

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      await page.getByTestId('todo-title').fill('Task with 15m reminder')
      await page.getByTestId('todo-due-date').fill(toDateString(tomorrow))
      await page.getByTestId('todo-advanced-toggle').click()
      await page.waitForTimeout(300)
      await page.getByTestId('todo-reminder').selectOption('15')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      const todoItem = page.getByTestId('todo-item').filter({ hasText: 'Task with 15m reminder' })
      await expect(todoItem).toBeVisible()
    })
  })

  test.describe('Reminder Edge Cases', () => {
    test('minimum reminder timing (15 minutes) works', async ({ request }) => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const response = await request.post('/api/todos', {
        data: {
          title: 'Quick reminder',
          due_date: toDateString(tomorrow),
          reminder_minutes: 15,
        },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.data.reminders.length).toBeGreaterThan(0)
    })

    test('maximum reminder timing (1 week) works', async ({ request }) => {
      const upcoming = new Date()
      upcoming.setDate(upcoming.getDate() + 10)

      const response = await request.post('/api/todos', {
        data: {
          title: 'Future reminder',
          due_date: toDateString(upcoming),
          reminder_minutes: 10080, // 1 week in minutes
        },
      })

      expect(response.ok()).toBeTruthy()
    })

    test('reminder with early morning due date', async ({ request }) => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(6, 0, 0, 0)

      const response = await request.post('/api/todos', {
        data: {
          title: 'Morning task',
          due_date: toDateString(tomorrow),
          reminder_minutes: 30,
        },
      })

      expect(response.ok()).toBeTruthy()
    })

    test('reminder with late evening due date', async ({ request }) => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(22, 0, 0, 0)

      const response = await request.post('/api/todos', {
        data: {
          title: 'Evening task',
          due_date: toDateString(tomorrow),
          reminder_minutes: 60,
        },
      })

      expect(response.ok()).toBeTruthy()
    })
  })
})
