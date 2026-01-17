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

// 创建钱包结果（系统生成地址和私钥）
export interface CreateWalletResult {
  id: string
  address: string
  privateKey: string
  mnemonic?: string
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

export {}
