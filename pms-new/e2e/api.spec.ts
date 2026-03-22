import { test, expect } from '@playwright/test'

test.describe('API Tests', () => {
  test('GET /api/projects returns project list', async ({ request }) => {
    // Note: These tests need auth token
    // Skip if not authenticated
    const response = await request.get('/api/projects')
    if (response.status() === 401) {
      console.log('Skipping test: Unauthorized')
      return
    }
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(Array.isArray(data)).toBeTruthy()
  })
  
  test('GET /api/dashboard returns dashboard data', async ({ request }) => {
    // Check dashboard stats endpoint
    const response = await request.get('/api/dashboard')
    if (response.status() === 401) {
      console.log('Skipping test: Unauthorized')
      return
    }

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.stats).toBeDefined()
    expect(data.projectStats).toBeDefined()
  })

  test('GET /api/cost-estimates returns estimates', async ({ request }) => {
    const response = await request.get('/api/cost-estimates')
    if (response.status() === 401) {
      console.log('Skipping test: Unauthorized')
      return
    }

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(Array.isArray(data)).toBeTruthy()
  })
})
