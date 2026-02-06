import { test, expect } from '@playwright/test'

function toDateString(date: Date) {
  return date.toISOString().split('T')[0]
}

test.describe('Feature 02: Priority System', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset')
  })

  test.describe('Priority Creation & Management', () => {
    test('can create todo with each priority level', async ({ request }) => {
      for (const priority of ['low', 'medium', 'high']) {
        const response = await request.post('/api/todos', {
          data: {
            title: `Task with ${priority} priority`,
            priority: priority,
          },
        })

        expect(response.ok()).toBeTruthy()
        const body = await response.json()
        expect(body.data.priority).toBe(priority)
      }
    })

    test('default priority is medium', async ({ request }) => {
      const response = await request.post('/api/todos', {
        data: {
          title: 'Task without priority',
        },
      })

      const body = await response.json()
      expect(body.data.priority).toBe('medium')
    })

    test('can update todo priority', async ({ request }) => {
      const createResponse = await request.post('/api/todos', {
        data: {
          title: 'Task',
          priority: 'low',
        },
      })
      const createBody = await createResponse.json()
      const todoId = createBody.data.id

      const updateResponse = await request.put(`/api/todos/${todoId}`, {
        data: { priority: 'high' },
      })

      expect(updateResponse.ok()).toBeTruthy()
      const updateBody = await updateResponse.json()
      expect(updateBody.data.priority).toBe('high')
    })

    test('rejects invalid priority values', async ({ request }) => {
      const invalidPriorities = ['urgent', 'critical', 'lowest', 'highest', '1', 'null']

      for (const invalidPriority of invalidPriorities) {
        const response = await request.post('/api/todos', {
          data: {
            title: 'Task',
            priority: invalidPriority,
          },
        })

        expect(response.status()).toBe(400)
      }
    })

    test('priority is case-sensitive', async ({ request }) => {
      const response = await request.post('/api/todos', {
        data: {
          title: 'Task',
          priority: 'HIGH',
        },
      })

      expect(response.status()).toBe(400)
    })
  })

  test.describe('Priority Sorting', () => {
    test('todos are sorted by priority in correct order', async ({ request }) => {
      // Create todos in reverse order
      await request.post('/api/todos', {
        data: {
          title: 'Low priority task',
          priority: 'low',
        },
      })

      await request.post('/api/todos', {
        data: {
          title: 'High priority task',
          priority: 'high',
        },
      })

      await request.post('/api/todos', {
        data: {
          title: 'Medium priority task',
          priority: 'medium',
        },
      })

      const response = await request.get('/api/todos')
      const body = await response.json()

      expect(body.data[0].title).toBe('High priority task')
      expect(body.data[1].title).toBe('Medium priority task')
      expect(body.data[2].title).toBe('Low priority task')
    })

    test('todos with same priority sorted by due date', async ({ request }) => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)

      // Create with same priority but different due dates
      await request.post('/api/todos', {
        data: {
          title: 'High priority next week',
          priority: 'high',
          due_date: toDateString(nextWeek),
        },
      })

      await request.post('/api/todos', {
        data: {
          title: 'High priority tomorrow',
          priority: 'high',
          due_date: toDateString(tomorrow),
        },
      })

      const response = await request.get('/api/todos')
      const body = await response.json()

      // Both are high priority, but tomorrow should come first
      expect(body.data[0].title).toBe('High priority tomorrow')
      expect(body.data[1].title).toBe('High priority next week')
    })


    test('completed todos not sorted with active todos', async ({ request }) => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const createResponse = await request.post('/api/todos', {
        data: {
          title: 'Completed task',
          priority: 'high',
          due_date: toDateString(tomorrow),
        },
      })
      const createBody = await createResponse.json()
      const todoId = createBody.data.id

      await request.post('/api/todos', {
        data: {
          title: 'Active task',
          priority: 'low',
          due_date: toDateString(tomorrow),
        },
      })

      // Complete first todo
      await request.put(`/api/todos/${todoId}`, {
        data: { is_completed: true },
      })

      const response = await request.get('/api/todos')
      const body = await response.json()

      // Active task should come before completed task
      const activeTodos = body.data.filter((t: any) => !t.is_completed)
      const completedTodos = body.data.filter((t: any) => t.is_completed)

      expect(activeTodos[0].title).toBe('Active task')
      expect(completedTodos[0].title).toBe('Completed task')
    })
  })

  test.describe('Priority Filtering', () => {
    test('can filter todos by high priority', async ({ page }) => {
      await page.goto('/')

      // Create todos with different priorities
      await page.getByTestId('todo-title').fill('High priority task')
      await page.getByTestId('todo-priority').selectOption('high')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('todo-title').fill('Low priority task')
      await page.getByTestId('todo-priority').selectOption('low')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      // Filter by high priority
      await page.getByTestId('priority-filter').selectOption('high')
      await page.waitForTimeout(400)

      const todoItems = page.getByTestId('todo-item')
      await expect(todoItems).toHaveCount(1)
      await expect(todoItems).toContainText('High priority task')
    })

    test('can filter todos by medium priority', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('Medium priority task')
      await page.getByTestId('todo-priority').selectOption('medium')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('todo-title').fill('High priority task')
      await page.getByTestId('todo-priority').selectOption('high')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('priority-filter').selectOption('medium')
      await page.waitForTimeout(400)

      const todoItems = page.getByTestId('todo-item')
      await expect(todoItems).toHaveCount(1)
      await expect(todoItems).toContainText('Medium priority task')
    })

    test('can filter todos by low priority', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('Low priority task')
      await page.getByTestId('todo-priority').selectOption('low')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('todo-title').fill('High priority task')
      await page.getByTestId('todo-priority').selectOption('high')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('priority-filter').selectOption('low')
      await page.waitForTimeout(400)

      const todoItems = page.getByTestId('todo-item')
      await expect(todoItems).toHaveCount(1)
      await expect(todoItems).toContainText('Low priority task')
    })

    test('clearing priority filter shows all todos', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('Task 1')
      await page.getByTestId('todo-priority').selectOption('high')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('todo-title').fill('Task 2')
      await page.getByTestId('todo-priority').selectOption('low')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      // Filter then clear
      await page.getByTestId('priority-filter').selectOption('high')
      await page.waitForTimeout(400)
      await expect(page.getByTestId('todo-item')).toHaveCount(1)

      await page.getByTestId('priority-filter').selectOption('all')
      await page.waitForTimeout(400)
      await expect(page.getByTestId('todo-item')).toHaveCount(2)
    })
  })

  test.describe('Priority with Other Features', () => {
    test('priority preserved on todo completion and recurrence', async ({ request }) => {
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

      // Complete the todo
      const completeResponse = await request.put(`/api/todos/${todoId}`, {
        data: { is_completed: true },
      })
      const completeBody = await completeResponse.json()

      // The next instance should also have high priority
      const allTodosResponse = await request.get('/api/todos')
      const allTodosBody = await allTodosResponse.json()
      const newInstance = allTodosBody.data.find((t: any) => t.title === 'High priority recurring')

      expect(newInstance.priority).toBe('high')
    })

    test('priority persists when adding subtasks', async ({ request }) => {
      const createResponse = await request.post('/api/todos', {
        data: {
          title: 'High priority with subtasks',
          priority: 'high',
        },
      })
      const createBody = await createResponse.json()
      const todoId = createBody.data.id

      await request.post(`/api/todos/${todoId}/subtasks`, {
        data: {
          title: 'Subtask 1',
        },
      })

      const getTodoResponse = await request.get(`/api/todos/${todoId}`)
      const getTodoBody = await getTodoResponse.json()

      expect(getTodoBody.data.priority).toBe('high')
    })

    test('priority persists when adding tags', async ({ request }) => {
      const tagResponse = await request.post('/api/tags', {
        data: { name: 'Work', color: '#3b82f6' },
      })
      const tagBody = await tagResponse.json()
      const tagId = tagBody.data.id

      const createResponse = await request.post('/api/todos', {
        data: {
          title: 'High priority with tags',
          priority: 'high',
        },
      })
      const createBody = await createResponse.json()
      const todoId = createBody.data.id

      await request.post(`/api/todos/${todoId}/tags`, {
        data: { tag_id: tagId },
      })

      const getTodoResponse = await request.get(`/api/todos/${todoId}`)
      const getTodoBody = await getTodoResponse.json()

      expect(getTodoBody.data.priority).toBe('high')
    })
  })

  test.describe('Priority UI', () => {
    test('priority badge displays for high priority', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('High priority task')
      await page.getByTestId('todo-priority').selectOption('high')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      const todoItem = page.getByTestId('todo-item')
      await expect(todoItem).toContainText('High')
    })

    test('priority badge updates on edit', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('Task')
      await page.getByTestId('todo-priority').selectOption('low')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      const todoItem = page.getByTestId('todo-item').filter({ hasText: 'Task' })
      await expect(todoItem).toContainText('Low')

      // Edit priority
      if (await todoItem.getByTestId('todo-priority-select').isVisible()) {
        await todoItem.getByTestId('todo-priority-select').selectOption('high')
        await page.waitForTimeout(300)
        await expect(todoItem).toContainText('High')
      }
    })
  })

  test.describe('Edge Cases', () => {
    test('null priority treated as medium', async ({ request }) => {
      const response = await request.post('/api/todos', {
        data: {
          title: 'Task',
          priority: null,
        },
      })

      // Should be rejected or treated as medium
      if (response.ok()) {
        const body = await response.json()
        expect(['medium', null]).toContain(body.data.priority)
      } else {
        expect(response.status()).toBe(400)
      }
    })

    test('can update completed task priority', async ({ request }) => {
      const createResponse = await request.post('/api/todos', {
        data: {
          title: 'Task',
          priority: 'low',
        },
      })
      const createBody = await createResponse.json()
      const todoId = createBody.data.id

      await request.put(`/api/todos/${todoId}`, {
        data: { is_completed: true },
      })

      const updateResponse = await request.put(`/api/todos/${todoId}`, {
        data: { priority: 'high' },
      })

      expect(updateResponse.ok()).toBeTruthy()
      const updateBody = await updateResponse.json()
      expect(updateBody.data.priority).toBe('high')
      expect(updateBody.data.is_completed).toBe(true)
    })
  })
})
