import { test, expect } from '@playwright/test'

test.describe('원가 관리', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cost')
  })

  test('페이지가 로드된다', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('원가 관리')
  })

  test('프로젝트 선택 드롭다운이 있다', async ({ page }) => {
    await expect(page.locator('select')).toBeVisible()
  })

  test('양식 다운로드 버튼이 있다', async ({ page }) => {
    await expect(page.getByRole('button', { name: /양식 다운로드/ })).toBeVisible()
  })

  test('엑셀 업로드 버튼이 있다', async ({ page }) => {
    await expect(page.getByRole('button', { name: /엑셀 업로드/ })).toBeVisible()
  })

  test('저장 버튼이 있다', async ({ page }) => {
    await expect(page.getByRole('button', { name: /저장$/ })).toBeVisible()
  })

  test('손익 계산 카드가 있다', async ({ page }) => {
    await expect(page.locator('text=손익 계산')).toBeVisible()
  })
})
