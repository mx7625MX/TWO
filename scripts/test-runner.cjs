#!/usr/bin/env node

/**
 * scripts/test-runner.js
 * 自动化测试运行脚本
 */

const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function success(message) {
  log(`✓ ${message}`, 'green')
}

function error(message) {
  log(`✗ ${message}`, 'red')
}

function info(message) {
  log(`ℹ ${message}`, 'blue')
}

// 测试配置
const testConfig = {
  rootDir: path.resolve(__dirname, '..'),
  testDir: path.resolve(__dirname, '../tests'),
  coverageDir: path.resolve(__dirname, '../coverage'),
  reportDir: path.resolve(__dirname, '../test-reports'),
  jestConfig: path.resolve(__dirname, '../jest.config.cjs')
}

// 运行测试
async function runTests(options = {}) {
  const {
    pattern = '**/*.test.ts',
    coverage = true,
    watch = false,
    verbose = false
  } = options

  log('\n' + '='.repeat(60), 'cyan')
  log('  Meme Master Pro - Test Runner', 'cyan')
  log('='.repeat(60) + '\n', 'cyan')

  // 确保目录存在
  const dirs = [testConfig.coverageDir, testConfig.reportDir]
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })

  // 构建 Jest 命令
  const args = [
    'jest',
    '--config',
    testConfig.jestConfig
  ]

  if (pattern !== '**/*.test.ts') {
    args.push('--testPathPattern', pattern)
  }

  if (coverage) {
    args.push('--coverage')
  }

  if (watch) {
    args.push('--watch')
  }

  if (verbose) {
    args.push('--verbose')
  }

  info(`Running tests: ${pattern}`)
  if (coverage) info('Coverage: enabled')
  if (watch) info('Watch mode: enabled')

  log('\n')

  return new Promise((resolve, reject) => {
    const jestProcess = spawn('npx', args, {
      cwd: testConfig.rootDir,
      stdio: 'inherit',
      shell: true
    })

    jestProcess.on('close', (code) => {
      log('\n')
      if (code === 0) {
        success('All tests passed!')
        resolve(code)
      } else {
        error('Tests failed!')
        reject(new Error(`Tests exited with code ${code}`))
      }
    })

    jestProcess.on('error', (err) => {
      error(`Failed to run tests: ${err.message}`)
      reject(err)
    })
  })
}

// 运行特定测试套件
async function runTestSuite(suite, options = {}) {
  const patterns = {
    launch: 'launch',
    bundle: 'bundle',
    integration: 'integration',
    unit: 'unit',
    all: ''
  }

  const pattern = patterns[suite] || ''
  await runTests({ ...options, pattern })
}

// 清理测试环境
function cleanup() {
  const dirs = [testConfig.coverageDir]
  dirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true })
      success(`Cleaned up: ${dir}`)
    }
  })
}

// 命令行接口
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'run'

  try {
    switch (command) {
      case 'run':
      case 'test':
        await runTests()
        break

      case 'launch':
        await runTestSuite('launch')
        break

      case 'bundle':
        await runTestSuite('bundle')
        break

      case 'integration':
        await runTestSuite('integration')
        break

      case 'unit':
        await runTestSuite('unit')
        break

      case 'all':
        await runTestSuite('all', { coverage: true })
        break

      case 'watch':
        await runTests({ watch: true, coverage: false })
        break

      case 'coverage':
        await runTests({ coverage: true })
        break

      case 'clean':
        cleanup()
        break

      case 'help':
        log('\nUsage:', 'cyan')
        log('  node scripts/test-runner.js [command]', 'reset')
        log('\nCommands:', 'cyan')
        log('  run, test         Run all tests', 'reset')
        log('  launch            Run launch tests', 'reset')
        log('  bundle            Run bundle tests', 'reset')
        log('  integration       Run integration tests', 'reset')
        log('  unit              Run unit tests', 'reset')
        log('  all               Run all tests with coverage', 'reset')
        log('  watch             Run tests in watch mode', 'reset')
        log('  coverage          Run tests with coverage report', 'reset')
        log('  clean             Clean up test artifacts', 'reset')
        log('  help              Show this help message', 'reset')
        log('\n')
        break

      default:
        error(`Unknown command: ${command}`)
        info('Run "node scripts/test-runner.js help" for usage information')
        process.exit(1)
    }
  } catch (err) {
    error(err.message)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
}

module.exports = {
  runTests,
  runTestSuite,
  cleanup
}
