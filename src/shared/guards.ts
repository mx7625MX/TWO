/**
 * TypeScript类型守卫
 * 提供运行时类型检查和验证
 */

import type { 
  Wallet, 
  CreateWalletInput, 
  ImportWalletInput,
  WalletBalance,
  IPCResponse,
  LaunchTask,
  BundleBuyParams,
  TokenBalance
} from './types'

/**
 * 检查是否为有效的Wallet对象
 */
export function isWallet(obj: any): obj is Wallet {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.address === 'string' &&
    (obj.network === 'BSC' || obj.network === 'Solana') &&
    typeof obj.encrypted_key === 'string' &&
    typeof obj.created_at === 'number'
  )
}

/**
 * 检查是否为有效的CreateWalletInput
 */
export function isCreateWalletInput(obj: any): obj is CreateWalletInput {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.name === 'string' &&
    (obj.network === 'BSC' || obj.network === 'Solana') &&
    typeof obj.password === 'string'
  )
}

/**
 * 检查是否为有效的ImportWalletInput
 */
export function isImportWalletInput(obj: any): obj is ImportWalletInput {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.name === 'string' &&
    (obj.network === 'BSC' || obj.network === 'Solana') &&
    (obj.importType === 'privateKey' || obj.importType === 'mnemonic') &&
    typeof obj.password === 'string' &&
    (obj.importType === 'privateKey' ? typeof obj.privateKey === 'string' : true) &&
    (obj.importType === 'mnemonic' ? typeof obj.mnemonic === 'string' : true)
  )
}

/**
 * 检查是否为有效的WalletBalance
 */
export function isWalletBalance(obj: any): obj is WalletBalance {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.address === 'string' &&
    typeof obj.balance === 'string' &&
    (obj.network === 'BSC' || obj.network === 'Solana')
  )
}

/**
 * 检查是否为成功的IPC响应
 */
export function isSuccessResponse<T = any>(response: IPCResponse<T>): response is IPCResponse<T> & { success: true; data: T } {
  return response.success === true && response.data !== undefined
}

/**
 * 检查是否为失败的IPC响应
 */
export function isErrorResponse<T = any>(response: IPCResponse<T>): response is IPCResponse<T> & { success: false; error: string } {
  return response.success === false && typeof response.error === 'string'
}

/**
 * 检查是否为有效的LaunchTask
 */
export function isLaunchTask(obj: any): obj is LaunchTask {
  const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled']
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    (obj.network === 'BSC' || obj.network === 'Solana') &&
    typeof obj.tokenName === 'string' &&
    typeof obj.tokenSymbol === 'string' &&
    typeof obj.totalSupply === 'string' &&
    typeof obj.decimals === 'number' &&
    validStatuses.includes(obj.status) &&
    typeof obj.createdAt === 'number' &&
    typeof obj.progress === 'number' &&
    typeof obj.walletId === 'string' &&
    typeof obj.walletAddress === 'string'
  )
}

/**
 * 检查是否为有效的BundleBuyParams
 */
export function isBundleBuyParams(obj: any): obj is BundleBuyParams {
  const validPriorities = ['low', 'normal', 'high']
  return (
    typeof obj === 'object' &&
    obj !== null &&
    (obj.network === 'BSC' || obj.network === 'Solana') &&
    typeof obj.tokenAddress === 'string' &&
    Array.isArray(obj.walletIds) &&
    obj.walletIds.every((id: any) => typeof id === 'string') &&
    typeof obj.amountPerWallet === 'string' &&
    typeof obj.slippage === 'number' &&
    validPriorities.includes(obj.priority) &&
    typeof obj.delayBetweenTx === 'number'
  )
}

/**
 * 检查是否为有效的TokenBalance
 */
export function isTokenBalance(obj: any): obj is TokenBalance {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.address === 'string' &&
    typeof obj.symbol === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.balance === 'string' &&
    typeof obj.decimals === 'number'
  )
}

/**
 * 检查是否为有效的网络类型
 */
export function isValidNetwork(value: any): value is 'BSC' | 'Solana' {
  return value === 'BSC' || value === 'Solana'
}

/**
 * 检查是否为有效的任务状态
 */
export function isValidTaskStatus(value: any): value is 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' {
  return ['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(value)
}

/**
 * 检查是否为有效的优先级
 */
export function isValidPriority(value: any): value is 'low' | 'normal' | 'high' {
  return ['low', 'normal', 'high'].includes(value)
}

/**
 * 检查是否为有效的BSC地址
 * @param address 地址字符串
 */
export function isBSCAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address)
}

/**
 * 检查是否为有效的Solana地址
 * @param address 地址字符串
 */
export function isSolanaAddress(address: string): boolean {
  return (
    address.length >= 32 &&
    address.length <= 44 &&
    /^[1-9A-HJ-NP-Za-km-z]+$/.test(address)
  )
}

/**
 * 检查是否为有效的钱包地址
 * @param address 地址字符串
 * @param network 网络类型
 */
export function isValidAddress(address: string, network: 'BSC' | 'Solana'): boolean {
  if (network === 'BSC') {
    return isBSCAddress(address)
  } else {
    return isSolanaAddress(address)
  }
}

/**
 * 检查数组是否非空
 */
export function isNonEmptyArray<T>(arr: any): arr is T[] {
  return Array.isArray(arr) && arr.length > 0
}

/**
 * 检查字符串是否非空
 */
export function isNonEmptyString(value: any): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * 检查数字是否在范围内
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

/**
 * 安全地解析JSON
 * @param json JSON字符串
 * @returns 解析结果或null
 */
export function safeParse<T = any>(json: string): T | null {
  try {
    return JSON.parse(json) as T
  } catch {
    return null
  }
}

/**
 * 验证并断言类型
 * @param value 要验证的值
 * @param guard 类型守卫函数
 * @param errorMessage 错误消息
 * @throws 如果验证失败则抛出错误
 */
export function assertType<T>(
  value: any,
  guard: (val: any) => val is T,
  errorMessage: string
): asserts value is T {
  if (!guard(value)) {
    throw new Error(errorMessage)
  }
}

// 使用示例（注释）
/*
使用方法:

import { isWallet, isSuccessResponse, assertType, isBSCAddress } from './guards'

// 1. 类型检查
if (isWallet(data)) {
  // data 现在是 Wallet 类型
  console.log(data.address)
}

// 2. IPC响应处理
const response = await window.electronAPI.wallet.list()
if (isSuccessResponse(response)) {
  // response.data 可用
  const wallets = response.data
}

// 3. 类型断言
assertType(input, isCreateWalletInput, '无效的创建钱包输入')
// 如果验证失败，会抛出错误

// 4. 地址验证
if (isBSCAddress(address)) {
  // 这是有效的BSC地址
}

// 5. 安全JSON解析
const data = safeParse<Wallet>(jsonString)
if (data && isWallet(data)) {
  // 安全使用
}
*/

