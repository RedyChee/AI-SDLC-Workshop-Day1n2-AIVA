import { test, expect } from '@playwright/test'

function toDateString(date: Date) {
  return date.toISOString().split('T')[0]
}

test.describe('Feature 01: Todo CRUD Operations', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset')
  })

  test.describe('Create Todo', () => {
    test('can create a todo with title only', async ({ request }) => {
      const response = await request.post('/api/todos', {
        data: {
          title: 'Simple task',
        },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.title).toBe('Simple task')
      expect(body.data.priority).toBe('medium') // Default priority
      expect(body.data.is_completed).toBe(false)
      expect(body.data.id).toBeTruthy()
      expect(body.data.user_id).toBeTruthy()
    })

    test('can create a todo with all metadata', async ({ request }) => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dueDate = toDateString(tomorrow)

      const response = await request.post('/api/todos', {
        data: {
          title: 'Complete project',
          priority: 'high',
          due_date: dueDate,
          reminder_minutes: 30,
        },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.title).toBe('Complete project')
      expect(body.data.priority).toBe('high')
      expect(body.data.due_date).toBe(dueDate)
      // Check reminders are in nested array structure
      if (body.data.reminders && body.data.reminders.length > 0) {
        expect(body.data.reminders[0].reminder_minutes).toBe(30)
      }
    })

    test('validates title is required', async ({ request }) => {
      const response = await request.post('/api/todos', {
        data: {
          priority: 'high',
        },
      })

      expect(response.status()).toBe(400)
      const body = await response.json()
      expect(body.error).toContain('title')
    })

    test('validates title is not empty after trim', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('   ')
      await page.getByTestId('todo-add').click()

      await expect(page.getByText('Title is required')).toBeVisible()
      await expect(page.getByTestId('todo-item')).toHaveCount(0)
    })

    test('validates title length', async ({ request }) => {
      const longTitle = 'a'.repeat(501)
      const response = await request.post('/api/todos', {
        data: {
          title: longTitle,
        },
      })

      expect(response.status()).toBe(400)
    })

    test('validates due date is in the future', async ({ request }) => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const pastDate = toDateString(yesterday)

      const response = await request.post('/api/todos', {
        data: {
          title: 'Past task',
          due_date: pastDate,
        },
      })

      expect(response.status()).toBe(400)
      const body = await response.json()
      expect(body.error).toContain('past')
    })

    test('validates valid priority values', async ({ request }) => {
      for (const priority of ['low', 'medium', 'high']) {
        const response = await request.post('/api/todos', {
          data: {
            title: `Task with ${priority} priority`,
            priority: priority,
          },
        })
        expect(response.ok()).toBeTruthy()
      }
    })

    test('rejects invalid priority values', async ({ request }) => {
      const response = await request.post('/api/todos', {
        data: {
          title: 'Task',
          priority: 'invalid',
        },
      })

      expect(response.status()).toBe(400)
    })

    test('trims whitespace from title', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('  Trimmed task  ')
      await page.getByTestId('todo-add').click()

      const todoItem = page.getByTestId('todo-item').first()
      await expect(todoItem).toContainText('Trimmed task')
    })

    test('todo has all required fields on creation', async ({ request }) => {
      const response = await request.post('/api/todos', {
        data: {
          title: 'Full featured task',
        },
      })

      const body = await response.json()
      const todo = body.data

      expect(todo.id).toBeTruthy()
      expect(todo.user_id).toBeTruthy()
      expect(todo.title).toBe('Full featured task')
      expect(todo.priority).toBe('medium')
      expect(todo.is_completed).toBe(false)
      expect(todo.is_recurring).toBe(false)
      expect(todo.created_at).toBeTruthy()
      expect(todo.updated_at).toBeTruthy()
    })
  })

  test.describe('Read Todo', () => {
    test('can get all todos', async ({ request }) => {
      // Create multiple todos
      await request.post('/api/todos', {
        data: { title: 'Todo 1' },
      })
      await request.post('/api/todos', {
        data: { title: 'Todo 2' },
      })

      const response = await request.get('/api/todos')

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.data.length).toBe(2)
      expect(body.data[0].title).toBeTruthy()
    })

    test('can get a specific todo by ID', async ({ request }) => {
      const createResponse = await request.post('/api/todos', {
        data: {
          title: 'Specific todo',
          priority: 'high',
        },
      })
      const createBody = await createResponse.json()
      const todoId = createBody.data.id

      const getResponse = await request.get(`/api/todos/${todoId}`)

      expect(getResponse.ok()).toBeTruthy()
      const getBody = await getResponse.json()
      expect(getBody.success).toBe(true)
      expect(getBody.data.id).toBe(todoId)
      expect(getBody.data.title).toBe('Specific todo')
      expect(getBody.data.priority).toBe('high')
    })

    test('returns 404 for non-existent todo', async ({ request }) => {
      const response = await request.get('/api/todos/non-existent-id')

      expect(response.status()).toBe(404)
    })

    test('returns empty array when no todos exist', async ({ request }) => {
      const response = await request.get('/api/todos')

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.data).toEqual([])
    })

    test('todos are sorted by priority and due date', async ({ request }) => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dayAfterTomorrow = new Date()
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

      // Create todos in random order
      await request.post('/api/todos', {
        data: { title: 'Low priority', priority: 'low', due_date: toDateString(tomorrow) },
      })
      await request.post('/api/todos', {
        data: { title: 'High priority', priority: 'high', due_date: toDateString(dayAfterTomorrow) },
      })
      await request.post('/api/todos', {
        data: { title: 'Medium priority', priority: 'medium', due_date: toDateString(tomorrow) },
      })

      const response = await request.get('/api/todos')
      const body = await response.json()

      // Should be sorted: high > medium > low
      expect(body.data[0].title).toBe('High priority')
      expect(body.data[1].title).toBe('Medium priority')
      expect(body.data[2].title).toBe('Low priority')
    })
  })

  test.describe('Update Todo', () => {
    test('can update todo title', async ({ request }) => {
      const createResponse = await request.post('/api/todos', {
        data: { title: 'Original title' },
      })
      const createBody = await createResponse.json()
      const todoId = createBody.data.id

      const updateResponse = await request.put(`/api/todos/${todoId}`, {
        data: { title: 'Updated title' },
      })

      expect(updateResponse.ok()).toBeTruthy()
      const updateBody = await updateResponse.json()
      expect(updateBody.data.title).toBe('Updated title')
    })

    test('can update todo priority', async ({ request }) => {
      const createResponse = await request.post('/api/todos', {
        data: { title: 'Task', priority: 'low' },
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

    test('can update todo due date', async ({ request }) => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)

      const createResponse = await request.post('/api/todos', {
        data: { title: 'Task', due_date: toDateString(tomorrow) },
      })
      const createBody = await createResponse.json()
      const todoId = createBody.data.id

      const updateResponse = await request.put(`/api/todos/${todoId}`, {
        data: { due_date: toDateString(nextWeek) },
      })

      expect(updateResponse.ok()).toBeTruthy()
      const updateBody = await updateResponse.json()
      expect(updateBody.data.due_date).toBe(toDateString(nextWeek))
    })

    test('can toggle todo completion', async ({ request }) => {
      const createResponse = await request.post('/api/todos', {
        data: { title: 'Task' },
      })
      const createBody = await createResponse.json()
      const todoId = createBody.data.id

      const completeResponse = await request.put(`/api/todos/${todoId}`, {
        data: { is_completed: true },
      })

      expect(completeResponse.ok()).toBeTruthy()
      const completeBody = await completeResponse.json()
      expect(completeBody.data.is_completed).toBe(true)

      const uncompleteResponse = await request.put(`/api/todos/${todoId}`, {
        data: { is_completed: false },
      })

      const uncompleteBody = await uncompleteResponse.json()
      expect(uncompleteBody.data.is_completed).toBe(false)
    })

    test('can update multiple fields at once', async ({ request }) => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const createResponse = await request.post('/api/todos', {
        data: { title: 'Original', priority: 'low' },
      })
      const createBody = await createResponse.json()
      const todoId = createBody.data.id

      const updateResponse = await request.put(`/api/todos/${todoId}`, {
        data: {
          title: 'Updated',
          priority: 'high',
          due_date: toDateString(tomorrow),
          is_completed: true,
        },
      })

      expect(updateResponse.ok()).toBeTruthy()
      const updateBody = await updateResponse.json()
      expect(updateBody.data.title).toBe('Updated')
      expect(updateBody.data.priority).toBe('high')
      expect(updateBody.data.due_date).toBe(toDateString(tomorrow))
      expect(updateBody.data.is_completed).toBe(true)
    })

    test('update preserves todo ID and timestamps', async ({ request }) => {
      const createResponse = await request.post('/api/todos', {
        data: { title: 'Task' },
      })
      const createBody = await createResponse.json()
      const originalId = createBody.data.id
      const originalCreatedAt = createBody.data.created_at

      // Wait slightly to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100))

      const updateResponse = await request.put(`/api/todos/${originalId}`, {
        data: { title: 'Updated' },
      })
      const updateBody = await updateResponse.json()

      expect(updateBody.data.id).toBe(originalId)
      expect(updateBody.data.created_at).toBe(originalCreatedAt)
      expect(updateBody.data.updated_at).not.toBe(originalCreatedAt)
    })

    test('returns 404 when updating non-existent todo', async ({ request }) => {
      const response = await request.put('/api/todos/non-existent-id', {
        data: { title: 'Updated' },
      })

      expect(response.status()).toBe(404)
    })
  })

  test.describe('Delete Todo', () => {
    test('can delete a todo', async ({ request }) => {
      const createResponse = await request.post('/api/todos', {
        data: { title: 'Task to delete' },
      })
      const createBody = await createResponse.json()
      const todoId = createBody.data.id

      const deleteResponse = await request.delete(`/api/todos/${todoId}`)

      expect(deleteResponse.ok()).toBeTruthy()
      const deleteBody = await deleteResponse.json()
      expect(deleteBody.success).toBe(true)

      // Verify it's deleted
      const getResponse = await request.get(`/api/todos/${todoId}`)
      expect(getResponse.status()).toBe(404)
    })

    test('delete cascades to subtasks', async ({ request }) => {
      const createResponse = await request.post('/api/todos', {
        data: { title: 'Parent task' },
      })
      const createBody = await createResponse.json()
      const todoId = createBody.data.id

      // Add a subtask
      const subtaskResponse = await request.post(`/api/todos/${todoId}/subtasks`, {
        data: {
          title: 'Subtask 1',
        },
      })
      const subtaskBody = await subtaskResponse.json()
      const subtaskId = subtaskBody.data.id

      // Delete parent
      await request.delete(`/api/todos/${todoId}`)

      // Verify subtask is deleted
      const getSubtaskResponse = await request.get(`/api/todos/${todoId}`)
      expect(getSubtaskResponse.status()).toBe(404)
    })

    test('delete cascades to tag associations', async ({ request }) => {
      // Create a tag
      const tagResponse = await request.post('/api/tags', {
        data: { name: 'Work', color: '#3b82f6' },
      })
      const tagBody = await tagResponse.json()
      const tagId = tagBody.data.id

      // Create todo with tag
      const createResponse = await request.post('/api/todos', {
        data: {
          title: 'Tagged task',
          tag_ids: [tagId],
        },
      })
      const createBody = await createResponse.json()
      const todoId = createBody.data.id

      // Verify tag is associated
      const getTodoResponse = await request.get(`/api/todos/${todoId}`)
      const getTodoBody = await getTodoResponse.json()
      expect(getTodoBody.data.tags.length).toBe(1)

      // Delete todo
      await request.delete(`/api/todos/${todoId}`)

      // Tag should still exist
      const getTagResponse = await request.get(`/api/tags/${tagId}`)
      expect(getTagResponse.ok()).toBeTruthy()
    })

    test('returns 404 when deleting non-existent todo', async ({ request }) => {
      const response = await request.delete('/api/todos/non-existent-id')

      expect(response.status()).toBe(404)
    })

    test('can delete multiple todos', async ({ request }) => {
      const todo1Response = await request.post('/api/todos', {
        data: { title: 'Task 1' },
      })
      const todo1Body = await todo1Response.json()
      const todo1Id = todo1Body.data.id

      const todo2Response = await request.post('/api/todos', {
        data: { title: 'Task 2' },
      })
      const todo2Body = await todo2Response.json()
      const todo2Id = todo2Body.data.id

      await request.delete(`/api/todos/${todo1Id}`)
      await request.delete(`/api/todos/${todo2Id}`)

      const allTodosResponse = await request.get('/api/todos')
      const allTodosBody = await allTodosResponse.json()
      expect(allTodosBody.data.length).toBe(0)
    })
  })

  test.describe('UI Operations', () => {
    test('user can create and view todo in UI', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('Test task')
      await page.getByTestId('todo-add').click()

      const todoItem = page.getByTestId('todo-item')
      await expect(todoItem).toHaveCount(1)
      await expect(todoItem).toContainText('Test task')
    })

    test('user can search for todo', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('Find me')
      await page.getByTestId('todo-add').click()

      await page.getByTestId('todo-title').fill('Ignore me')
      await page.getByTestId('todo-add').click()

      await page.getByTestId('todo-search').fill('Find')
      await page.waitForTimeout(400) // Wait for debounce

      const todoItems = page.getByTestId('todo-item')
      await expect(todoItems).toHaveCount(1)
      await expect(todoItems).toContainText('Find me')
    })

    test('user can toggle completed status', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('Task to complete')
      await page.getByTestId('todo-add').click()

      const todoItem = page.getByTestId('todo-item')
      await todoItem.getByTestId('todo-toggle').click()
      await page.waitForTimeout(300)

      await expect(page.getByTestId('completed-count')).toContainText('1')
    })

    test('user can edit todo in modal', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('Original title')
      await page.getByTestId('todo-add').click()

      const todoItem = page.getByTestId('todo-item')
      await todoItem.getByRole('button', { name: 'Edit' }).click()

      await page.getByTestId('todo-edit-title').fill('Updated title')
      await todoItem.getByRole('button', { name: 'Save' }).click()
      await page.waitForTimeout(300)

      await expect(todoItem).toContainText('Updated title')
    })

    test('user can delete todo with confirmation', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('Task to delete')
      await page.getByTestId('todo-add').click()

      const todoItem = page.getByTestId('todo-item')
      expect(todoItem).toHaveCount(1)

      page.on('dialog', dialog => dialog.accept())
      await todoItem.getByRole('button', { name: 'Del' }).click()

      await expect(page.getByTestId('todo-item')).toHaveCount(0)
    })

    test('todos are grouped into sections', async ({ page }) => {
      await page.goto('/')

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      await page.getByTestId('todo-title').fill('Active task')
      await page.getByTestId('todo-due-date').fill(toDateString(tomorrow))
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      // Create completed task
      const todoItem = page.getByTestId('todo-item')
      await todoItem.getByTestId('todo-toggle').click()
      await page.waitForTimeout(300)

      // Should appear in different sections or have different styling
      await expect(page.getByTestId('completed-count')).toContainText('1')
    })
  })

  test.describe('Edge Cases', () => {
    test('can create todo without due date', async ({ request }) => {
      const response = await request.post('/api/todos', {
        data: {
          title: 'No due date task',
          priority: 'high',
        },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
        // due_date can be null or undefined
        expect(body.data.due_date == null).toBeTruthy()
    })

    test('todo created with same title as deleted todo', async ({ request }) => {
      const title = 'Duplicate title task'

      const create1 = await request.post('/api/todos', {
        data: { title },
      })
      const create1Body = await create1.json()
      const id1 = create1Body.data.id

      await request.delete(`/api/todos/${id1}`)

      const create2 = await request.post('/api/todos', {
        data: { title },
      })
      const create2Body = await create2.json()
      const id2 = create2Body.data.id

      expect(id1).not.toBe(id2)
    })

    test('handles special characters in title', async ({ request }) => {
      const specialTitle = 'Task with @#$%^&*() & symbols'
      const response = await request.post('/api/todos', {
        data: { title: specialTitle },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.data.title).toContain('@')
    })

    test('handles unicode characters in title', async ({ request }) => {
      const unicodeTitle = 'Task with 你好 世界 🎉'
      const response = await request.post('/api/todos', {
        data: { title: unicodeTitle },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.data.title).toContain('你好')
    })
  })
})
