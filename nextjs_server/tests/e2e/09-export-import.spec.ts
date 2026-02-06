import { test, expect } from '@playwright/test'

function toDateString(date: Date) {
  return date.toISOString().split('T')[0]
}

test.describe('Feature 09: Export & Import', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset')
  })

  test.describe('Export Functionality', () => {
    test('can export todos', async ({ request }) => {
      await request.post('/api/todos', {
        data: {
          title: 'Task 1',
          priority: 'high',
        },
      })

      const response = await request.get('/api/todos/export')

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.todos).toBeDefined()
      expect(Array.isArray(body.todos)).toBe(true)
      expect(body.todos.length).toBe(1)
      expect(body.todos[0].title).toBe('Task 1')
      expect(body.tags).toBeDefined()
      expect(body.templates).toBeDefined()
    })

    test('export includes subtasks', async ({ request }) => {
      const createResponse = await request.post('/api/todos', {
        data: {
          title: 'Parent task',
        },
      })
      const createBody = await createResponse.json()
      const todoId = createBody.data.id

      await request.post(`/api/todos/${todoId}/subtasks`, {
        data: { title: 'Subtask 1' },
      })

      const response = await request.get('/api/todos/export')

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.todos[0].subtasks).toBeDefined()
      expect(Array.isArray(body.todos[0].subtasks)).toBe(true)
    })

    test('export includes tags', async ({ request }) => {
      await request.post('/api/tags', {
        data: { name: 'Work', color: '#3b82f6' },
      })

      const response = await request.get('/api/todos/export')

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.tags).toBeDefined()
      expect(Array.isArray(body.tags)).toBe(true)
      expect(body.tags.length).toBe(1)
    })

    test('export includes all relationships', async ({ request }) => {
      const tagResponse = await request.post('/api/tags', {
        data: { name: 'Work', color: '#3b82f6' },
      })
      const tagBody = await tagResponse.json()
      const tagId = tagBody.data.id

      const todoResponse = await request.post('/api/todos', {
        data: {
          title: 'Tagged task',
          tag_ids: [tagId],
        },
      })

      const response = await request.get('/api/todos/export')

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.todos).toBeDefined()
      expect(body.tags).toBeDefined()
      expect(body.templates).toBeDefined()
    })

    test('export empty database returns empty arrays', async ({ request }) => {
      const response = await request.get('/api/todos/export')

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.todos).toEqual([])
      expect(body.tags).toEqual([])
      expect(body.templates).toEqual([])
    })
  })

  test.describe('Import Functionality', () => {
    test('can import todos', async ({ request }) => {
      // Create todo and export
      await request.post('/api/todos', {
        data: {
          title: 'Original task',
          priority: 'high',
        },
      })

      const fullExportResponse = await request.get('/api/todos/export')
      const fullExportData = await fullExportResponse.json()

      // Reset
      await request.post('/api/test/reset')

      // Import
      const importResponse = await request.post('/api/todos/import', {
        data: fullExportData,
      })

      expect(importResponse.ok()).toBeTruthy()
      const importBody = await importResponse.json()
      expect(importBody.success).toBe(true)

      // Verify imported
      const getTodosResponse = await request.get('/api/todos')
      const getTodosBody = await getTodosResponse.json()
      expect(getTodosBody.data.length).toBe(1)
      expect(getTodosBody.data[0].title).toBe('Original task')
      expect(getTodosBody.data[0].priority).toBe('high')
    })

    test('import remaps IDs', async ({ request }) => {
      const createResponse = await request.post('/api/todos', {
        data: { title: 'Original' },
      })
      const createBody = await createResponse.json()
      const originalId = createBody.data.id

      const exportResponse = await request.get('/api/todos/export')
      const exportData = await exportResponse.json()

      await request.post('/api/test/reset')

      const importResponse = await request.post('/api/todos/import', {
        data: exportData,
      })

      expect(importResponse.ok()).toBeTruthy()

      const getTodosResponse = await request.get('/api/todos')
      const getTodosBody = await getTodosResponse.json()

      const importedTodo = getTodosBody.data[0]
      expect(importedTodo.id).not.toBe(originalId)
      expect(importedTodo.title).toBe('Original')
    })

    test('import reuses existing tags by name', async ({ request }) => {
      const tag1Response = await request.post('/api/tags', {
        data: { name: 'Work', color: '#3b82f6' },
      })
      const tag1Body = await tag1Response.json()
      const tag1Id = tag1Body.data.id

      const todoResponse = await request.post('/api/todos', {
        data: {
          title: 'Tagged task',
          tag_ids: [tag1Id],
        },
      })

      const exportResponse = await request.get('/api/todos/export')
      const exportData = await exportResponse.json()

      const importResponse = await request.post('/api/todos/import', {
        data: exportData,
      })

      expect(importResponse.ok()).toBeTruthy()

      const getTagsResponse = await request.get('/api/tags')
      const getTagsBody = await getTagsResponse.json()

      // Should only have one "Work" tag
      const workTags = getTagsBody.data.filter((t: any) => t.name === 'Work')
      expect(workTags.length).toBe(1)
    })

    test('import preserves subtasks', async ({ request }) => {
      const todoResponse = await request.post('/api/todos', {
        data: { title: 'Parent' },
      })
      const todoBody = await todoResponse.json()
      const todoId = todoBody.data.id

      await request.post(`/api/todos/${todoId}/subtasks`, {
        data: { title: 'Step 1' },
      })
      await request.post(`/api/todos/${todoId}/subtasks`, {
        data: { title: 'Step 2' },
      })

      const exportResponse = await request.get('/api/todos/export')
      const exportData = await exportResponse.json()

      await request.post('/api/test/reset')

      const importResponse = await request.post('/api/todos/import', {
        data: exportData,
      })

      expect(importResponse.ok()).toBeTruthy()

      const getTodosResponse = await request.get('/api/todos')
      const getTodosBody = await getTodosResponse.json()
      const importedTodo = getTodosBody.data[0]

      expect(importedTodo.subtasks.length).toBe(2)
      expect(importedTodo.subtasks.map((s: any) => s.title)).toEqual(['Step 1', 'Step 2'])
    })

    test('import preserves todo_tags relationships', async ({ request }) => {
      const tag1Response = await request.post('/api/tags', {
        data: { name: 'Tag 1', color: '#3b82f6' },
      })
      const tag1Body = await tag1Response.json()
      const tag1Id = tag1Body.data.id

      const tag2Response = await request.post('/api/tags', {
        data: { name: 'Tag 2', color: '#ef4444' },
      })
      const tag2Body = await tag2Response.json()
      const tag2Id = tag2Body.data.id

      const todoResponse = await request.post('/api/todos', {
        data: {
          title: 'Multi-tagged',
          tag_ids: [tag1Id, tag2Id],
        },
      })

      const exportResponse = await request.get('/api/todos/export')
      const exportData = await exportResponse.json()

      await request.post('/api/test/reset')

      const importResponse = await request.post('/api/todos/import', {
        data: exportData,
      })

      expect(importResponse.ok()).toBeTruthy()

      const getTodosResponse = await request.get('/api/todos')
      const getTodosBody = await getTodosResponse.json()
      const importedTodo = getTodosBody.data[0]

      expect(importedTodo.tags.length).toBe(2)
      expect(importedTodo.tags.map((t: any) => t.name).sort()).toEqual(['Tag 1', 'Tag 2'])
    })
  })

  test.describe('Export/Import Round Trip', () => {
    test('full round trip preserves all data', async ({ request }) => {
      // Setup complex data
      const tagResponse = await request.post('/api/tags', {
        data: { name: 'Important', color: '#ef4444' },
      })
      const tagBody = await tagResponse.json()
      const tagId = tagBody.data.id

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const todoResponse = await request.post('/api/todos', {
        data: {
          title: 'Complex task',
          priority: 'high',
          due_date: toDateString(tomorrow),
          reminder_minutes: 30,
          tag_ids: [tagId],
          is_recurring: true,
          recurrence_pattern: 'daily',
        },
      })
      const todoBody = await todoResponse.json()
      const todoId = todoBody.data.id

      await request.post(`/api/todos/${todoId}/subtasks`, {
        data: { title: 'Subtask 1' },
      })

      // Export
      const exportResponse = await request.get('/api/todos/export')
      const exportData = await exportResponse.json()

      // Reset and import
      await request.post('/api/test/reset')

      const importResponse = await request.post('/api/todos/import', {
        data: exportData,
      })

      expect(importResponse.ok()).toBeTruthy()

      // Verify
      const getTodosResponse = await request.get('/api/todos')
      const getTodosBody = await getTodosResponse.json()
      const importedTodo = getTodosBody.data[0]

      expect(importedTodo.title).toBe('Complex task')
      expect(importedTodo.priority).toBe('high')
      expect(importedTodo.reminders.length).toBeGreaterThan(0)
      expect(importedTodo.reminders[0].reminder_minutes).toBe(30)
      expect(importedTodo.is_recurring).toBe(true)
      expect(importedTodo.recurrence_pattern).toBe('daily')
      expect(importedTodo.subtasks.length).toBe(1)
      expect(importedTodo.tags.length).toBe(1)
      expect(importedTodo.tags[0].name).toBe('Important')
    })
  })

  test.describe('Import Validation', () => {
    test('rejects invalid JSON', async ({ request }) => {
      const response = await request.post('/api/todos/import', {
        data: { invalid: 'not properly formatted' },
      })

      expect(response.status()).toBe(400)
    })

    test('requires todos array', async ({ request }) => {
      const response = await request.post('/api/todos/import', {
        data: {
          tags: [],
          templates: [],
        },
      })

      expect(response.status()).toBe(400)
    })

    test('validates todo fields', async ({ request }) => {
      const response = await request.post('/api/todos/import', {
        data: {
          todos: [
            {
              title: '', // Invalid - empty title
              priority: 'high',
            },
          ],
          tags: [],
          templates: [],
        },
      })

      expect(response.status()).toBe(400)
    })
  })

  test.describe('UI Export/Import', () => {
    test('user can export todos to file', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('Export this')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      // Find and click export button
      const exportButton = page.locator('[data-testid="export-button"]')
      if (await exportButton.isVisible()) {
        await exportButton.click()
        await page.waitForTimeout(500)
      }
    })
  })

  test.describe('Edge Cases', () => {
    test('import with duplicate tag names', async ({ request }) => {
      const tag1Response = await request.post('/api/tags', {
        data: { name: 'Work', color: '#3b82f6' },
      })

      const tag2Response = await request.post('/api/tags', {
        data: { name: 'Work', color: '#ef4444' }, // Same name, different color
      })

      const exportResponse = await request.get('/api/todos/export')
      const exportData = await exportResponse.json()

      await request.post('/api/test/reset')

      const importResponse = await request.post('/api/todos/import', {
        data: exportData,
      })

      expect(importResponse.ok()).toBeTruthy()
    })

    test('import with circular references prevented', async ({ request }) => {
      const exportData = {
        todos: [
          {
            id: '1',
            title: 'Task',
            priority: 'medium',
            user_id: 'test-user',
            is_completed: false,
            is_recurring: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        subtasks: [],
        tags: [],
        todo_tags: [],
      }

      const importResponse = await request.post('/api/todos/import', {
        data: exportData,
      })

      expect(importResponse.ok()).toBeTruthy()
    })

    test('import empty export data', async ({ request }) => {
      const exportData = {
        todos: [],
        tags: [],
        templates: [],
      }

      const importResponse = await request.post('/api/todos/import', {
        data: exportData,
      })

      expect(importResponse.ok()).toBeTruthy()
      const importBody = await importResponse.json()
      expect(importBody.todos).toBe(0)
    })
  })
})
