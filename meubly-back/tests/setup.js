import { vi } from 'vitest'

// Configuration des variables d'environnement pour les tests
process.env.NODE_ENV = 'test'
process.env.PORT = '5001'

// Mock des variables d'environnement Supabase
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_ANON_KEY = 'test-anon-key'

// Mock de console.log pour réduire le bruit dans les tests
const originalConsoleLog = console.log
const originalConsoleError = console.error

beforeAll(() => {
  console.log = vi.fn()
  console.error = vi.fn()
})

afterAll(() => {
  console.log = originalConsoleLog
  console.error = originalConsoleError
})

// Mock de setTimeout et setInterval pour les tests
global.setTimeout = vi.fn((callback, delay) => {
  return setTimeout(callback, delay)
})

global.setInterval = vi.fn((callback, delay) => {
  return setInterval(callback, delay)
})

// Mock de process.exit pour éviter l'arrêt des tests
process.exit = vi.fn()

// Configuration globale pour les tests
global.testTimeout = 10000
