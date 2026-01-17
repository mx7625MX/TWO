/**
 * tests/utils/test-helpers.ts
 * 测试辅助工具
 */

import { EventEmitter } from 'events'
import { createServer, Server, IncomingMessage, ServerResponse } from 'http'

// ==================== Mock RPC 服务器 ====================

export class MockRPCServer extends EventEmitter {
  private server: Server | null = null
  private network: 'BSC' | 'Solana'
  private port: number = 0
  private responses: Map<string, any> = new Map()

  constructor(network: 'BSC' | 'Solana') {
    super()
    this.network = network
    this.setupDefaultResponses()
  }

  private setupDefaultResponses(): void {
    // BSC 响应
    if (this.network === 'BSC') {
      this.responses.set('eth_getBlockByNumber', {
        jsonrpc: '2.0',
        id: 1,
        result: {
          number: '0x' + (0x1000000).toString(16),
          hash: '0x' + 'a'.repeat(64),
          gasUsed: '0x' + '100000'.toString(16),
          gasLimit: '0x' + '200000'.toString(16)
        }
      })

      this.responses.set('eth_estimateGas', {
        jsonrpc: '2.0',
        id: 1,
        result: '0x' + '5208'.toString(16) // 21000 gas
      })

      this.responses.set('eth_getBalance', {
        jsonrpc: '2.0',
        id: 1,
        result: '0x' + (10 * 1e18).toString(16) // 10 BNB
      })

      this.responses.set('eth_chainId', {
        jsonrpc: '2.0',
        id: 1,
        result: '0x38' // BSC chain ID
      })

      this.responses.set('eth_sendTransaction', {
        jsonrpc: '2.0',
        id: 1,
        result: '0x' + 'b'.repeat(64)
      })

      this.responses.set('eth_getTransactionReceipt', {
        jsonrpc: '2.0',
        id: 1,
        result: {
          transactionHash: '0x' + 'b'.repeat(64),
          blockNumber: '0x' + '1000000'.toString(16),
          gasUsed: '0x' + '5208'.toString(16),
          status: '0x1'
        }
      })
    }

    // Solana 响应
    if (this.network === 'Solana') {
      this.responses.set('getRecentBlockhash', {
        jsonrpc: '2.0',
        result: {
          context: { slot: 10000000 },
          value: {
            blockhash: 'hash' + 'a'.repeat(60),
            feeCalculator: { lamportsPerSignature: 5000 }
          }
        },
        id: 1
      })

      this.responses.set('getBalance', {
        jsonrpc: '2.0',
        result: {
          context: { slot: 10000000 },
          value: 10 * 1e9 // 10 SOL
        },
        id: 1
      })

      this.responses.set('sendTransaction', {
        jsonrpc: '2.0',
        result: 'signature' + 'b'.repeat(50),
        id: 1
      })

      this.responses.set('getSignatureStatuses', {
        jsonrpc: '2.0',
        result: {
          context: { slot: 10000001 },
          value: [{ confirmationStatus: 'confirmed' }]
        },
        id: 1
      })

      this.responses.set('getMinimumBalanceForRentExemption', {
        jsonrpc: '2.0',
        result: 1461600,
        id: 1
      })
    }
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = createServer((req, res) => {
        this.handleRequest(req, res)
      })

      this.server.listen(0, () => {
        const address = this.server!.address() as any
        this.port = address.port
        this.emit('started', { port: this.port })
        resolve()
      })
    })
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.server = null
          this.emit('stopped')
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  getURL(): string {
    return `http://localhost:${this.port}`
  }

  setResponse(method: string, response: any): void {
    this.responses.set(method, response)
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    let body = ''

    req.on('data', (chunk) => {
      body += chunk.toString()
    })

    req.on('end', () => {
      try {
        const data = JSON.parse(body)
        const method = data.method
        const response = this.responses.get(method) || {
          jsonrpc: '2.0',
          error: { code: -32601, message: 'Method not found' },
          id: data.id || 1
        }

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(response))
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32700, message: 'Parse error' },
          id: null
        }))
      }
    })
  }
}

// ==================== 测试数据生成器 ====================

export class TestDataGenerator {
  static generateWallet(id: string = 'test-wallet', network: 'BSC' | 'Solana' = 'BSC'): any {
    return {
      id,
      name: `Test Wallet ${id}`,
      network,
      address: network === 'BSC'
        ? '0x' + Math.random().toString(16).substr(2, 40).padEnd(40, '0')
        : 'So' + Math.random().toString(16).substr(2, 42).padEnd(42, '0'),
      privateKey: network === 'BSC'
        ? '0x' + Math.random().toString(16).substr(2, 64).padEnd(64, '0')
        : Buffer.from(Math.random().toString()).toString('base64'),
      createdAt: Date.now()
    }
  }

  static generateLaunchTask(id: string = 'test-task', network: 'BSC' | 'Solana' = 'BSC'): any {
    return {
      id,
      network,
      tokenName: `Test Token ${id}`,
      tokenSymbol: `TST${id.substring(0, 3).toUpperCase()}`,
      totalSupply: (Math.random() * 1000000000).toString(),
      decimals: network === 'BSC' ? 18 : 9,
      status: 'pending',
      createdAt: Date.now(),
      progress: 0,
      walletId: 'test-wallet',
      walletAddress: network === 'BSC'
        ? '0x' + 'a'.repeat(40)
        : 'So' + 'a'.repeat(42)
    }
  }

  static generateTokenInfo(network: 'BSC' | 'Solana' = 'BSC'): any {
    return {
      address: network === 'BSC'
        ? '0x' + 't'.repeat(40)
        : 'So' + 't'.repeat(42),
      network,
      symbol: 'TEST',
      name: 'Test Token',
      decimals: network === 'BSC' ? 18 : 9,
      currentPrice: Math.random() * 100,
      totalSupply: '1000000000'
    }
  }
}

// ==================== 辅助函数 ====================

export function waitForEvent(emitter: EventEmitter, event: string, timeout: number = 5000): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      emitter.off(event, handler)
      reject(new Error(`Event "${event}" timed out after ${timeout}ms`))
    }, timeout)

    const handler = (...args: any[]) => {
      clearTimeout(timer)
      emitter.off(event, handler)
      resolve(args.length === 1 ? args[0] : args)
    }

    emitter.on(event, handler)
  })
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function setupTestEnvironment(): void {
  process.env.NODE_ENV = 'test'
  process.env.LOG_LEVEL = 'error'
}

export function cleanupTestEnvironment(): void {
  delete process.env.NODE_ENV
  delete process.env.LOG_LEVEL
}
