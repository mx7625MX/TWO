/**
 * tests/setup.ts
 * Jest 测试环境设置
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test'
process.env.LOG_LEVEL = 'error'

// 设置全局超时
jest.setTimeout(10000)

// Mock console 方法
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}

// 设置全局 beforeAll
beforeAll(() => {
  console.log('Starting test suite...')
})

// 设置全局 afterAll
afterAll(() => {
  console.log('Test suite completed.')
})
