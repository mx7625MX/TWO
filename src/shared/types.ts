// 钱包相关类型
export interface Wallet {
  id: string
  name: string
  address: string
  network: 'BSC' | 'Solana'
  encrypted_key: string
  created_at: number
}

// 创建钱包输入（只需要名称、网络和密码）
export interface CreateWalletInput {
  name: string
  network: 'BSC' | 'Solana'
  password: string  // 加密密码
}

// 创建钱包结果（系统生成地址，私钥已加密存储）
// 注意：出于安全考虑，不返回明文私钥到前端
export interface CreateWalletResult {
  id: string
  address: string
  mnemonic?: string // 仅在创建时返回助记词供用户备份
}

// 数据库钱包输入
export interface DatabaseWalletInput {
  name: string
  address: string
  network: 'BSC' | 'Solana'
  encrypted_key: string
}

export interface ImportWalletInput {
  name: string
  network: 'BSC' | 'Solana'
  importType: 'privateKey' | 'mnemonic'
  privateKey?: string
  mnemonic?: string
  derivationPath?: string
  password: string
}

export interface ImportWalletResult {
  id: string
  address: string
}

// IPC通信类型定义
export interface WalletBalance {
  address: string
  balance: string
  network: 'BSC' | 'Solana'
}

export interface GetBalanceParams {
  address: string
  network: 'BSC' | 'Solana'
}

// IPC响应类型
export interface IPCResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Electron API接口
export interface ElectronAPI {
  // 钱包操作
  wallet: {
    create: (input: CreateWalletInput) => Promise<IPCResponse<CreateWalletResult>>
    import: (input: ImportWalletInput) => Promise<IPCResponse<ImportWalletResult>>
    list: () => Promise<IPCResponse<Wallet[]>>
    getBalance: (params: GetBalanceParams) => Promise<IPCResponse<WalletBalance>>
    getById: (id: string) => Promise<IPCResponse<Wallet | null>>
    updateName: (id: string, name: string) => Promise<IPCResponse<boolean>>
    delete: (id: string) => Promise<IPCResponse<boolean>>
  }
  // 系统信息
  getVersion: () => NodeJS.ProcessVersions
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

// ==================== 发币任务类型 ====================

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export interface LaunchTask {
  id: string
  network: 'BSC' | 'Solana'
  tokenName: string
  tokenSymbol: string
  totalSupply: string
  decimals: number
  status: TaskStatus
  createdAt: number
  startedAt?: number
  completedAt?: number
  progress: number
  result?: LaunchResult
  error?: string
  walletId: string
  walletAddress: string
  useMEVProtection?: boolean
}

export interface LaunchResult {
  contractAddress?: string
  mintAddress?: string
  txHash: string
  blockNumber?: number
  slot?: number
  gasUsed?: string
  gasPrice?: string
  totalFee?: string
}

export interface TokenLaunchParams {
  name: string
  symbol: string
  totalSupply: string
  decimals: number
  network: 'BSC' | 'Solana'
  walletId: string
  useMEVProtection?: boolean
}

// ==================== 批量买入类型 ====================

export interface BundleBuyParams {
  network: 'BSC' | 'Solana'
  tokenAddress: string
  walletIds: string[]
  amountPerWallet: string
  slippage: number
  priority: 'low' | 'normal' | 'high'
  delayBetweenTx: number
  useMEVProtection?: boolean
  useJito?: boolean
}

export interface BundleBuyStatus {
  batchId: string
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled'
  currentIndex: number
  totalWallets: number
  results: BundleBuyResult[]
}

export interface BundleBuyResult {
  walletId: string
  walletAddress: string
  txHash?: string
  amountIn: string
  amountOut?: string
  gasUsed?: string
  status: 'success' | 'failed' | 'pending'
  error?: string
}

// ==================== 余额类型 ====================

export interface TokenBalance {
  address: string
  symbol: string
  name: string
  balance: string
  decimals: number
}

// ==================== 用户类型 ====================

export interface User {
  id: string
  username: string
  isAuthenticated: boolean
}

export {}
