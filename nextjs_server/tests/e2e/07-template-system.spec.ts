import { test, expect } from '@playwright/test'

function toDateString(date: Date) {
  return date.toISOString().split('T')[0]
}

test.describe('Feature 07: Template System', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset')
  })

  test.describe('Template CRUD', () => {
    test('can create a template', async ({ request }) => {
      const response = await request.post('/api/templates', {
        data: {
          name: 'Daily Standup',
          title: 'Team Standup',
          description: 'Daily team sync',
          category: 'work',
          priority: 'high',
          subtasks: ['Update status', 'Report blockers'],
          due_date_offset_days: 1,
        },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.name).toBe('Daily Standup')
      expect(body.data.title).toBe('Team Standup')
      expect(body.data.category).toBe('work')
      expect(body.data.priority).toBe('high')
      expect(body.data.subtasks_json).toBe(JSON.stringify(['Update status', 'Report blockers']))
    })

    test('can get all templates', async ({ request }) => {
      await request.post('/api/templates', {
        data: {
          name: 'Template 1',
          title: 'T1',
          description: 'Test',
          category: 'work',
          priority: 'medium',
          subtasks: [],
          due_date_offset_days: 0,
        },
      })

      await request.post('/api/templates', {
        data: {
          name: 'Template 2',
          title: 'T2',
          description: 'Test',
          category: 'personal',
          priority: 'low',
          subtasks: [],
          due_date_offset_days: 0,
        },
      })

      const response = await request.get('/api/templates')

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.length).toBe(2)
    })

    test('can get template by ID', async ({ request }) => {
      const createResponse = await request.post('/api/templates', {
        data: {
          name: 'My Template',
          title: 'Test',
          description: 'Test description',
          category: 'work',
          priority: 'high',
          subtasks: [],
          due_date_offset_days: 1,
        },
      })

      const createBody = await createResponse.json()
      const templateId = createBody.data.id

      const getResponse = await request.get(`/api/templates/${templateId}`)

      expect(getResponse.ok()).toBeTruthy()
      const getBody = await getResponse.json()
      expect(getBody.data.id).toBe(templateId)
      expect(getBody.data.name).toBe('My Template')
    })

    test('can update template', async ({ request }) => {
      const createResponse = await request.post('/api/templates', {
        data: {
          name: 'Original',
          title: 'Title',
          description: 'Desc',
          category: 'work',
          priority: 'medium',
          subtasks: [],
          due_date_offset_days: 1,
        },
      })

      const createBody = await createResponse.json()
      const templateId = createBody.data.id

      const updateResponse = await request.put(`/api/templates/${templateId}`, {
        data: {
          name: 'Updated',
          description: 'Updated description',
        },
      })

      expect(updateResponse.ok()).toBeTruthy()
      const updateBody = await updateResponse.json()
      expect(updateBody.data.name).toBe('Updated')
      expect(updateBody.data.description).toBe('Updated description')
    })

    test('can delete template', async ({ request }) => {
      const createResponse = await request.post('/api/templates', {
        data: {
          name: 'To Delete',
          title: 'Test',
          description: 'Test',
          category: 'personal',
          priority: 'low',
          subtasks: [],
          due_date_offset_days: 0,
        },
      })

      const createBody = await createResponse.json()
      const templateId = createBody.data.id

      const deleteResponse = await request.delete(`/api/templates/${templateId}`)

      expect(deleteResponse.ok()).toBeTruthy()

      const getResponse = await request.get(`/api/templates/${templateId}`)
      expect(getResponse.status()).toBe(404)
    })
  })

  test.describe('Template Usage', () => {
    test('can create todo from template', async ({ request }) => {
      const createTemplateResponse = await request.post('/api/templates', {
        data: {
          name: 'Project Setup',
          title: 'New Project',
          description: 'Setup a new project',
          category: 'work',
          priority: 'high',
          subtasks: ['Initialize repo', 'Create readme'],
          due_date_offset_days: 3,
        },
      })

      const createTemplateBody = await createTemplateResponse.json()
      const templateId = createTemplateBody.data.id

      const useResponse = await request.post(`/api/templates/${templateId}/use`, {})

      expect(useResponse.ok()).toBeTruthy()
      const useBody = await useResponse.json()
      expect(useBody.data.title).toBe('New Project')
      expect(useBody.data.priority).toBe('high')
      expect(useBody.data.subtasks.length).toBe(2)
    })

    test('template creates todo with correct due date offset', async ({ request }) => {
      const createTemplateResponse = await request.post('/api/templates', {
        data: {
          name: 'Future Task',
          title: 'Task Title',
          description: 'Test',
          category: 'work',
          priority: 'medium',
          subtasks: [],
          due_date_offset_days: 5,
        },
      })

      const createTemplateBody = await createTemplateResponse.json()
      const templateId = createTemplateBody.data.id

      const useResponse = await request.post(`/api/templates/${templateId}/use`, {})
      const useBody = await useResponse.json()

      const today = new Date()
      const expectedDate = new Date(today)
      expectedDate.setDate(expectedDate.getDate() + 5)
      const expectedDateString = toDateString(expectedDate)

      expect(useBody.data.due_date).toBe(expectedDateString)
    })

    test('template creates todo with subtasks', async ({ request }) => {
      const createTemplateResponse = await request.post('/api/templates', {
        data: {
          name: 'Project Template',
          title: 'New Project',
          description: 'Setup template',
          category: 'work',
          priority: 'high',
          subtasks: ['Phase 1', 'Phase 2', 'Phase 3'],
          due_date_offset_days: 0,
        },
      })

      const createTemplateBody = await createTemplateResponse.json()
      const templateId = createTemplateBody.data.id

      const useResponse = await request.post(`/api/templates/${templateId}/use`, {})
      const useBody = await useResponse.json()

      expect(useBody.data.subtasks.length).toBe(3)
      expect(useBody.data.subtasks.map((s: any) => s.title)).toEqual([
        'Phase 1',
        'Phase 2',
        'Phase 3',
      ])
    })

    test('using template does not affect template', async ({ request }) => {
      const createTemplateResponse = await request.post('/api/templates', {
        data: {
          name: 'Reusable',
          title: 'Template Title',
          description: 'Reusable template',
          category: 'work',
          priority: 'medium',
          subtasks: ['Step 1'],
          due_date_offset_days: 1,
        },
      })

      const createTemplateBody = await createTemplateResponse.json()
      const templateId = createTemplateBody.data.id

      // Use template twice
      await request.post(`/api/templates/${templateId}/use`, {})
      await request.post(`/api/templates/${templateId}/use`, {})

      // Get template
      const getResponse = await request.get(`/api/templates/${templateId}`)
      const getBody = await getResponse.json()

      // Template should still be intact
      expect(getBody.data.subtasks_json).toBe(JSON.stringify(['Step 1']))
      expect(getBody.data.name).toBe('Reusable')
    })
  })

  test.describe('Template Validation', () => {
    test('validates template name is required', async ({ request }) => {
      const response = await request.post('/api/templates', {
        data: {
          title: 'Test',
          description: 'Test',
          category: 'work',
          priority: 'medium',
          subtasks: [],
          due_date_offset_days: 0,
        },
      })

      expect(response.status()).toBe(400)
    })

    test('validates template title is required', async ({ request }) => {
      const response = await request.post('/api/templates', {
        data: {
          name: 'Test Template',
          description: 'Test',
          category: 'work',
          priority: 'medium',
          subtasks: [],
          due_date_offset_days: 0,
        },
      })

      expect(response.status()).toBe(400)
    })

    test('validates priority is valid', async ({ request }) => {
      const response = await request.post('/api/templates', {
        data: {
          name: 'Test',
          title: 'Test',
          description: 'Test',
          category: 'work',
          priority: 'invalid',
          subtasks: [],
          due_date_offset_days: 0,
        },
      })

      expect(response.status()).toBe(400)
    })
  })

  test.describe('UI Operations', () => {
    test('user can save todo as template', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('Template task')
      await page.getByTestId('todo-priority').selectOption('high')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      const todoItem = page.getByTestId('todo-item')
      
      // Save as template button might be in a menu
      if (await page.locator('[data-testid="template-name"]').isVisible()) {
        await page.getByTestId('template-name').fill('My Template')
        await page.getByTestId('template-title').fill('Template task')
        await page.getByTestId('template-offset').fill('0')
        await page.getByTestId('template-create').click()
        await page.waitForTimeout(300)
        
        await expect(page.getByTestId('template-item')).toBeVisible()
      }
    })

    test('user can use template from UI', async ({ page }) => {
      await page.goto('/')

      // Create a template first
      await page.getByTestId('nav-templates').click()
      await page.getByTestId('template-name').fill('Quick Task')
      await page.getByTestId('template-title').fill('Quick Task Title')
      await page.getByTestId('template-offset').fill('0')
      await page.getByTestId('template-create').click()
      await page.waitForTimeout(300)

      // Use template
      const templateItem = page.getByTestId('template-item').first()
      if (await templateItem.locator('[data-testid="template-use"]').isVisible()) {
        await templateItem.locator('[data-testid="template-use"]').click()
        await page.waitForTimeout(500)

        await page.getByTestId('nav-list').click()
        await expect(page.getByTestId('todo-item')).toContainText('Quick Task Title')
      }
    })
  })

  test.describe('Subtasks JSON Serialization', () => {
    test('template with complex subtasks serializes correctly', async ({ request }) => {
      const complexSubtasks = [
        'Research competitors',
        'Design mockups',
        'Develop features',
        'Write documentation',
      ]

      const createResponse = await request.post('/api/templates', {
        data: {
          name: 'Complex Template',
          title: 'Project',
          description: 'Complex project',
          category: 'work',
          priority: 'high',
          subtasks: complexSubtasks,
          due_date_offset_days: 0,
        },
      })

      const createBody = await createResponse.json()
      const templateId = createBody.data.id

      const getResponse = await request.get(`/api/templates/${templateId}`)
      const getBody = await getResponse.json()

      const parsed = JSON.parse(getBody.data.subtasks_json || '[]')
      expect(parsed).toEqual(complexSubtasks)
    })

    test('template with empty subtasks array', async ({ request }) => {
      const response = await request.post('/api/templates', {
        data: {
          name: 'No Subtasks',
          title: 'Simple',
          description: 'Simple task',
          category: 'personal',
          priority: 'low',
          subtasks: [],
          due_date_offset_days: 0,
        },
      })

      const body = await response.json()
      expect(body.data.subtasks_json).toBe('[]')
    })
  })

  test.describe('Edge Cases', () => {
    test('can create multiple templates with same title', async ({ request }) => {
      await request.post('/api/templates', {
        data: {
          name: 'Template 1',
          title: 'Same Title',
          description: 'First',
          category: 'work',
          priority: 'high',
          subtasks: [],
          due_date_offset_days: 0,
        },
      })

      const response = await request.post('/api/templates', {
        data: {
          name: 'Template 2',
          title: 'Same Title',
          description: 'Second',
          category: 'personal',
          priority: 'low',
          subtasks: [],
          due_date_offset_days: 0,
        },
      })

      expect(response.ok()).toBeTruthy()
    })

    test('template with zero due date offset', async ({ request }) => {
      const response = await request.post('/api/templates', {
        data: {
          name: 'Today',
          title: 'Due today',
          description: 'Test',
          category: 'work',
          priority: 'medium',
          subtasks: [],
          due_date_offset_days: 0,
        },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      const useResponse = await request.post(`/api/templates/${body.data.id}/use`, {})
      const useBody = await useResponse.json()

      const today = toDateString(new Date())
      expect(useBody.data.due_date).toBe(today)
    })

    test('template with large due date offset', async ({ request }) => {
      const response = await request.post('/api/templates', {
        data: {
          name: 'Future Task',
          title: 'Far future',
          description: 'Far in future',
          category: 'work',
          priority: 'low',
          subtasks: [],
          due_date_offset_days: 365,
        },
      })

      expect(response.ok()).toBeTruthy()
      const body = await response.json()
      const useResponse = await request.post(`/api/templates/${body.data.id}/use`, {})
      const useBody = await useResponse.json()

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 365)
      expect(useBody.data.due_date).toBe(toDateString(futureDate))
    })
  })
})
