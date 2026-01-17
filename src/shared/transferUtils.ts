import { ethers } from 'ethers'
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { CONFIG } from './constants'

/**
 * 转账配置
 */
export interface TransferConfig {
  fromAddress: string
  toAddress: string
  amount: string // 以主币单位（BNB/SOL）
  network: 'BSC' | 'Solana'
  privateKey: string // 解密后的私钥
}

/**
 * 批量转账配置
 */
export interface BatchTransferConfig {
  fromAddress: string
  recipients: Array<{
    address: string
    amount: string
  }>
  network: 'BSC' | 'Solana'
  privateKey: string
}

/**
 * 转账结果
 */
export interface TransferResult {
  success: boolean
  txHash?: string
  error?: string
  toAddress: string
  amount: string
}

/**
 * BSC转账
 */
export async function transferBSC(config: TransferConfig): Promise<TransferResult> {
  try {
    // 验证地址
    if (!ethers.isAddress(config.fromAddress) || !ethers.isAddress(config.toAddress)) {
      throw new Error('无效的BSC地址')
    }

    // 验证金额
    const amountWei = ethers.parseEther(config.amount)
    if (amountWei <= 0n) {
      throw new Error('转账金额必须大于0')
    }

    // 创建Provider和Wallet
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org')
    const wallet = new ethers.Wallet(config.privateKey, provider)

    // 验证发送地址匹配
    if (wallet.address.toLowerCase() !== config.fromAddress.toLowerCase()) {
      throw new Error('私钥与发送地址不匹配')
    }

    // 检查余额
    const balance = await provider.getBalance(wallet.address)
    const estimatedGas = 21000n * (await provider.getFeeData()).gasPrice!
    
    if (balance < amountWei + estimatedGas) {
      throw new Error(`余额不足。需要至少 ${ethers.formatEther(amountWei + estimatedGas)} BNB`)
    }

    // 发送交易
    const tx = await wallet.sendTransaction({
      to: config.toAddress,
      value: amountWei,
    })

    console.log('BSC转账交易已发送:', tx.hash)

    // 等待确认
    const receipt = await tx.wait()

    if (!receipt || receipt.status === 0) {
      throw new Error('交易失败')
    }

    return {
      success: true,
      txHash: tx.hash,
      toAddress: config.toAddress,
      amount: config.amount,
    }
  } catch (error: any) {
    console.error('BSC转账失败:', error)
    return {
      success: false,
      error: error.message || 'BSC转账失败',
      toAddress: config.toAddress,
      amount: config.amount,
    }
  }
}

/**
 * Solana转账
 */
export async function transferSolana(config: TransferConfig): Promise<TransferResult> {
  try {
    // 创建连接
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed')

    // 从Base64私钥恢复Keypair
    const secretKey = Buffer.from(config.privateKey, 'base64')
    const fromKeypair = Keypair.fromSecretKey(new Uint8Array(secretKey))

    // 验证发送地址匹配
    if (fromKeypair.publicKey.toBase58() !== config.fromAddress) {
      throw new Error('私钥与发送地址不匹配')
    }

    // 验证接收地址
    let toPublicKey: PublicKey
    try {
      toPublicKey = new PublicKey(config.toAddress)
    } catch {
      throw new Error('无效的Solana地址')
    }

    // 转换金额（SOL to Lamports）
    const amountLamports = Math.floor(parseFloat(config.amount) * LAMPORTS_PER_SOL)
    if (amountLamports <= 0) {
      throw new Error('转账金额必须大于0')
    }

    // 检查余额
    const balance = await connection.getBalance(fromKeypair.publicKey)
    const minRentExemption = await connection.getMinimumBalanceForRentExemption(0)
    
    if (balance < amountLamports + CONFIG.ESTIMATED_FEES.SOLANA_TX_FEE) {
      throw new Error(`余额不足。需要至少 ${(amountLamports + minRentExemption) / LAMPORTS_PER_SOL} SOL`)
    }

    // 创建转账交易
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toPublicKey,
        lamports: amountLamports,
      })
    )

    // 发送并确认交易
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [fromKeypair],
      {
        commitment: 'confirmed',
      }
    )

    console.log('Solana转账成功:', signature)

    return {
      success: true,
      txHash: signature,
      toAddress: config.toAddress,
      amount: config.amount,
    }
  } catch (error: any) {
    console.error('Solana转账失败:', error)
    return {
      success: false,
      error: error.message || 'Solana转账失败',
      toAddress: config.toAddress,
      amount: config.amount,
    }
  }
}

/**
 * 批量转账（BSC）
 */
export async function batchTransferBSC(config: BatchTransferConfig): Promise<TransferResult[]> {
  const results: TransferResult[] = []

  for (const recipient of config.recipients) {
    const result = await transferBSC({
      fromAddress: config.fromAddress,
      toAddress: recipient.address,
      amount: recipient.amount,
      network: 'BSC',
      privateKey: config.privateKey,
    })

    results.push(result)

    // 添加延迟，避免nonce冲突
    if (result.success) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  return results
}

/**
 * 批量转账（Solana）
 */
export async function batchTransferSolana(config: BatchTransferConfig): Promise<TransferResult[]> {
  const results: TransferResult[] = []

  for (const recipient of config.recipients) {
    const result = await transferSolana({
      fromAddress: config.fromAddress,
      toAddress: recipient.address,
      amount: recipient.amount,
      network: 'Solana',
      privateKey: config.privateKey,
    })

    results.push(result)

    // 添加延迟
    if (result.success) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return results
}

/**
 * 估算BSC转账Gas费用
 */
export async function estimateBSCGasFee(): Promise<string> {
  try {
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org')
    const feeData = await provider.getFeeData()
    const gasPrice = feeData.gasPrice || 0n
    const estimatedGas = 21000n
    
    const totalFee = gasPrice * estimatedGas
    return ethers.formatEther(totalFee)
  } catch (error) {
    console.error('估算Gas费用失败:', error)
    return '0.0001' // 默认估算值
  }
}

/**
 * 估算Solana转账费用
 */
export async function estimateSolanaFee(): Promise<string> {
  try {
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed')
    const recentBlockhash = await connection.getLatestBlockhash()
    
    // Solana转账费用
    return (CONFIG.ESTIMATED_FEES.SOLANA_TX_FEE / LAMPORTS_PER_SOL).toString()
  } catch (error) {
    console.error('估算Solana费用失败:', error)
    return '0.000005' // 默认估算值
  }
}

/**
 * 验证转账配置
 */
export function validateTransferConfig(config: TransferConfig): { valid: boolean; error?: string } {
  // 验证金额
  const amount = parseFloat(config.amount)
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: '转账金额必须大于0' }
  }

  // 验证地址
  if (config.network === 'BSC') {
    if (!ethers.isAddress(config.fromAddress) || !ethers.isAddress(config.toAddress)) {
      return { valid: false, error: '无效的BSC地址' }
    }
  } else if (config.network === 'Solana') {
    try {
      new PublicKey(config.fromAddress)
      new PublicKey(config.toAddress)
    } catch {
      return { valid: false, error: '无效的Solana地址' }
    }
  }

  // 验证不能转给自己
  if (config.fromAddress === config.toAddress) {
    return { valid: false, error: '不能转账给自己' }
  }

  return { valid: true }
}
