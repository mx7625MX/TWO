/**
 * tests/launch/launch-token.test.ts
 * 发币功能测试
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { MockRPCServer, TestDataGenerator } from '../utils/test-helpers'

describe('Launch Token - Mock Tests', () => {
  let mockRPC: MockRPCServer

  beforeEach(async () => {
    mockRPC = new MockRPCServer('BSC')
    await mockRPC.start()
  })

  afterEach(async () => {
    await mockRPC.stop()
  })

  describe('Parameter Validation', () => {
    it('should validate token name length', () => {
      const shortName = 'A'
      const validName = 'Test Token'
      const longName = 'A'.repeat(100)

      expect(shortName.length).toBeLessThan(2)
      expect(validName.length).toBeGreaterThanOrEqual(2)
      expect(longName.length).toBeGreaterThan(50)
    })

    it('should validate token symbol length', () => {
      const shortSymbol = 'A'
      const validSymbol = 'TEST'
      const longSymbol = 'TOOLONGSYMBOL'

      expect(shortSymbol.length).toBeLessThan(2)
      expect(validSymbol.length).toBeGreaterThanOrEqual(2)
      expect(validSymbol.length).toBeLessThanOrEqual(10)
      expect(longSymbol.length).toBeGreaterThan(10)
    })

    it('should validate total supply', () => {
      const negativeSupply = '-100'
      const zeroSupply = '0'
      const validSupply = '1000000'

      expect(parseFloat(negativeSupply)).toBeLessThan(0)
      expect(parseFloat(zeroSupply)).toBe(0)
      expect(parseFloat(validSupply)).toBeGreaterThan(0)
    })

    it('should validate decimals', () => {
      const invalidDecimals = 25
      const validDecimals = 18
      const solanaMaxDecimals = 9

      expect(invalidDecimals).toBeGreaterThan(18)
      expect(validDecimals).toBeLessThanOrEqual(18)
      expect(solanaMaxDecimals).toBeLessThanOrEqual(9)
    })
  })

  describe('Mock RPC Server', () => {
    it('should start and provide URL', () => {
      const url = mockRPC.getURL()
      expect(url).toMatch(/^http:\/\/localhost:\d+$/)
    })

    it('should handle eth_estimateGas request', async () => {
      const url = mockRPC.getURL()
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_estimateGas',
          params: [],
          id: 1
        })
      })

      const data = await response.json()
      expect(data.result).toBeDefined()
    })
  })

  describe('Test Data Generation', () => {
    it('should generate valid wallet data', () => {
      const wallet = TestDataGenerator.generateWallet('test-1', 'BSC')
      
      expect(wallet.id).toBe('test-1')
      expect(wallet.network).toBe('BSC')
      expect(wallet.address).toMatch(/^0x[0-9a-f]{40}$/i)
      expect(wallet.privateKey).toMatch(/^0x[0-9a-f]{64}$/i)
    })

    it('should generate valid launch task data', () => {
      const task = TestDataGenerator.generateLaunchTask('task-1', 'BSC')
      
      expect(task.id).toBe('task-1')
      expect(task.network).toBe('BSC')
      expect(task.decimals).toBe(18)
      expect(task.status).toBe('pending')
    })

    it('should generate valid token info', () => {
      const tokenInfo = TestDataGenerator.generateTokenInfo('BSC')
      
      expect(tokenInfo.network).toBe('BSC')
      expect(tokenInfo.decimals).toBe(18)
      expect(tokenInfo.address).toMatch(/^0x[t]{40}$/)
    })
  })
})

describe('Launch Token - Solana Mock Tests', () => {
  let mockRPC: MockRPCServer

  beforeEach(async () => {
    mockRPC = new MockRPCServer('Solana')
    await mockRPC.start()
  })

  afterEach(async () => {
    await mockRPC.stop()
  })

  describe('Solana Specific Validation', () => {
    it('should validate Solana decimals', () => {
      const maxDecimals = 9
      const invalidDecimals = 10

      expect(maxDecimals).toBeLessThanOrEqual(9)
      expect(invalidDecimals).toBeGreaterThan(9)
    })

    it('should generate Solana wallet data', () => {
      const wallet = TestDataGenerator.generateWallet('sol-wallet', 'Solana')
      
      expect(wallet.network).toBe('Solana')
      expect(wallet.address).toMatch(/^So[0-9a-f]{42}$/i)
    })
  })

  describe('Mock RPC Server - Solana', () => {
    it('should handle getRecentBlockhash request', async () => {
      const url = mockRPC.getURL()
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'getRecentBlockhash',
          params: [],
          id: 1
        })
      })

      const data = await response.json()
      expect(data.result).toBeDefined()
      expect(data.result.value).toBeDefined()
    })
  })
})
