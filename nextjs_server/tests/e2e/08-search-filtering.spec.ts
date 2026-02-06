import { test, expect } from '@playwright/test'

function toDateString(date: Date) {
  return date.toISOString().split('T')[0]
}

test.describe('Feature 08: Search & Filtering', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset')
  })

  test.describe('Text Search', () => {
    test('can search todos by title', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('Buy groceries')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('todo-title').fill('Call mom')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('todo-search').fill('groceries')
      await page.waitForTimeout(400) // Wait for debounce

      const todoItems = page.getByTestId('todo-item')
      await expect(todoItems).toHaveCount(1)
      await expect(todoItems).toContainText('Buy groceries')
    })

    test('search is case-insensitive', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('BUY GROCERIES')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('todo-search').fill('buy')
      await page.waitForTimeout(400)

      const todoItems = page.getByTestId('todo-item')
      await expect(todoItems).toHaveCount(1)
    })

    test('search filters as you type', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('JavaScript')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('todo-title').fill('Python')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      // Type partial search
      await page.getByTestId('todo-search').fill('Java')
      await page.waitForTimeout(400)

      const todoItems = page.getByTestId('todo-item')
      await expect(todoItems).toHaveCount(1)
      await expect(todoItems).toContainText('JavaScript')
    })

    test('clearing search shows all todos', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('Task 1')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('todo-title').fill('Task 2')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('todo-search').fill('Task 1')
      await page.waitForTimeout(400)
      await expect(page.getByTestId('todo-item')).toHaveCount(1)

      await page.getByTestId('todo-search').fill('')
      await page.waitForTimeout(400)
      await expect(page.getByTestId('todo-item')).toHaveCount(2)
    })

    test('no matches returns empty list', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('Existing task')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('todo-search').fill('nonexistent')
      await page.waitForTimeout(400)

      const todoItems = page.getByTestId('todo-item')
      await expect(todoItems).toHaveCount(0)
    })

    test('search partial matches', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('testing framework')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('todo-search').fill('test')
      await page.waitForTimeout(400)

      const todoItems = page.getByTestId('todo-item')
      await expect(todoItems).toHaveCount(1)
      await expect(todoItems).toContainText('testing framework')
    })
  })

  test.describe('Priority Filtering', () => {
    test('can filter by high priority', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('High priority')
      await page.getByTestId('todo-priority').selectOption('high')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('todo-title').fill('Low priority')
      await page.getByTestId('todo-priority').selectOption('low')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('priority-filter').selectOption('high')
      await page.waitForTimeout(400)

      const todoItems = page.getByTestId('todo-item')
      await expect(todoItems).toHaveCount(1)
      await expect(todoItems).toContainText('High priority')
    })

    test('can filter by low priority', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('High')
      await page.getByTestId('todo-priority').selectOption('high')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('todo-title').fill('Low')
      await page.getByTestId('todo-priority').selectOption('low')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('priority-filter').selectOption('low')
      await page.waitForTimeout(400)

      const todoItems = page.getByTestId('todo-item')
      await expect(todoItems).toHaveCount(1)
      await expect(todoItems).toContainText('Low')
    })

    test('clearing priority filter shows all', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('Task 1')
      await page.getByTestId('todo-priority').selectOption('high')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('todo-title').fill('Task 2')
      await page.getByTestId('todo-priority').selectOption('low')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('priority-filter').selectOption('high')
      await page.waitForTimeout(400)
      await expect(page.getByTestId('todo-item')).toHaveCount(1)

      await page.getByTestId('priority-filter').selectOption('')
      await page.waitForTimeout(400)
      await expect(page.getByTestId('todo-item')).toHaveCount(2)
    })
  })

  test.describe('Tag Filtering', () => {
    test('can filter todos by tag', async ({ page, request }) => {
      // Create a tag
      const tagResponse = await request.post('/api/tags', {
        data: { name: 'Urgent', color: '#ef4444' },
      })
      const tagBody = await tagResponse.json()
      const tagId = tagBody.data.id

      await page.goto('/')

      // Create todos with different tags
      await page.getByTestId('todo-title').fill('Urgent task')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('todo-title').fill('Regular task')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      // Add tag to first todo
      const firstTodo = page.getByTestId('todo-item').first()
      await firstTodo.getByTestId('todo-tag-picker').selectOption(tagId)
      await page.waitForTimeout(300)

      // Filter by tag
      await firstTodo.getByTestId('todo-tag-badge').click()
      await page.waitForTimeout(400)

      const todoItems = page.getByTestId('todo-item')
      await expect(todoItems).toHaveCount(1)
      await expect(todoItems).toContainText('Urgent task')
    })

    test('can click tag badge to filter', async ({ page, request }) => {
      const tagResponse = await request.post('/api/tags', {
        data: { name: 'Work', color: '#3b82f6' },
      })
      const tagBody = await tagResponse.json()
      const tagId = tagBody.data.id

      await page.goto('/')

      await page.getByTestId('todo-title').fill('Tagged task')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      const todoItem = page.getByTestId('todo-item').first()
      await todoItem.getByTestId('todo-tag-picker').selectOption(tagId)
      await page.waitForTimeout(300)

      // Click the tag badge
      const tagBadge = todoItem.locator('[data-testid="todo-tag-badge"]').first()
      await expect(tagBadge).toBeVisible()
      await tagBadge.click()
      await page.waitForTimeout(400)

      await expect(page.getByTestId('todo-item')).toHaveCount(1)
    })
  })

  test.describe('Combined Filters', () => {
    test('search and priority filter combine with AND logic', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('High priority meeting')
      await page.getByTestId('todo-priority').selectOption('high')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('todo-title').fill('High priority task')
      await page.getByTestId('todo-priority').selectOption('high')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('todo-title').fill('Low priority meeting')
      await page.getByTestId('todo-priority').selectOption('low')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      // Filter by "meeting" + high priority
      await page.getByTestId('todo-search').fill('meeting')
      await page.waitForTimeout(400)
      await page.getByTestId('priority-filter').selectOption('high')
      await page.waitForTimeout(400)

      const todoItems = page.getByTestId('todo-item')
      await expect(todoItems).toHaveCount(1)
      await expect(todoItems).toContainText('High priority meeting')
    })

    test('multiple filters narrow results correctly', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('Project high')
      await page.getByTestId('todo-priority').selectOption('high')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('todo-title').fill('Project low')
      await page.getByTestId('todo-priority').selectOption('low')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('todo-title').fill('Task high')
      await page.getByTestId('todo-priority').selectOption('high')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      // Search + filter
      await page.getByTestId('todo-search').fill('Project')
      await page.waitForTimeout(400)
      await expect(page.getByTestId('todo-item')).toHaveCount(2)

      await page.getByTestId('priority-filter').selectOption('high')
      await page.waitForTimeout(400)
      await expect(page.getByTestId('todo-item')).toHaveCount(1)
      await expect(page.getByTestId('todo-item')).toContainText('Project high')
    })
  })

  test.describe('Search Debouncing', () => {
    test('search updates with debounce delay', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('Delayed search')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      const searchInput = page.getByTestId('todo-search')

      // Type quickly
      await searchInput.fill('D')
      await page.waitForTimeout(100)
      
      await searchInput.fill('De')
      await page.waitForTimeout(100)
      
      await searchInput.fill('Del')
      
      // Should wait for debounce before filtering
      await page.waitForTimeout(400)

      const todoItems = page.getByTestId('todo-item')
      await expect(todoItems).toHaveCount(1)
    })
  })

  test.describe('Edge Cases', () => {
    test('empty search string shows all todos', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('One')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('todo-title').fill('Two')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('todo-search').fill('search')
      await page.waitForTimeout(400)
      await expect(page.getByTestId('todo-item')).toHaveCount(0)

      await page.getByTestId('todo-search').fill('')
      await page.waitForTimeout(400)
      await expect(page.getByTestId('todo-item')).toHaveCount(2)
    })

    test('unicode characters in search', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('开会')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('todo-search').fill('开')
      await page.waitForTimeout(400)

      const todoItems = page.getByTestId('todo-item')
      await expect(todoItems).toHaveCount(1)
    })

    test('special characters in search', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('Email: test@example.com')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('todo-search').fill('@')
      await page.waitForTimeout(400)

      const todoItems = page.getByTestId('todo-item')
      await expect(todoItems).toHaveCount(1)
    })

    test('whitespace in search', async ({ page }) => {
      await page.goto('/')

      await page.getByTestId('todo-title').fill('Two word task')
      await page.getByTestId('todo-add').click()
      await page.waitForTimeout(300)

      await page.getByTestId('todo-search').fill('two word')
      await page.waitForTimeout(400)

      const todoItems = page.getByTestId('todo-item')
      await expect(todoItems).toHaveCount(1)
    })
  })
})
