import { test, expect } from '@playwright/test'

test.describe('발주 관리', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/orders')
  })

  test('페이지가 로드된다', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('발주 관리')
  })

  test('발주 목록 테이블이 있다', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible()
  })

  test('새 발주서 버튼이 있다', async ({ page }) => {
    await expect(page.getByRole('link', { name: /새 발주서/ })).toBeVisible()
  })

  test('Excel 내보내기 버튼이 있다', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Excel 내보내기/ })).toBeVisible()
  })

  test('통계 카드가 있다', async ({ page }) => {
    await expect(page.locator('text=전체')).toBeVisible()
    await expect(page.locator('text=총 금액')).toBeVisible()
  })
})

test.describe('거래처 관리', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/vendors')
  })

  test('페이지가 로드된다', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('거래처')
  })
})

test.describe('월별 원가 입력', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cost/monthly')
  })

  test('페이지가 로드된다', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('월별 원가 입력')
  })

  test('원가 입력 폼이 있다', async ({ page }) => {
    await expect(page.locator('form')).toBeVisible()
  })

  test('프로젝트 선택 드롭다운이 있다', async ({ page }) => {
    await expect(page.locator('text=프로젝트')).toBeVisible()
  })
})

test.describe('알림', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notifications')
  })

  test('페이지가 로드된다', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('알림')
  })

  test('알림 목록이 있다', async ({ page }) => {
    await expect(page.locator('[class*="divide-y"]')).toBeVisible()
  })
})
