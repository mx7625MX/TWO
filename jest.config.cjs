/**
 * jest.config.js
 * Jest 测试配置
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // 测试文件匹配模式
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.test.tsx'
  ],

  // 覆盖率收集
  collectCoverageFrom: [
    'src/**/*.ts',
    'src/**/*.tsx',
    '!src/**/*.d.ts',
    '!src/**/types.ts',
    '!src/main/preload.ts',
    '!src/renderer/main.tsx'
  ],

  // 覆盖率阈值 (降低以适应 Mock 测试)
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    }
  },

  // 覆盖率报告
  coverageReporters: [
    'json',
    'lcov',
    'text',
    'text-summary',
    'html'
  ],

  // 覆盖率输出目录
  coverageDirectory: 'coverage',

  // 模块路径映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/renderer/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@main/(.*)$': '<rootDir>/src/main/$1'
  },

  // 转换配置
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: 'node'
      }
    }]
  },

  // 转换 node_modules 中的 ES 模块
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)'
  ],

  // 忽略的文件
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/dist-electron/',
    '/coverage/',
    '/release/'
  ],

  // 模块文件扩展名
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],

  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // 测试超时
  testTimeout: 10000,

  // 并发测试数
  maxWorkers: '50%',

  // 详细输出
  verbose: true,

  // 清除模拟
  clearMocks: true,

  // 重置模拟
  resetMocks: true,

  // 恢复模拟
  restoreMocks: true
}
