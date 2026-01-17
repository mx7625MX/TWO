import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'

/**
 * Solana网络配置
 */
const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com'

/**
 * 查询Solana钱包余额
 * @param address 钱包地址
 * @returns Promise<string> 返回SOL余额（以SOL为单位）
 * @throws Error 当地址无效或查询失败时抛出错误
 */
export async function getSolanaBalance(address: string): Promise<string> {
  try {
    // 验证地址格式
    if (!address || typeof address !== 'string') {
      throw new Error('钱包地址不能为空')
    }

    // 验证地址长度和格式
    if (address.length < 32 || address.length > 44) {
      throw new Error('无效的Solana钱包地址格式')
    }

    // 创建Solana连接
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed')

    // 尝试创建公钥对象（会验证地址有效性）
    let publicKey: PublicKey
    try {
      publicKey = new PublicKey(address)
    } catch (error) {
      throw new Error('无效的Solana钱包地址格式')
    }

    // 查询余额（返回值为lamports单位）
    const balanceLamports = await connection.getBalance(publicKey)

    // 将lamports转换为SOL (1 SOL = 1,000,000,000 lamports)
    const balanceSOL = balanceLamports / LAMPORTS_PER_SOL

    // 返回字符串格式的余额
    return balanceSOL.toString()
  } catch (error: any) {
    // 错误处理
    if (error.message?.includes('无效的Solana钱包地址') || error.message?.includes('不能为空')) {
      throw error
    }

    // 网络连接错误
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      throw new Error('网络连接失败，请检查网络设置')
    }

    // RPC错误
    if (error.message?.includes('429')) {
      throw new Error('请求过于频繁，请稍后重试')
    }

    if (error.message?.includes('500') || error.message?.includes('503')) {
      throw new Error('Solana节点服务异常，请稍后重试')
    }

    // 其他未知错误
    throw new Error(`查询余额失败: ${error.message || '未知错误'}`)
  }
}

/**
 * 批量查询多个Solana钱包余额
 * @param addresses 钱包地址数组
 * @returns Promise<Map<string, string>> 返回地址到余额的映射
 */
export async function getSolanaBalanceBatch(
  addresses: string[]
): Promise<Map<string, string>> {
  const results = new Map<string, string>()

  if (!addresses || addresses.length === 0) {
    return results
  }

  // 创建连接
  const connection = new Connection(SOLANA_RPC_URL, 'confirmed')

  // 验证并转换所有地址为PublicKey
  const validAddresses: Array<{ address: string; publicKey: PublicKey }> = []

  for (const address of addresses) {
    try {
      const publicKey = new PublicKey(address)
      validAddresses.push({ address, publicKey })
    } catch (error) {
      console.error(`无效地址 ${address}:`, error)
      results.set(address, '0')
    }
  }

  // 批量查询余额
  try {
    const publicKeys = validAddresses.map((item) => item.publicKey)
    const balances = await connection.getMultipleAccountsInfo(publicKeys)

    balances.forEach((accountInfo, index) => {
      const { address } = validAddresses[index]
      if (accountInfo) {
        const balanceSOL = accountInfo.lamports / LAMPORTS_PER_SOL
        results.set(address, balanceSOL.toString())
      } else {
        results.set(address, '0')
      }
    })
  } catch (error: any) {
    console.error('批量查询失败:', error.message)
    // 如果批量查询失败，逐个查询
    for (const { address } of validAddresses) {
      try {
        const balance = await getSolanaBalance(address)
        results.set(address, balance)
      } catch (error) {
        results.set(address, '0')
      }
    }
  }

  return results
}

/**
 * 格式化余额显示
 * @param balance 余额字符串
 * @param decimals 保留小数位数，默认4位
 * @returns 格式化后的余额字符串
 */
export function formatSolanaBalance(balance: string, decimals: number = 4): string {
  try {
    const num = parseFloat(balance)
    return num.toFixed(decimals)
  } catch {
    return '0.0000'
  }
}

/**
 * 验证Solana地址格式
 * @param address 钱包地址
 * @returns boolean 地址是否有效
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}
