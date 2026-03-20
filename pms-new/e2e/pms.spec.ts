import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'

test.describe('PMS 2.0 E2E', () => {
  test('redirects to signin when not authenticated', async ({ page }) => {
    await page.goto(BASE + '/')
    await expect(page).toHaveURL(/\/signin/)
  })

  test('signin page loads', async ({ page }) => {
    await page.goto(BASE + '/signin')
    await expect(page.getByRole('heading', { name: /PMS 2.0/i })).toBeVisible()
    await expect(page.getByLabel(/이메일/)).toBeVisible()
    await expect(page.getByLabel(/비밀번호/)).toBeVisible()
    await expect(page.getByRole('button', { name: /로그인/ })).toBeVisible()
  })

  test('login with admin credentials', async ({ page }) => {
    await page.goto(BASE + '/signin')
    await page.getByLabel(/이메일/).fill('admin@pms.com')
    await page.getByLabel(/비밀번호/).fill('admin123')
    await page.getByRole('button', { name: /로그인/ }).click()
    await expect(page).toHaveURL(BASE + '/', { timeout: 10000 })
    await expect(page.getByText(/대시보드/)).toBeVisible()
  })

  test('dashboard shows navigation', async ({ page }) => {
    await page.goto(BASE + '/signin')
    await page.getByLabel(/이메일/).fill('admin@pms.com')
    await page.getByLabel(/비밀번호/).fill('admin123')
    await page.getByRole('button', { name: /로그인/ }).click()
    await expect(page).toHaveURL(BASE + '/')

    const sidebarLinks = [
      /대시보드/, /프로젝트/, /영업수주/, /원가관리/,
      /발주관리/, /입고/, /거래처/, /알림/,
    ]
    for (const label of sidebarLinks) {
      await expect(page.getByRole('link', { name: label })).toBeVisible()
    }
  })

  test('projects page loads after login', async ({ page }) => {
    await page.goto(BASE + '/signin')
    await page.getByLabel(/이메일/).fill('admin@pms.com')
    await page.getByLabel(/비밀번호/).fill('admin123')
    await page.getByRole('button', { name: /로그인/ }).click()
    await page.waitForURL(BASE + '/')
    await page.goto(BASE + '/projects')
    await expect(page.getByRole('heading', { name: /프로젝트/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /새 프로젝트/ })).toBeVisible()
  })

  test('create new project', async ({ page }) => {
    await page.goto(BASE + '/signin')
    await page.getByLabel(/이메일/).fill('admin@pms.com')
    await page.getByLabel(/비밀번호/).fill('admin123')
    await page.getByRole('button', { name: /로그인/ }).click()
    await page.waitForURL(BASE + '/')
    await page.goto(BASE + '/projects/new')
    await expect(page.getByRole('heading', { name: /새 프로젝트/ })).toBeVisible()

    const code = `PJT-TEST-${Date.now()}`
    await page.getByLabel(/프로젝트 코드/).fill(code)
    await page.getByLabel(/프로젝트명/).fill('Test Project')
    await page.getByRole('button', { name: /생성/ }).click()

    await expect(page).toHaveURL(new RegExp(`/projects/[^/]+$`), { timeout: 10000 })
    await expect(page.getByText('Test Project')).toBeVisible()
  })

  test('cost management page loads', async ({ page }) => {
    await page.goto(BASE + '/signin')
    await page.getByLabel(/이메일/).fill('admin@pms.com')
    await page.getByLabel(/비밀번호/).fill('admin123')
    await page.getByRole('button', { name: /로그인/ }).click()
    await page.waitForURL(BASE + '/')
    await page.goto(BASE + '/cost')
    await expect(page.getByRole('heading', { name: /원가관리/ })).toBeVisible()
  })

  test('orders page loads', async ({ page }) => {
    await page.goto(BASE + '/signin')
    await page.getByLabel(/이메일/).fill('admin@pms.com')
    await page.getByLabel(/비밀번호/).fill('admin123')
    await page.getByRole('button', { name: /로그인/ }).click()
    await page.waitForURL(BASE + '/')
    await page.goto(BASE + '/orders')
    await expect(page.getByRole('heading', { name: /발주 관리/ })).toBeVisible()
  })

  test('sales page loads', async ({ page }) => {
    await page.goto(BASE + '/signin')
    await page.getByLabel(/이메일/).fill('admin@pms.com')
    await page.getByLabel(/비밀번호/).fill('admin123')
    await page.getByRole('button', { name: /로그인/ }).click()
    await page.waitForURL(BASE + '/')
    await page.goto(BASE + '/sales')
    await expect(page.getByRole('heading', { name: /수주 영업/ })).toBeVisible()
  })

  test('signout works', async ({ page }) => {
    await page.goto(BASE + '/signin')
    await page.getByLabel(/이메일/).fill('admin@pms.com')
    await page.getByLabel(/비밀번호/).fill('admin123')
    await page.getByRole('button', { name: /로그인/ }).click()
    await page.waitForURL(BASE + '/')
    await page.getByRole('button').filter({ has: page.locator('svg') }).last().click()
    await expect(page).toHaveURL(/\/signin/, { timeout: 10000 })
  })
})
