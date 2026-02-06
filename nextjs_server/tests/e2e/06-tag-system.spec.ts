import { test, expect } from '@playwright/test'

test.describe('Feature 06: Tag System', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset')
  })

  test.describe('Tag Management', () => {
    test('can create a tag with default color', async ({ request }) => {
      const response = await request.post('/api/tags', {
        data: {
          name: 'Work',
        },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.name).toBe('Work')
      expect(body.data.color).toBe('#3b82f6') // Default blue color
      expect(body.data.id).toBeTruthy()
      expect(body.data.user_id).toBeTruthy()
    })

    test('can create a tag with custom color', async ({ request }) => {
      const response = await request.post('/api/tags', {
        data: {
          name: 'Personal',
          color: '#ef4444', // Red color
        },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.name).toBe('Personal')
      expect(body.data.color).toBe('#ef4444')
    })

    test('can get all tags', async ({ request }) => {
      // Create two tags
      await request.post('/api/tags', {
        data: { name: 'Work', color: '#3b82f6' },
      })
      await request.post('/api/tags', {
        data: { name: 'Personal', color: '#ef4444' },
      })

      const response = await request.get('/api/tags')
      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.length).toBe(2)
      expect(body.data[0].name).toBeTruthy()
      expect(body.data[0].color).toBeTruthy()
    })

    test('can get a tag by ID', async ({ request }) => {
      const createResponse = await request.post('/api/tags', {
        data: { name: 'Finance', color: '#10b981' },
      })
      const createBody = await createResponse.json()
      const tagId = createBody.data.id

      const response = await request.get(`/api/tags/${tagId}`)
      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.id).toBe(tagId)
      expect(body.data.name).toBe('Finance')
      expect(body.data.color).toBe('#10b981')
    })

    test('can update a tag name', async ({ request }) => {
      const createResponse = await request.post('/api/tags', {
        data: { name: 'Wrk', color: '#3b82f6' },
      })
      const createBody = await createResponse.json()
      const tagId = createBody.data.id

      const updateResponse = await request.patch(`/api/tags/${tagId}`, {
        data: { name: 'Work' },
      })
      expect(updateResponse.ok()).toBeTruthy()
      const updateBody = await updateResponse.json()
      expect(updateBody.success).toBe(true)
      expect(updateBody.data.name).toBe('Work')
      expect(updateBody.data.color).toBe('#3b82f6') // Color unchanged
    })

    test('can update a tag color', async ({ request }) => {
      const createResponse = await request.post('/api/tags', {
        data: { name: 'Work', color: '#3b82f6' },
      })
      const createBody = await createResponse.json()
      const tagId = createBody.data.id

      const updateResponse = await request.patch(`/api/tags/${tagId}`, {
        data: { color: '#6366f1' },
      })
      expect(updateResponse.ok()).toBeTruthy()
      const updateBody = await updateResponse.json()
      expect(updateBody.success).toBe(true)
      expect(updateBody.data.name).toBe('Work') // Name unchanged
      expect(updateBody.data.color).toBe('#6366f1')
    })

    test('can update both tag name and color', async ({ request }) => {
      const createResponse = await request.post('/api/tags', {
        data: { name: 'Temp', color: '#000000' },
      })
      const createBody = await createResponse.json()
      const tagId = createBody.data.id

      const updateResponse = await request.patch(`/api/tags/${tagId}`, {
        data: { name: 'Important', color: '#ef4444' },
      })
      expect(updateResponse.ok()).toBeTruthy()
      const updateBody = await updateResponse.json()
      expect(updateBody.success).toBe(true)
      expect(updateBody.data.name).toBe('Important')
      expect(updateBody.data.color).toBe('#ef4444')
    })

    test('can delete a tag', async ({ request }) => {
      const createResponse = await request.post('/api/tags', {
        data: { name: 'ToDelete', color: '#3b82f6' },
      })
      const createBody = await createResponse.json()
      const tagId = createBody.data.id

      const deleteResponse = await request.delete(`/api/tags/${tagId}`)
      expect(deleteResponse.ok()).toBeTruthy()
      const deleteBody = await deleteResponse.json()
      expect(deleteBody.success).toBe(true)

      // Verify tag is deleted
      const getResponse = await request.get(`/api/tags/${tagId}`)
      expect(getResponse.status()).toBe(404)
    })

    test('returns 404 for non-existent tag', async ({ request }) => {
      const response = await request.get('/api/tags/non-existent-id')
      expect(response.status()).toBe(404)
    })

    test('validates tag name is required', async ({ request }) => {
      const response = await request.post('/api/tags', {
        data: { color: '#3b82f6' },
      })
      expect(response.status()).toBe(400)
    })

    test('validates tag name length', async ({ request }) => {
      const longName = 'a'.repeat(51)
      const response = await request.post('/api/tags', {
        data: { name: longName },
      })
      expect(response.status()).toBe(400)
    })

    test('validates color format', async ({ request }) => {
      const response = await request.post('/api/tags', {
        data: {
          name: 'Test',
          color: 'invalid-color',
        },
      })
      expect(response.status()).toBe(400)
    })

    test('validates color is hex with 6 characters', async ({ request }) => {
      const response = await request.post('/api/tags', {
        data: {
          name: 'Test',
          color: '#fff', // Too short
        },
      })
      expect(response.status()).toBe(400)
    })
  })

  test.describe('Tag Association with Todos', () => {
    test('can add a tag to a todo', async ({ request }) => {
      // Create a tag
      const tagResponse = await request.post('/api/tags', {
        data: { name: 'Work', color: '#3b82f6' },
      })
      const tagBody = await tagResponse.json()
      const tagId = tagBody.data.id

      // Create a todo
      const todoResponse = await request.post('/api/todos', {
        data: {
          title: 'Test Todo',
          priority: 'medium',
        },
      })
      const todoBody = await todoResponse.json()
      const todoId = todoBody.data.id

      // Add tag to todo
      const addTagResponse = await request.post(`/api/todos/${todoId}/tags`, {
        data: { tag_id: tagId },
      })
      expect(addTagResponse.ok()).toBeTruthy()
      const addTagBody = await addTagResponse.json()
      expect(addTagBody.success).toBe(true)
      expect(addTagBody.data.tags.length).toBe(1)
      expect(addTagBody.data.tags[0].id).toBe(tagId)
      expect(addTagBody.data.tags[0].name).toBe('Work')
    })

    test('can create a todo with tags', async ({ request }) => {
      // Create tags
      const tag1Response = await request.post('/api/tags', {
        data: { name: 'Work', color: '#3b82f6' },
      })
      const tag1Body = await tag1Response.json()
      const tag1Id = tag1Body.data.id

      const tag2Response = await request.post('/api/tags', {
        data: { name: 'Urgent', color: '#ef4444' },
      })
      const tag2Body = await tag2Response.json()
      const tag2Id = tag2Body.data.id

      // Create todo with tags
      const todoResponse = await request.post('/api/todos', {
        data: {
          title: 'Test Todo',
          priority: 'high',
          tag_ids: [tag1Id, tag2Id],
        },
      })
      expect(todoResponse.ok()).toBeTruthy()
      const todoBody = await todoResponse.json()
      expect(todoBody.success).toBe(true)
      expect(todoBody.data.tags.length).toBe(2)
      expect(todoBody.data.tags.map((t: any) => t.name).sort()).toEqual(['Urgent', 'Work'])
    })

    test('can add multiple tags to a todo', async ({ request }) => {
      // Create tags
      const tag1Response = await request.post('/api/tags', {
        data: { name: 'Work', color: '#3b82f6' },
      })
      const tag1Body = await tag1Response.json()
      const tag1Id = tag1Body.data.id

      const tag2Response = await request.post('/api/tags', {
        data: { name: 'Personal', color: '#ef4444' },
      })
      const tag2Body = await tag2Response.json()
      const tag2Id = tag2Body.data.id

      // Create todo
      const todoResponse = await request.post('/api/todos', {
        data: {
          title: 'Test Todo',
          priority: 'medium',
        },
      })
      const todoBody = await todoResponse.json()
      const todoId = todoBody.data.id

      // Add first tag
      await request.post(`/api/todos/${todoId}/tags`, {
        data: { tag_id: tag1Id },
      })

      // Add second tag
      const addTag2Response = await request.post(`/api/todos/${todoId}/tags`, {
        data: { tag_id: tag2Id },
      })
      const addTag2Body = await addTag2Response.json()
      expect(addTag2Body.success).toBe(true)
      expect(addTag2Body.data.tags.length).toBe(2)
    })

    test('does not duplicate tags when adding same tag twice', async ({ request }) => {
      // Create a tag
      const tagResponse = await request.post('/api/tags', {
        data: { name: 'Work', color: '#3b82f6' },
      })
      const tagBody = await tagResponse.json()
      const tagId = tagBody.data.id

      // Create todo
      const todoResponse = await request.post('/api/todos', {
        data: {
          title: 'Test Todo',
          priority: 'medium',
        },
      })
      const todoBody = await todoResponse.json()
      const todoId = todoBody.data.id

      // Add tag twice
      await request.post(`/api/todos/${todoId}/tags`, {
        data: { tag_id: tagId },
      })
      const addTag2Response = await request.post(`/api/todos/${todoId}/tags`, {
        data: { tag_id: tagId },
      })
      const addTag2Body = await addTag2Response.json()
      expect(addTag2Body.success).toBe(true)
      expect(addTag2Body.data.tags.length).toBe(1) // Should still be 1
    })

    test('can remove a tag from a todo', async ({ request }) => {
      // Create a tag
      const tagResponse = await request.post('/api/tags', {
        data: { name: 'Work', color: '#3b82f6' },
      })
      const tagBody = await tagResponse.json()
      const tagId = tagBody.data.id

      // Create todo with tag
      const todoResponse = await request.post('/api/todos', {
        data: {
          title: 'Test Todo',
          priority: 'medium',
          tag_ids: [tagId],
        },
      })
      const todoBody = await todoResponse.json()
      const todoId = todoBody.data.id

      // Remove tag from todo
      const removeTagResponse = await request.delete(`/api/todos/${todoId}/tags`, {
        data: { tag_id: tagId },
      })
      expect(removeTagResponse.ok()).toBeTruthy()
      const removeTagBody = await removeTagResponse.json()
      expect(removeTagBody.success).toBe(true)
      expect(removeTagBody.data.tags.length).toBe(0)
    })

    test('returns error when adding non-existent tag to todo', async ({ request }) => {
      // Create todo
      const todoResponse = await request.post('/api/todos', {
        data: {
          title: 'Test Todo',
          priority: 'medium',
        },
      })
      const todoBody = await todoResponse.json()
      const todoId = todoBody.data.id

      // Try to add non-existent tag
      const addTagResponse = await request.post(`/api/todos/${todoId}/tags`, {
        data: { tag_id: 'non-existent-tag-id' },
      })
      expect(addTagResponse.status()).toBe(404)
    })

    test('returns error when adding tag to non-existent todo', async ({ request }) => {
      // Create a tag
      const tagResponse = await request.post('/api/tags', {
        data: { name: 'Work', color: '#3b82f6' },
      })
      const tagBody = await tagResponse.json()
      const tagId = tagBody.data.id

      // Try to add tag to non-existent todo
      const addTagResponse = await request.post('/api/todos/non-existent-todo-id/tags', {
        data: { tag_id: tagId },
      })
      expect(addTagResponse.status()).toBe(404)
    })
  })

  test.describe('Tag Cascade Delete', () => {
    test('deleting a tag removes it from all todos', async ({ request }) => {
      // Create a tag
      const tagResponse = await request.post('/api/tags', {
        data: { name: 'Work', color: '#3b82f6' },
      })
      const tagBody = await tagResponse.json()
      const tagId = tagBody.data.id

      // Create two todos with the tag
      const todo1Response = await request.post('/api/todos', {
        data: {
          title: 'Todo 1',
          priority: 'medium',
          tag_ids: [tagId],
        },
      })
      const todo1Body = await todo1Response.json()
      const todo1Id = todo1Body.data.id

      const todo2Response = await request.post('/api/todos', {
        data: {
          title: 'Todo 2',
          priority: 'medium',
          tag_ids: [tagId],
        },
      })
      const todo2Body = await todo2Response.json()
      const todo2Id = todo2Body.data.id

      // Delete the tag
      await request.delete(`/api/tags/${tagId}`)

      // Verify both todos no longer have the tag
      const getTodo1Response = await request.get(`/api/todos/${todo1Id}`)
      const getTodo1Body = await getTodo1Response.json()
      expect(getTodo1Body.data.tags.length).toBe(0)

      const getTodo2Response = await request.get(`/api/todos/${todo2Id}`)
      const getTodo2Body = await getTodo2Response.json()
      expect(getTodo2Body.data.tags.length).toBe(0)
    })

    test('deleting a tag does not affect other tags on todos', async ({ request }) => {
      // Create two tags
      const tag1Response = await request.post('/api/tags', {
        data: { name: 'Work', color: '#3b82f6' },
      })
      const tag1Body = await tag1Response.json()
      const tag1Id = tag1Body.data.id

      const tag2Response = await request.post('/api/tags', {
        data: { name: 'Personal', color: '#ef4444' },
      })
      const tag2Body = await tag2Response.json()
      const tag2Id = tag2Body.data.id

      // Create todo with both tags
      const todoResponse = await request.post('/api/todos', {
        data: {
          title: 'Test Todo',
          priority: 'medium',
          tag_ids: [tag1Id, tag2Id],
        },
      })
      const todoBody = await todoResponse.json()
      const todoId = todoBody.data.id

      // Delete first tag
      await request.delete(`/api/tags/${tag1Id}`)

      // Verify second tag is still there
      const getTodoResponse = await request.get(`/api/todos/${todoId}`)
      const getTodoBody = await getTodoResponse.json()
      expect(getTodoBody.data.tags.length).toBe(1)
      expect(getTodoBody.data.tags[0].id).toBe(tag2Id)
      expect(getTodoBody.data.tags[0].name).toBe('Personal')
    })
  })

  test.describe('Tag Data Integrity', () => {
    test('tag has all required fields', async ({ request }) => {
      const response = await request.post('/api/tags', {
        data: {
          name: 'Work',
          color: '#3b82f6',
        },
      })
      const body = await response.json()
      const tag = body.data

      expect(tag.id).toBeTruthy()
      expect(typeof tag.id).toBe('string')
      expect(tag.user_id).toBeTruthy()
      expect(typeof tag.user_id).toBe('string')
      expect(tag.name).toBe('Work')
      expect(typeof tag.name).toBe('string')
      expect(tag.color).toBe('#3b82f6')
      expect(typeof tag.color).toBe('string')
      expect(tag.created_at).toBeTruthy()
      expect(typeof tag.created_at).toBe('string')
      expect(tag.updated_at).toBeTruthy()
      expect(typeof tag.updated_at).toBe('string')
    })

    test('tag updated_at changes on update', async ({ request }) => {
      const createResponse = await request.post('/api/tags', {
        data: { name: 'Work', color: '#3b82f6' },
      })
      const createBody = await createResponse.json()
      const tagId = createBody.data.id
      const originalUpdatedAt = createBody.data.updated_at

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100))

      const updateResponse = await request.patch(`/api/tags/${tagId}`, {
        data: { name: 'Work Updated' },
      })
      const updateBody = await updateResponse.json()
      const newUpdatedAt = updateBody.data.updated_at

      expect(newUpdatedAt).not.toBe(originalUpdatedAt)
    })

    test('todo retains tags after completion', async ({ request }) => {
      // Create a tag
      const tagResponse = await request.post('/api/tags', {
        data: { name: 'Work', color: '#3b82f6' },
      })
      const tagBody = await tagResponse.json()
      const tagId = tagBody.data.id

      // Create todo with tag
      const todoResponse = await request.post('/api/todos', {
        data: {
          title: 'Test Todo',
          priority: 'medium',
          tag_ids: [tagId],
        },
      })
      const todoBody = await todoResponse.json()
      const todoId = todoBody.data.id

      // Complete todo
      const updateResponse = await request.patch(`/api/todos/${todoId}`, {
        data: { is_completed: true },
      })
      const updateBody = await updateResponse.json()
      expect(updateBody.data.tags.length).toBe(1)
      expect(updateBody.data.tags[0].id).toBe(tagId)
    })

    test('updating todo tags replaces all tags', async ({ request }) => {
      // Create three tags
      const tag1Response = await request.post('/api/tags', {
        data: { name: 'Work', color: '#3b82f6' },
      })
      const tag1Body = await tag1Response.json()
      const tag1Id = tag1Body.data.id

      const tag2Response = await request.post('/api/tags', {
        data: { name: 'Personal', color: '#ef4444' },
      })
      const tag2Body = await tag2Response.json()
      const tag2Id = tag2Body.data.id

      const tag3Response = await request.post('/api/tags', {
        data: { name: 'Urgent', color: '#f59e0b' },
      })
      const tag3Body = await tag3Response.json()
      const tag3Id = tag3Body.data.id

      // Create todo with first two tags
      const todoResponse = await request.post('/api/todos', {
        data: {
          title: 'Test Todo',
          priority: 'medium',
          tag_ids: [tag1Id, tag2Id],
        },
      })
      const todoBody = await todoResponse.json()
      const todoId = todoBody.data.id

      // Update todo with different tags
      const updateResponse = await request.patch(`/api/todos/${todoId}`, {
        data: { tag_ids: [tag3Id] },
      })
      const updateBody = await updateResponse.json()
      expect(updateBody.data.tags.length).toBe(1)
      expect(updateBody.data.tags[0].id).toBe(tag3Id)
      expect(updateBody.data.tags[0].name).toBe('Urgent')
    })
  })

  test.describe('Tag Color Validation', () => {
    test('accepts valid 6-character hex color with hash', async ({ request }) => {
      const validColors = ['#000000', '#ffffff', '#3b82f6', '#ef4444', '#ABCDEF', '#abcdef']

      for (const color of validColors) {
        const response = await request.post('/api/tags', {
          data: {
            name: `Test ${color}`,
            color: color,
          },
        })
        expect(response.ok()).toBeTruthy()
        const body = await response.json()
        expect(body.data.color.toLowerCase()).toBe(color.toLowerCase())
      }
    })

    test('rejects invalid color formats', async ({ request }) => {
      const invalidColors = [
        'red',
        'rgb(255, 0, 0)',
        '#fff',
        '000000',
        '#gggggg',
        '#12345',
        '#1234567',
      ]

      for (const color of invalidColors) {
        const response = await request.post('/api/tags', {
          data: {
            name: 'Test',
            color: color,
          },
        })
        expect(response.status()).toBe(400)
      }
    })
  })

  test.describe('Tag User Isolation', () => {
    test('tags are user-specific', async ({ request }) => {
      // All tags should have user_id set to MOCK_USER_ID
      const createResponse = await request.post('/api/tags', {
        data: { name: 'Work', color: '#3b82f6' },
      })
      const createBody = await createResponse.json()
      expect(createBody.data.user_id).toBe('user-1')
    })
  })

  test.describe('Tag Export & Import', () => {
    test('tags are included in export', async ({ request }) => {
      // Create a tag
      await request.post('/api/tags', {
        data: { name: 'Work', color: '#3b82f6' },
      })

      const exportResponse = await request.get('/api/todos/export')
      expect(exportResponse.ok()).toBeTruthy()
      const exportBody = await exportResponse.json()

      expect(exportBody.tags).toBeDefined()
      expect(Array.isArray(exportBody.tags)).toBe(true)
      expect(exportBody.tags.length).toBeGreaterThan(0)
      expect(exportBody.tags[0].name).toBe('Work')
      expect(exportBody.tags[0].color).toBe('#3b82f6')
    })

    test('can import tags', async ({ request }) => {
      // Create initial data
      const tagResponse = await request.post('/api/tags', {
        data: { name: 'Work', color: '#3b82f6' },
      })
      const tagBody = await tagResponse.json()
      const tagId = tagBody.data.id

      await request.post('/api/todos', {
        data: {
          title: 'Test Todo',
          priority: 'medium',
          tag_ids: [tagId],
        },
      })

      // Export
      const exportResponse = await request.get('/api/todos/export')
      const exportBody = await exportResponse.json()

      // Reset
      await request.post('/api/test/reset')

      // Import
      const importResponse = await request.post('/api/todos/import', {
        data: exportBody,
      })
      expect(importResponse.ok()).toBeTruthy()

      // Verify tags were imported
      const tagsResponse = await request.get('/api/tags')
      const tagsBody = await tagsResponse.json()
      expect(tagsBody.data.length).toBeGreaterThan(0)
    })
  })

  test.describe('Edge Cases', () => {
    test('can create tags with same name but different colors', async ({ request }) => {
      // Note: This tests current behavior. In production, you may want unique names per user
      const tag1Response = await request.post('/api/tags', {
        data: { name: 'Priority', color: '#ef4444' },
      })
      expect(tag1Response.ok()).toBeTruthy()

      const tag2Response = await request.post('/api/tags', {
        data: { name: 'Priority', color: '#3b82f6' },
      })
      expect(tag2Response.ok()).toBeTruthy()
    })

    test('handles empty tags array on todo', async ({ request }) => {
      const todoResponse = await request.post('/api/todos', {
        data: {
          title: 'Test Todo',
          priority: 'medium',
          tag_ids: [],
        },
      })
      expect(todoResponse.ok()).toBeTruthy()
      const todoBody = await todoResponse.json()
      expect(todoBody.data.tags).toEqual([])
    })

    test('can remove all tags from a todo', async ({ request }) => {
      // Create tags
      const tag1Response = await request.post('/api/tags', {
        data: { name: 'Work', color: '#3b82f6' },
      })
      const tag1Body = await tag1Response.json()
      const tag1Id = tag1Body.data.id

      // Create todo with tag
      const todoResponse = await request.post('/api/todos', {
        data: {
          title: 'Test Todo',
          priority: 'medium',
          tag_ids: [tag1Id],
        },
      })
      const todoBody = await todoResponse.json()
      const todoId = todoBody.data.id

      // Remove all tags
      const updateResponse = await request.patch(`/api/todos/${todoId}`, {
        data: { tag_ids: [] },
      })
      const updateBody = await updateResponse.json()
      expect(updateBody.data.tags).toEqual([])
    })
  })
})
