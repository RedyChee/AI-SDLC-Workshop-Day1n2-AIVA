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

  test('past due date validation', async ({ request }) => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const pastDate = toDateString(yesterday)
    
    const response = await request.post('/api/todos', {
      data: {
        title: 'Past due task',
        priority: 'high',
        due_date: pastDate,
      },
    })
    
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('future')
  })

  test('edit priority', async ({ page }) => {
    await page.goto('/')
    
    await page.getByTestId('todo-title').fill('Task to edit priority')
    await page.getByTestId('todo-priority').selectOption('low')
    await page.getByTestId('todo-add').click()
    
    await page.waitForTimeout(500)
    
    const todoItem = page.getByTestId('todo-item').filter({ hasText: 'Task to edit priority' })
    await expect(todoItem).toBeVisible()
    await expect(todoItem.locator('.bg-blue-100')).toContainText('low')
    
    await todoItem.getByTestId('todo-priority-select').selectOption('high')
    await page.waitForTimeout(500)
    
    await expect(todoItem.locator('.bg-red-100')).toContainText('high')
  })

  test('verify priority sorting', async ({ page }) => {
    await page.goto('/')
    
    await page.getByTestId('todo-title').fill('Low priority task')
    await page.getByTestId('todo-priority').selectOption('low')
    await page.getByTestId('todo-add').click()
    await page.waitForTimeout(300)
    
    await page.getByTestId('todo-title').fill('High priority task')
    await page.getByTestId('todo-priority').selectOption('high')
    await page.getByTestId('todo-add').click()
    await page.waitForTimeout(300)
    
    await page.getByTestId('todo-title').fill('Medium priority task')
    await page.getByTestId('todo-priority').selectOption('medium')
    await page.getByTestId('todo-add').click()
    await page.waitForTimeout(500)
    
    const todos = page.getByTestId('todo-item')
    const firstTodo = todos.first()
    const secondTodo = todos.nth(1)
    const thirdTodo = todos.nth(2)
    
    await expect(firstTodo).toContainText('High priority task')
    await expect(secondTodo).toContainText('Medium priority task')
    await expect(thirdTodo).toContainText('Low priority task')
  })

  test('recurring todo inherits metadata', async ({ page, request }) => {
    await page.goto('/')
    
    const tagResponse = await request.post('/api/tags', {
      data: { name: 'Work', color: '#ff0000' },
    })
    const tagData = await tagResponse.json()
    const tagId = tagData.data.id
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dueDate = toDateString(tomorrow)
    
    await page.getByTestId('todo-title').fill('Recurring work task')
    await page.getByTestId('todo-priority').selectOption('high')
    await page.getByTestId('todo-due-date').fill(dueDate)
    await page.getByTestId('todo-recurring').check()
    await page.getByTestId('todo-recurrence-pattern').selectOption('daily')
    await page.getByTestId('todo-reminder').selectOption('15')
    await page.getByTestId('todo-add').click()
    
    await page.waitForTimeout(500)
    
    const todoItem = page.getByTestId('todo-item').filter({ hasText: 'Recurring work task' })
    await todoItem.getByTestId('todo-tag-picker').selectOption(tagId)
    await page.waitForTimeout(500)
    
    await todoItem.getByTestId('todo-toggle').click()
    await page.waitForTimeout(1000)
    
    const newInstance = page.getByTestId('todo-item').filter({ hasText: 'Recurring work task' }).last()
    await expect(newInstance.locator('.bg-red-100')).toContainText('high')
    await expect(newInstance.locator('.bg-blue-100')).toContainText('daily')
    await expect(newInstance.locator('.bg-indigo-100')).toContainText('15m')
    await expect(newInstance.locator('[style*="ff0000"]')).toContainText('Work')
  })

  test('edit tag name and color', async ({ page, request }) => {
    await page.goto('/')
    
    const createResponse = await request.post('/api/tags', {
      data: { name: 'OldName', color: '#00ff00' },
    })
    const createData = await createResponse.json()
    const tagId = createData.data.id
    
    const updateResponse = await request.put(`/api/tags/${tagId}`, {
      data: { name: 'NewName', color: '#0000ff' },
    })
    expect(updateResponse.ok()).toBeTruthy()
    
    const getResponse = await request.get('/api/tags')
    const getData = await getResponse.json()
    const updatedTag = getData.data.find((t: any) => t.id === tagId)
    expect(updatedTag.name).toBe('NewName')
    expect(updatedTag.color).toBe('#0000ff')
  })

  test('delete tag', async ({ page, request }) => {
    await page.goto('/')
    
    const createResponse = await request.post('/api/tags', {
      data: { name: 'ToDelete', color: '#ff00ff' },
    })
    const createData = await createResponse.json()
    const tagId = createData.data.id
    
    const deleteResponse = await request.delete(`/api/tags/${tagId}`)
    expect(deleteResponse.ok()).toBeTruthy()
    
    const getResponse = await request.get('/api/tags')
    const getData = await getResponse.json()
    const deletedTag = getData.data.find((t: any) => t.id === tagId)
    expect(deletedTag).toBeUndefined()
  })

  test('filter by tag', async ({ page, request }) => {
    await page.goto('/')
    
    const tagResponse = await request.post('/api/tags', {
      data: { name: 'FilterTest', color: '#00ffff' },
    })
    const tagData = await tagResponse.json()
    const tagId = tagData.data.id
    
    await page.getByTestId('todo-title').fill('Tagged task')
    await page.getByTestId('todo-add').click()
    await page.waitForTimeout(500)
    
    await page.getByTestId('todo-title').fill('Untagged task')
    await page.getByTestId('todo-add').click()
    await page.waitForTimeout(500)
    
    const taggedTodo = page.getByTestId('todo-item').filter({ hasText: 'Tagged task' })
    await taggedTodo.getByTestId('todo-tag-picker').selectOption(tagId)
    await page.waitForTimeout(500)
    
    await taggedTodo.locator('[style*="00ffff"]').click()
    await page.waitForTimeout(500)
    
    await expect(page.getByTestId('todo-item').filter({ hasText: 'Tagged task' })).toBeVisible()
    await expect(page.getByTestId('todo-item').filter({ hasText: 'Untagged task' })).not.toBeVisible()
  })

  test('save todo as template', async ({ page, request }) => {
    await page.goto('/')
    
    await page.getByTestId('todo-title').fill('Template task')
    await page.getByTestId('todo-priority').selectOption('high')
    await page.getByTestId('todo-add').click()
    await page.waitForTimeout(500)
    
    const todoItem = page.getByTestId('todo-item').filter({ hasText: 'Template task' })
    await todoItem.getByTestId('subtask-toggle').click()
    await page.waitForTimeout(300)
    
    await todoItem.getByTestId('subtask-title-input').fill('Subtask 1')
    await todoItem.getByTestId('subtask-submit').click()
    await page.waitForTimeout(500)
    
    const todosResponse = await request.get('/api/todos')
    const todosData = await todosResponse.json()
    const todo = todosData.data.find((t: any) => t.title === 'Template task')
    
    const templateResponse = await request.post('/api/templates', {
      data: {
        name: 'My Template',
        description: 'Test template',
        category: 'work',
        priority: 'high',
        is_recurring: false,
        subtasks_json: JSON.stringify([{ title: 'Subtask 1', position: 0 }]),
        due_date_offset_days: 1,
      },
    })
    
    expect(templateResponse.ok()).toBeTruthy()
    const templateData = await templateResponse.json()
    expect(templateData.data.name).toBe('My Template')
  })

  test('edit template', async ({ request }) => {
    const createResponse = await request.post('/api/templates', {
      data: {
        name: 'Original Template',
        description: 'Original description',
        category: 'personal',
        priority: 'medium',
        is_recurring: false,
        subtasks_json: '[]',
        due_date_offset_days: 1,
      },
    })
    const createData = await createResponse.json()
    const templateId = createData.data.id
    
    const updateResponse = await request.put(`/api/templates/${templateId}`, {
      data: {
        name: 'Updated Template',
        description: 'Updated description',
        category: 'work',
      },
    })
    
    expect(updateResponse.ok()).toBeTruthy()
    const updateData = await updateResponse.json()
    expect(updateData.data.name).toBe('Updated Template')
    expect(updateData.data.description).toBe('Updated description')
  })

  test('delete template', async ({ request }) => {
    const createResponse = await request.post('/api/templates', {
      data: {
        name: 'Template to Delete',
        description: 'Will be deleted',
        category: 'other',
        priority: 'low',
        is_recurring: false,
        subtasks_json: '[]',
        due_date_offset_days: 0,
      },
    })
    const createData = await createResponse.json()
    const templateId = createData.data.id
    
    const deleteResponse = await request.delete(`/api/templates/${templateId}`)
    expect(deleteResponse.ok()).toBeTruthy()
    
    const getResponse = await request.get('/api/templates')
    const getData = await getResponse.json()
    const deletedTemplate = getData.data.find((t: any) => t.id === templateId)
    expect(deletedTemplate).toBeUndefined()
  })

  test('import invalid JSON', async ({ page }) => {
    await page.goto('/')
    
    const invalidJson = 'not valid json'
    const dataUrl = `data:application/json;base64,${btoa(invalidJson)}`
    
    await page.evaluate((url) => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      if (input) {
        const dt = new DataTransfer()
        fetch(url)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], 'invalid.json', { type: 'application/json' })
            dt.items.add(file)
            input.files = dt.files
            input.dispatchEvent(new Event('change', { bubbles: true }))
          })
      }
    }, dataUrl)
    
    await page.waitForTimeout(1000)
    
    await expect(page.getByText(/error|invalid|failed/i)).toBeVisible()
  })

})
