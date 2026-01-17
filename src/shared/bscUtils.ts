import { ethers } from 'ethers'
import { RPC_ENDPOINTS, CONFIG } from './constants'

/**
 * 获取可用的BSC Provider（带故障切换）
 * @returns Promise<ethers.JsonRpcProvider> 返回可用的Provider
 * @throws Error 当所有RPC节点都不可用时抛出错误
 */
async function getAvailableBSCProvider(): Promise<ethers.JsonRpcProvider> {
  const errors: string[] = []

  for (const rpcUrl of RPC_ENDPOINTS.BSC) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl)
      // 测试连接
      await Promise.race([
        provider.getBlockNumber(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('连接超时')), CONFIG.RPC_CONNECTION_TIMEOUT)
        )
      ])
      console.log(`成功连接到BSC节点: ${rpcUrl}`)
      return provider
    } catch (error: any) {
      const errorMsg = `RPC节点 ${rpcUrl} 不可用: ${error.message}`
      console.warn(errorMsg)
      errors.push(errorMsg)
    }
  }

  throw new Error(`所有BSC RPC节点均不可用:\n${errors.join('\n')}`)
}

/**
 * 查询BSC钱包余额
 * @param address 钱包地址
 * @returns Promise<string> 返回BNB余额（以BNB为单位）
 * @throws Error 当地址无效或查询失败时抛出错误
 */
export async function getBSCBalance(address: string): Promise<string> {
  try {
    // 验证地址格式
    if (!address || typeof address !== 'string') {
      throw new Error('钱包地址不能为空')
    }

    // 验证是否为有效的以太坊地址
    if (!ethers.isAddress(address)) {
      throw new Error('无效的钱包地址格式')
    }

    // 获取可用的Provider
    const provider = await getAvailableBSCProvider()

    // 查询余额（返回值为Wei单位）
    const balanceWei = await provider.getBalance(address)

    // 将Wei转换为BNB
    const balanceBNB = ethers.formatEther(balanceWei)

    return balanceBNB
  } catch (error: any) {
    // 错误处理
    if (error.message?.includes('无效的钱包地址') || error.message?.includes('不能为空')) {
      throw error
    }

    // 网络错误
    if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
      throw new Error('网络连接失败，请检查网络设置')
    }

    // RPC错误
    if (error.code === 'SERVER_ERROR') {
      throw new Error('BSC节点服务异常，请稍后重试')
    }

    // 其他未知错误
    throw new Error(`查询余额失败: ${error.message || '未知错误'}`)
  }
}

/**
 * 批量查询多个BSC钱包余额
 * @param addresses 钱包地址数组
 * @returns Promise<Map<string, string>> 返回地址到余额的映射
 */
export async function getBSCBalanceBatch(
  addresses: string[]
): Promise<Map<string, string>> {
  const results = new Map<string, string>()

  // 并发查询所有地址
  const promises = addresses.map(async (address) => {
    try {
      const balance = await getBSCBalance(address)
      results.set(address, balance)
    } catch (error: any) {
      console.error(`查询地址 ${address} 失败:`, error.message)
      results.set(address, '0')
    }
  })

  await Promise.all(promises)
  return results
}

/**
 * 格式化余额显示
 * @param balance 余额字符串
 * @param decimals 保留小数位数，默认4位
 * @returns 格式化后的余额字符串
 */
export function formatBalance(balance: string, decimals: number = 4): string {
  try {
    const num = parseFloat(balance)
    return num.toFixed(decimals)
  } catch {
    return '0.0000'
  }
}
