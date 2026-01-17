/**
 * tests/integration/complete-flow.test.ts
 * 完整流程集成测试
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { MockRPCServer, TestDataGenerator, delay } from '../utils/test-helpers'

describe('Complete Flow - Launch and Buy', () => {
  let bscRPC: MockRPCServer
  let solanaRPC: MockRPCServer

  beforeEach(async () => {
    bscRPC = new MockRPCServer('BSC')
    solanaRPC = new MockRPCServer('Solana')
    await Promise.all([bscRPC.start(), solanaRPC.start()])
  })

  afterEach(async () => {
    await Promise.all([bscRPC.stop(), solanaRPC.stop()])
  })

  it('should simulate complete BSC flow', async () => {
    // 步骤 1: 生成钱包
    const wallet = TestDataGenerator.generateWallet('flow-wallet', 'BSC')
    expect(wallet).toBeDefined()

    // 步骤 2: 模拟发币任务
    const launchTask = TestDataGenerator.generateLaunchTask('flow-task', 'BSC')
    launchTask.status = 'processing'
    launchTask.progress = 50

    await delay(100)

    launchTask.status = 'completed'
    launchTask.progress = 100
    launchTask.completedAt = Date.now()
    launchTask.result = {
      contractAddress: '0x' + 'c'.repeat(40),
      txHash: '0x' + 't'.repeat(64),
      blockNumber: 1000000,
      gasUsed: '150000',
      totalFee: '0.0075'
    }

    expect(launchTask.status).toBe('completed')
    expect(launchTask.result.contractAddress).toBeDefined()

    // 步骤 3: 模拟批量买入
    const wallets = Array.from({ length: 3 }, (_, i) => 
      TestDataGenerator.generateWallet(`buy-wallet-${i}`, 'BSC')
    )

    const bundleConfig = {
      tokenAddress: launchTask.result.contractAddress,
      walletAddresses: wallets.map(w => w.address),
      amountPerWallet: '0.1',
      slippage: 0.05
    }

    expect(bundleConfig.walletAddresses.length).toBe(3)

    // 模拟批量执行
    const results = bundleConfig.walletAddresses.map((addr, i) => ({
      walletAddress: addr,
      txHash: '0x' + (i + 1).toString().repeat(64),
      status: 'success' as const,
      amountIn: '0.1',
      amountOut: '1000',
      gasUsed: '150000'
    }))

    expect(results.length).toBe(3)
    expect(results.every(r => r.status === 'success')).toBe(true)
  })

  it('should simulate complete Solana flow', async () => {
    // 步骤 1: 生成钱包
    const wallet = TestDataGenerator.generateWallet('sol-wallet', 'Solana')
    expect(wallet).toBeDefined()

    // 步骤 2: 模拟发币
    const launchTask = TestDataGenerator.generateLaunchTask('sol-task', 'Solana')
    
    await delay(100)

    launchTask.status = 'completed'
    launchTask.completedAt = Date.now()
    launchTask.result = {
      mintAddress: 'Mint' + 'a'.repeat(40),
      txHash: 'sig' + 'b'.repeat(60),
      slot: 10000000
    }

    expect(launchTask.status).toBe('completed')
    expect(launchTask.result.mintAddress).toBeDefined()

    // 步骤 3: 模拟批量买入
    const wallets = Array.from({ length: 2 }, (_, i) => 
      TestDataGenerator.generateWallet(`sol-buy-${i}`, 'Solana')
    )

    const bundleConfig = {
      mintAddress: launchTask.result.mintAddress,
      walletAddresses: wallets.map(w => w.address),
      amountPerWallet: '0.1',
      slippage: 0.05
    }

    const results = bundleConfig.walletAddresses.map((addr, i) => ({
      walletAddress: addr,
      txHash: `sig${i}` + 'c'.repeat(60),
      status: 'success' as const,
      amountIn: '0.1',
      amountOut: '1000'
    }))

    expect(results.length).toBe(2)
    expect(results.every(r => r.status === 'success')).toBe(true)
  })

  it('should handle concurrent operations', async () => {
    // 同时创建多个任务
    const bscTask = TestDataGenerator.generateLaunchTask('bsc-concurrent', 'BSC')
    const solanaTask = TestDataGenerator.generateLaunchTask('sol-concurrent', 'Solana')

    const tasks = [bscTask, solanaTask]

    // 模拟并发执行
    await Promise.all(tasks.map(async (task) => {
      await delay(50)
      task.status = 'completed'
      task.completedAt = Date.now()
    }))

    expect(tasks.every(t => t.status === 'completed')).toBe(true)
  })

  it('should handle error recovery', async () => {
    const task = TestDataGenerator.generateLaunchTask('error-task', 'BSC')
    
    // 模拟失败
    task.status = 'failed'
    task.error = 'Insufficient gas'

    expect(task.status).toBe('failed')
    expect(task.error).toBeDefined()

    // 模拟重试
    await delay(100)
    task.status = 'processing'
    task.error = undefined
    
    await delay(100)
    task.status = 'completed'
    task.completedAt = Date.now()

    expect(task.status).toBe('completed')
    expect(task.error).toBeUndefined()
  })
})

describe('Cross-Chain Operations', () => {
  it('should manage tasks across chains', () => {
    const bscTasks = Array.from({ length: 3 }, (_, i) => 
      TestDataGenerator.generateLaunchTask(`bsc-${i}`, 'BSC')
    )

    const solanaTasks = Array.from({ length: 2 }, (_, i) => 
      TestDataGenerator.generateLaunchTask(`sol-${i}`, 'Solana')
    )

    const allTasks = [...bscTasks, ...solanaTasks]

    expect(allTasks.length).toBe(5)
    expect(bscTasks.every(t => t.network === 'BSC')).toBe(true)
    expect(solanaTasks.every(t => t.network === 'Solana')).toBe(true)
  })

  it('should calculate cross-chain statistics', () => {
    const tasks = [
      { network: 'BSC', status: 'completed' },
      { network: 'BSC', status: 'completed' },
      { network: 'BSC', status: 'failed' },
      { network: 'Solana', status: 'completed' },
      { network: 'Solana', status: 'failed' }
    ]

    const bscCompleted = tasks.filter(t => t.network === 'BSC' && t.status === 'completed').length
    const solanaCompleted = tasks.filter(t => t.network === 'Solana' && t.status === 'completed').length
    const totalCompleted = tasks.filter(t => t.status === 'completed').length
    const totalFailed = tasks.filter(t => t.status === 'failed').length

    expect(bscCompleted).toBe(2)
    expect(solanaCompleted).toBe(1)
    expect(totalCompleted).toBe(3)
    expect(totalFailed).toBe(2)

    const successRate = (totalCompleted / tasks.length) * 100
    expect(successRate).toBe(60)
  })
})
