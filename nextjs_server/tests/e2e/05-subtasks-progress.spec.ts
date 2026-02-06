import { test, expect } from '@playwright/test'

test.describe('Feature 05: Subtasks & Progress Tracking', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset')
  })

  test.describe('Subtask CRUD', () => {
    test('can add subtask to todo', async ({ request }) => {
      const createTodoResponse = await request.post('/api/todos', {
        data: {
          title: 'Parent task',
        },
      })
      const createTodoBody = await createTodoResponse.json()
      const todoId = createTodoBody.data.id

      const response = await request.post(`/api/todos/${todoId}/subtasks`, {
        data: {
          title: 'Subtask 1',
        },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.title).toBe('Subtask 1')
      expect(body.data.is_completed).toBe(false)
    })

    test('can add multiple subtasks', async ({ request }) => {
      const createTodoResponse = await request.post('/api/todos', {
        data: {
          title: 'Parent task',
        },
      })
      const createTodoBody = await createTodoResponse.json()
      const todoId = createTodoBody.data.id

      await request.post(`/api/todos/${todoId}/subtasks`, {
        data: { title: 'Subtask 1' },
      })
      await request.post(`/api/todos/${todoId}/subtasks`, {
        data: { title: 'Subtask 2' },
      })
      await request.post(`/api/todos/${todoId}/subtasks`, {
        data: { title: 'Subtask 3' },
      })

      const getTodoResponse = await request.get(`/api/todos/${todoId}`)
      const getTodoBody = await getTodoResponse.json()

      expect(getTodoBody.data.subtasks.length).toBe(3)
      expect(getTodoBody.data.subtasks.map((s: any) => s.title)).toEqual([
        'Subtask 1',
        'Subtask 2',
        'Subtask 3',
      ])
    })

    test('can toggle subtask completion', async ({ request }) => {
      const createTodoResponse = await request.post('/api/todos', {
        data: { title: 'Parent task' },
      })
      const createTodoBody = await createTodoResponse.json()
      const todoId = createTodoBody.data.id

      const createSubtaskResponse = await request.post(`/api/todos/${todoId}/subtasks`, {
        data: { title: 'Subtask' },
      })
      const createSubtaskBody = await createSubtaskResponse.json()
      const subtaskId = createSubtaskBody.data.id

      const updateResponse = await request.put(`/api/subtasks/${subtaskId}`, {
        data: { is_completed: true },
      })

      expect(updateResponse.ok()).toBeTruthy()
      const updateBody = await updateResponse.json()
      expect(updateBody.data.is_completed).toBe(true)
    })

    test('can update subtask title', async ({ request }) => {
      const createTodoResponse = await request.post('/api/todos', {
        data: { title: 'Parent task' },
      })
      const createTodoBody = await createTodoResponse.json()
      const todoId = createTodoBody.data.id

      const createSubtaskResponse = await request.post(`/api/todos/${todoId}/subtasks`, {
        data: { title: 'Original title' },
      })
      const createSubtaskBody = await createSubtaskResponse.json()
      const subtaskId = createSubtaskBody.data.id

      const updateResponse = await request.put(`/api/subtasks/${subtaskId}`, {
        data: { title: 'Updated title' },
      })

      expect(updateResponse.ok()).toBeTruthy()
      const updateBody = await updateResponse.json()
      expect(updateBody.data.title).toBe('Updated title')
    })

    test('can delete subtask', async ({ request }) => {
      const createTodoResponse = await request.post('/api/todos', {
        data: { title: 'Parent task' },
      })
      const createTodoBody = await createTodoResponse.json()
      const todoId = createTodoBody.data.id

      const createSubtaskResponse = await request.post(`/api/todos/${todoId}/subtasks`, {
        data: { title: 'Subtask to delete' },
      })
      const createSubtaskBody = await createSubtaskResponse.json()
      const subtaskId = createSubtaskBody.data.id

      const deleteResponse = await request.delete(`/api/subtasks/${subtaskId}`)

      expect(deleteResponse.ok()).toBeTruthy()

      const getTodoResponse = await request.get(`/api/todos/${todoId}`)
      const getTodoBody = await getTodoResponse.json()
      expect(getTodoBody.data.subtasks.length).toBe(0)
    })
  })

  test.describe('Progress Tracking', () => {
    test('progress calculation 0/1', async ({ request }) => {
      const createTodoResponse = await request.post('/api/todos', {
        data: { title: 'Task' },
      })
      const createTodoBody = await createTodoResponse.json()
      const todoId = createTodoBody.data.id

      await request.post(`/api/todos/${todoId}/subtasks`, {
        data: { title: 'Subtask 1' },
      })

      const getTodoResponse = await request.get(`/api/todos/${todoId}`)
      const getTodoBody = await getTodoResponse.json()

      const subtasks = getTodoBody.data.subtasks
      expect(subtasks.length).toBe(1)
      const completedCount = subtasks.filter((s: any) => s.is_completed).length
      expect(completedCount).toBe(0)
    })

    test('progress calculation 1/2', async ({ request }) => {
      const createTodoResponse = await request.post('/api/todos', {
        data: { title: 'Task' },
      })
      const createTodoBody = await createTodoResponse.json()
      const todoId = createTodoBody.data.id

      const createSubtask1Response = await request.post(`/api/todos/${todoId}/subtasks`, {
        data: { title: 'Subtask 1' },
      })
      const createSubtask1Body = await createSubtask1Response.json()
      const subtask1Id = createSubtask1Body.data.id

      await request.post(`/api/todos/${todoId}/subtasks`, {
        data: { title: 'Subtask 2' },
      })

      // Complete first subtask
      await request.put(`/api/subtasks/${subtask1Id}`, {
        data: { is_completed: true },
      })

      const getTodoResponse = await request.get(`/api/todos/${todoId}`)
      const getTodoBody = await getTodoResponse.json()

      const subtasks = getTodoBody.data.subtasks
      expect(subtasks.length).toBe(2)
      const completedCount = subtasks.filter((s: any) => s.is_completed).length
      expect(completedCount).toBe(1)
    })

    test('progress calculation 100% when all subtasks complete', async ({ request }) => {
      const createTodoResponse = await request.post('/api/todos', {
        data: { title: 'Task' },
      })
      const createTodoBody = await createTodoResponse.json()
      const todoId = createTodoBody.data.id

      const createSubtask1Response = await request.post(`/api/todos/${todoId}/subtasks`, {
        data: { title: 'Subtask 1' },
      })
      const createSubtask1Body = await createSubtask1Response.json()
      const subtask1Id = createSubtask1Body.data.id

      const createSubtask2Response = await request.post(`/api/todos/${todoId}/subtasks`, {
        data: { title: 'Subtask 2' },
      })
      const createSubtask2Body = await createSubtask2Response.json()
      const subtask2Id = createSubtask2Body.data.id

      // Complete both
      await request.put(`/api/subtasks/${subtask1Id}`, {
        data: { is_completed: true },
      })
      await request.put(`/api/subtasks/${subtask2Id}`, {
        data: { is_completed: true },
      })

      const getTodoResponse = await request.get(`/api/todos/${todoId}`)
      const getTodoBody = await getTodoResponse.json()

      const subtasks = getTodoBody.data.subtasks
      expect(subtasks.length).toBe(2)
      const completedCount = subtasks.filter((s: any) => s.is_completed).length
      expect(completedCount).toBe(2)
    })

    test('progress updates when subtask toggled', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('Project')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      const todoItem = page.getByTestId('todo-item')
      await todoItem.getByTestId('subtask-add-button').click()
      await page.getByTestId('subtask-title-input').fill('Step 1')
      await page.getByTestId('subtask-submit').click()
      await page.waitForTimeout(300)

      await expect(todoItem).toContainText('0/1')

      await todoItem.getByTestId('subtask-toggle').first().click()
      await page.waitForTimeout(300)

      await expect(todoItem).toContainText('1/1')
    })
  })

  test.describe('Cascade Delete', () => {
    test('deleting todo cascades to all subtasks', async ({ request }) => {
      const createTodoResponse = await request.post('/api/todos', {
        data: { title: 'Parent task' },
      })
      const createTodoBody = await createTodoResponse.json()
      const todoId = createTodoBody.data.id

      await request.post(`/api/todos/${todoId}/subtasks`, {
        data: { title: 'Subtask 1' },
      })
      await request.post(`/api/todos/${todoId}/subtasks`, {
        data: { title: 'Subtask 2' },
      })

      // Delete todo
      await request.delete(`/api/todos/${todoId}`)

      // Verify todo is deleted
      const getTodoResponse = await request.get(`/api/todos/${todoId}`)
      expect(getTodoResponse.status()).toBe(404)
    })
  })

  test.describe('Subtask Validation', () => {
    test('validates subtask title is required', async ({ request }) => {
      const createTodoResponse = await request.post('/api/todos', {
        data: { title: 'Parent task' },
      })
      const createTodoBody = await createTodoResponse.json()
      const todoId = createTodoBody.data.id

      const response = await request.post(`/api/todos/${todoId}/subtasks`, {
        data: {},
      })

      expect(response.status()).toBe(400)
    })

    test('validates subtask title is not empty', async ({ request }) => {
      const createTodoResponse = await request.post('/api/todos', {
        data: { title: 'Parent task' },
      })
      const createTodoBody = await createTodoResponse.json()
      const todoId = createTodoBody.data.id

      const response = await request.post(`/api/todos/${todoId}/subtasks`, {
        data: { title: '   ' },
      })

      expect(response.status()).toBe(400)
    })

    test('returns 404 when adding subtask to non-existent todo', async ({ request }) => {
      const response = await request.post('/api/todos/non-existent/subtasks', {
        data: { title: 'Subtask' },
      })

      expect(response.status()).toBe(404)
    })
  })

  test.describe('UI Interactions', () => {
    test('user can toggle subtask in UI', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('Task')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      const todoItem = page.getByTestId('todo-item')
      await todoItem.getByTestId('subtask-add-button').click()
      await page.getByTestId('subtask-title-input').fill('Subtask')
      await page.getByTestId('subtask-submit').click()
      await page.waitForTimeout(300)

      // Toggle
      await todoItem.getByTestId('subtask-toggle').first().click()
      await page.waitForTimeout(300)

      // Should show completed
      const subtaskCheckbox = todoItem.getByRole('checkbox').nth(1)
      await expect(subtaskCheckbox).toBeChecked()
    })

    test('user can delete subtask in UI', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('Task')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      const todoItem = page.getByTestId('todo-item')
      await todoItem.getByTestId('subtask-add-button').click()
      await page.getByTestId('subtask-title-input').fill('Delete me')
      await page.getByTestId('subtask-submit').click()
      await page.waitForTimeout(300)

      page.on('dialog', dialog => dialog.accept())
      await todoItem.getByTestId('subtask-delete').first().click()
      await page.waitForTimeout(300)

      // Should be deleted
      const subtaskItems = todoItem.locator('[data-testid="subtask-item"]')
      await expect(subtaskItems).toHaveCount(0)
    })
  })

  test.describe('Edge Cases', () => {
    test('zero subtasks returns 0/0', async ({ request }) => {
      const createTodoResponse = await request.post('/api/todos', {
        data: { title: 'Task with no subtasks' },
      })
      const createTodoBody = await createTodoResponse.json()
      const todoId = createTodoBody.data.id

      const getTodoResponse = await request.get(`/api/todos/${todoId}`)
      const getTodoBody = await getTodoResponse.json()

      expect(getTodoBody.data.subtasks.length).toBe(0)
    })

    test('can have many subtasks', async ({ request }) => {
      const createTodoResponse = await request.post('/api/todos', {
        data: { title: 'Task with many subtasks' },
      })
      const createTodoBody = await createTodoResponse.json()
      const todoId = createTodoBody.data.id

      // Add 50 subtasks
      for (let i = 1; i <= 50; i++) {
        await request.post(`/api/todos/${todoId}/subtasks`, {
          data: { title: `Subtask ${i}` },
        })
      }

      const getTodoResponse = await request.get(`/api/todos/${todoId}`)
      const getTodoBody = await getTodoResponse.json()

      expect(getTodoBody.data.subtasks.length).toBe(50)
    })

    test('subtask titles with special characters', async ({ request }) => {
      const createTodoResponse = await request.post('/api/todos', {
        data: { title: 'Task' },
      })
      const createTodoBody = await createTodoResponse.json()
      const todoId = createTodoBody.data.id

      const specialTitle = 'Subtask with @#$%^&*() symbols 你好'
      const response = await request.post(`/api/todos/${todoId}/subtasks`, {
        data: { title: specialTitle },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.data.title).toBe(specialTitle)
    })
  })
})
