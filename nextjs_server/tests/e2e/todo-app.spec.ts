import { test, expect } from '@playwright/test'

test.describe('Todo app smoke tests', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset')
  })

  test('user can create and complete a todo', async ({ page }) => {
    await page.goto('/')

    await page.getByTestId('todo-title').fill('Smoke task')
    await page.getByTestId('todo-add').click()

    const todoItems = page.getByTestId('todo-item')
    await expect(todoItems.first()).toContainText('Smoke task')

    const putResponsePromise = page.waitForResponse(response =>
      response.url().includes('/api/todos/') && response.request().method() === 'PUT'
    )

    await page.getByTestId('todo-toggle').first().click()

    const putResponse = await putResponsePromise
    expect(putResponse.ok()).toBeTruthy()
    await expect(page.getByTestId('completed-count')).toHaveText('1')
  })

  test('calendar page loads with day headers', async ({ page }) => {
    await page.goto('/calendar')

    const monthLabel = page.getByTestId('calendar-month')
    await expect(monthLabel).toBeVisible()

    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    for (const day of dayHeaders) {
      await expect(page.locator(`text=${day}`)).toBeVisible()
    }
  })
})
