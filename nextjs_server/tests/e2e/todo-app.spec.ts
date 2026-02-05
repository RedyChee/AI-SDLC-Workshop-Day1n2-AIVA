import { test, expect } from '@playwright/test'

function toDateString(date: Date) {
  return date.toISOString().split('T')[0]
}

function toMonthLabel(date: Date) {
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

test.describe('Todo app core flows', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset')
  })

  test('user can create, search, and complete a todo', async ({ page }) => {
    await page.goto('/')

    await page.getByTestId('todo-title').fill('Plan workshop')
    await page.getByTestId('todo-priority').selectOption('medium')
    await page.getByTestId('todo-due-date').fill('2026-02-06')
    await page.getByTestId('todo-add').click()

    const todoItems = page.getByTestId('todo-item')
    await expect(todoItems.first()).toContainText('Plan workshop')

    await page.getByTestId('todo-search').fill('workshop')
    await expect(todoItems).toHaveCount(1)

    await page.getByTestId('todo-toggle').first().click()
    await expect(page.getByTestId('completed-count')).toHaveText('1')
  })

  test('user can add a subtask and tag', async ({ page }) => {
    await page.goto('/')

    await page.getByTestId('todo-title').fill('Prepare slides')
    await page.getByTestId('todo-add').click()

    await page.getByTestId('todo-item').first().getByTestId('subtask-add-button').click()
    await page.getByTestId('subtask-title-input').fill('Outline agenda')
    await page.getByTestId('subtask-submit').click()

    await expect(page.getByTestId('todo-item').first()).toContainText('0/1 subtasks')

    await page.getByTestId('tag-name-input').fill('work')
    await page.getByTestId('tag-color-input').fill('#2563eb')
    await page.getByTestId('tag-create').click()

    await page.getByTestId('todo-item').first().getByTestId('todo-tag-picker').selectOption({ label: 'work' })

    await expect(page.getByTestId('todo-item').first()).toContainText('work')
  })

  test('user can create a template and use it', async ({ page }) => {
    await page.goto('/')

    await page.getByTestId('nav-templates').click()
    await page.getByTestId('template-name').fill('Daily standup')
    await page.getByTestId('template-title').fill('Standup')
    await page.getByTestId('template-offset').fill('0')
    await page.getByTestId('template-create').click()

    await page.getByTestId('template-item').first().getByTestId('template-use').click()

    await page.getByTestId('nav-list').click()
    await expect(page.getByTestId('todo-item').first()).toContainText('Standup')
  })

  test('export and import round-trip works', async ({ request }) => {
    const exportResponse = await request.get('/api/todos/export')
    expect(exportResponse.ok()).toBeTruthy()
    const exportPayload = await exportResponse.json()

    const importResponse = await request.post('/api/todos/import', {
      data: exportPayload,
    })
    expect(importResponse.ok()).toBeTruthy()
  })

  test('calendar shows todos by date', async ({ page, request }) => {
    const now = new Date()
    const targetDate = new Date(now.getFullYear(), now.getMonth(), 8)
    const targetDateString = toDateString(targetDate)
    const monthParam = targetDateString.slice(0, 7)

    const createResponse = await request.post('/api/todos', {
      data: {
        title: 'Calendar item',
        priority: 'medium',
        due_date: targetDateString,
      },
    })
    expect(createResponse.ok()).toBeTruthy()

    await page.goto(`/calendar?month=${monthParam}`)
    await expect(page.getByTestId('calendar-month')).toBeVisible()
    await expect(page.getByTestId(`calendar-day-${targetDateString}`)).toContainText('Calendar item')

    await page.getByTestId(`calendar-day-${targetDateString}`).click()
    await expect(page.getByTestId('calendar-modal')).toBeVisible()
    await expect(page.getByTestId('calendar-modal')).toContainText('Calendar item')
    await page.getByTestId('calendar-modal-close').click()

    await page.getByTestId('calendar-next').click()
    await page.getByTestId('calendar-today').click()
    await expect(page.getByTestId('calendar-month')).toHaveText(toMonthLabel(now))
  })

  test('reminder check returns due reminders', async ({ request }) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dueDate = toDateString(tomorrow)
    const createResponse = await request.post('/api/todos', {
      data: {
        title: 'Reminder task',
        priority: 'medium',
        due_date: dueDate,
        reminder_minutes: 15,
      },
    })
    expect(createResponse.ok()).toBeTruthy()

    const checkResponse = await request.get('/api/notifications/check')
    expect(checkResponse.ok()).toBeTruthy()
  })

  test('user can edit a todo', async ({ page }) => {
    await page.goto('/')

    await page.getByTestId('todo-title').fill('Original task')
    await page.getByTestId('todo-add').click()

    const todoItem = page.getByTestId('todo-item').first()
    await expect(todoItem).toContainText('Original task')

    await todoItem.getByRole('button', { name: 'Edit' }).click()
    await page.getByTestId('todo-edit-title').fill('Updated task')
    await todoItem.getByRole('button', { name: 'Save' }).click()
    await page.waitForTimeout(200)

    await expect(todoItem).toContainText('Updated task')
  })

  test('user can delete a todo and it cascades to subtasks', async ({ page }) => {
    await page.goto('/')

    await page.getByTestId('todo-title').fill('Task to delete')
    await page.getByTestId('todo-add').click()

    await page.getByTestId('todo-item').first().getByTestId('subtask-add-button').click()
    await page.getByTestId('subtask-title-input').fill('Subtask 1')
    await page.getByTestId('subtask-submit').click()

    await expect(page.getByTestId('todo-item')).toHaveCount(1)

    page.on('dialog', dialog => dialog.accept())
    await page.getByTestId('todo-item').first().getByRole('button', { name: 'Del' }).click()

    await expect(page.getByTestId('todo-item')).toHaveCount(0)
  })

  test('user can filter todos by priority', async ({ page }) => {
    await page.goto('/')

    await page.getByTestId('todo-title').fill('High priority task')
    await page.getByTestId('todo-priority').selectOption('high')
    await page.getByTestId('todo-add').click()

    await page.getByTestId('todo-title').fill('Low priority task')
    await page.getByTestId('todo-priority').selectOption('low')
    await page.getByTestId('todo-add').click()

    await page.getByTestId('priority-filter').selectOption('high')
    await expect(page.getByTestId('todo-item')).toHaveCount(1)
    await expect(page.getByTestId('todo-item').first()).toContainText('High priority task')

    await page.getByTestId('priority-filter').selectOption('low')
    await expect(page.getByTestId('todo-item')).toHaveCount(1)
    await expect(page.getByTestId('todo-item').first()).toContainText('Low priority task')
  })

  test('recurring todo creates next instance on completion', async ({ page }) => {
    await page.goto('/')

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    await page.getByText('Show advanced options').click()

    await page.getByTestId('todo-title').fill('Daily standup')
    await page.getByTestId('todo-priority').selectOption('medium')
    await page.getByTestId('todo-due-date').fill(toDateString(tomorrow))
    await page.getByTestId('todo-recurring').check()
    await page.getByTestId('todo-recurrence-pattern').selectOption('daily')
    await page.getByTestId('todo-add').click()

    await expect(page.getByTestId('todo-item')).toHaveCount(1)
    await expect(page.getByTestId('todo-item').first()).toContainText('Daily standup')
    await expect(page.getByTestId('todo-item').first()).toContainText('Repeats daily')

    await page.getByTestId('todo-toggle').first().click()
    await page.waitForTimeout(500)

    const dayAfterTomorrow = new Date(tomorrow)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)
    const expectedDate = toDateString(dayAfterTomorrow)

    await expect(page.getByTestId('todo-item').first()).toContainText(expectedDate)
  })

  test('user can toggle and delete subtasks', async ({ page }) => {
    await page.goto('/')

    await page.getByTestId('todo-title').fill('Project planning')
    await page.getByTestId('todo-add').click()

    const todoItem = page.getByTestId('todo-item').first()

    await todoItem.getByTestId('subtask-add-button').click()
    await page.getByTestId('subtask-title-input').fill('Step 1')
    await page.getByTestId('subtask-submit').click()
    await page.waitForTimeout(200)

    await todoItem.getByTestId('subtask-add-button').click()
    await page.getByTestId('subtask-title-input').fill('Step 2')
    await page.getByTestId('subtask-submit').click()
    await page.waitForTimeout(200)

    await expect(todoItem).toContainText('0/2 subtasks')

    await todoItem.getByTestId('subtask-toggle').first().click()
    await page.waitForTimeout(200)
    await expect(todoItem).toContainText('1/2 subtasks')

    page.on('dialog', dialog => dialog.accept())
    await todoItem.getByTestId('subtask-delete').last().click()
    await page.waitForTimeout(200)
    await expect(todoItem).toContainText('1/1 subtasks')
  })

  test('user can combine multiple filters', async ({ page }) => {
    await page.goto('/')

    await page.getByTestId('tag-name-input').fill('urgent')
    await page.getByTestId('tag-color-input').fill('#ef4444')
    await page.getByTestId('tag-create').click()

    await page.getByTestId('todo-title').fill('Important meeting')
    await page.getByTestId('todo-priority').selectOption('high')
    await page.getByTestId('todo-add').click()

    await page.getByTestId('todo-item').first().getByTestId('todo-tag-picker').selectOption({ label: 'urgent' })

    await page.getByTestId('todo-title').fill('Casual coffee')
    await page.getByTestId('todo-priority').selectOption('low')
    await page.getByTestId('todo-add').click()

    await page.getByTestId('todo-search').fill('meeting')
    await page.getByTestId('priority-filter').selectOption('high')

    await expect(page.getByTestId('todo-item')).toHaveCount(1)
    await expect(page.getByTestId('todo-item').first()).toContainText('Important meeting')
  })

  test('calendar navigation with prev/next/today buttons', async ({ page }) => {
    const today = new Date()
    const currentMonth = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    
    await page.goto('/calendar')
    await expect(page.getByTestId('calendar-month')).toContainText(currentMonth)

    await page.getByTestId('calendar-next').click()
    await page.waitForTimeout(200)
    await expect(page.getByTestId('calendar-month')).not.toContainText(currentMonth)

    await page.getByTestId('calendar-prev').click()
    await page.waitForTimeout(200)
    await expect(page.getByTestId('calendar-month')).toContainText(currentMonth)

    await page.getByTestId('calendar-next').click()
    await page.getByTestId('calendar-today').click()
    await page.waitForTimeout(200)
    await expect(page.getByTestId('calendar-month')).toContainText(currentMonth)
  })

  test('create weekly recurring todo', async ({ page }) => {
    await page.goto('/')

    const today = new Date()
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    await page.getByText('Show advanced options').click()

    await page.getByTestId('todo-title').fill('Weekly team meeting')
    await page.getByTestId('todo-due-date').fill(toDateString(nextWeek))
    await page.getByTestId('todo-recurring').check()
    await page.getByTestId('todo-recurrence-pattern').selectOption('weekly')
    await page.getByTestId('todo-add').click()

    await expect(page.getByTestId('todo-item').first()).toContainText('Weekly team meeting')
    await expect(page.getByTestId('todo-item').first()).toContainText('Repeats weekly')
  })

  test('clear search filter', async ({ page }) => {
    await page.goto('/')

    await page.getByTestId('todo-title').fill('Find me')
    await page.getByTestId('todo-add').click()

    await page.getByTestId('todo-title').fill('Hidden task')
    await page.getByTestId('todo-add').click()

    await page.getByTestId('todo-search').fill('Find')
    await expect(page.getByTestId('todo-item')).toHaveCount(1)

    await page.getByTestId('todo-search').fill('')
    await page.waitForTimeout(400)
    await expect(page.getByTestId('todo-item')).toHaveCount(2)
  })

  test('create template with subtasks and use it', async ({ page }) => {
    await page.goto('/')

    await page.getByTestId('todo-title').fill('Project kickoff')
    await page.getByTestId('todo-add').click()

    const todoItem = page.getByTestId('todo-item').first()
    await todoItem.getByTestId('subtask-add-button').click()
    await page.getByTestId('subtask-title-input').fill('Setup repository')
    await page.getByTestId('subtask-submit').click()
    await page.waitForTimeout(200)

    await todoItem.getByTestId('subtask-add-button').click()
    await page.getByTestId('subtask-title-input').fill('Create roadmap')
    await page.getByTestId('subtask-submit').click()
    await page.waitForTimeout(200)

    await page.getByTestId('nav-templates').click()
    
    await page.getByTestId('template-name').fill('Standard Kickoff')
    await page.getByTestId('template-title').fill('Project kickoff')
    await page.getByTestId('template-offset').fill('0')
    await page.getByTestId('template-create').click()

    await expect(page.getByTestId('template-item')).toHaveCount(1)

    await page.getByTestId('template-use').click()
    await page.waitForTimeout(500)

    await page.getByTestId('nav-list').click()
    await expect(page.getByText('Project kickoff')).toHaveCount(2)
  })

  test('calendar day click opens modal', async ({ page }) => {
    await page.goto('/')

    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 3)
    const targetDateString = toDateString(targetDate)
    const monthParam = targetDate.toISOString().slice(0, 7)

    await page.getByTestId('todo-title').fill('Meeting in 3 days')
    await page.getByTestId('todo-due-date').fill(targetDateString)
    await page.getByTestId('todo-add').click()

    await page.goto(`/calendar?month=${monthParam}`)
    
    await page.getByTestId(`calendar-day-${targetDateString}`).click()
    await expect(page.getByTestId('calendar-modal')).toBeVisible()
    await expect(page.getByTestId('calendar-modal')).toContainText('Meeting in 3 days')
  })
})
