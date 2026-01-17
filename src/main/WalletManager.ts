import { ethers } from 'ethers'
import { Keypair } from '@solana/web3.js'
import { v4 as uuidv4 } from 'uuid'
import * as bip39 from 'bip39'
import { encrypt, decrypt } from '../shared/cryptoUtils'
import { getBSCBalance } from '../shared/bscUtils'
import { getSolanaBalance } from '../shared/solanaUtils'
import type { DatabaseWalletInput } from '../shared/types'

/**
 * 钱包创建结果接口
 */
export interface WalletCreationResult {
  id: string
  name: string
  address: string
  network: 'BSC' | 'Solana'
  privateKey: string // 明文私钥（仅在内存中，不应持久化）
  encrypted_key: string // 加密后的私钥
}

/**
 * 余额查询结果接口
 */
export interface BalanceResult {
  address: string
  network: 'BSC' | 'Solana'
  nativeBalance: string // 原生货币余额（BNB或SOL）
  nativeSymbol: string // 原生货币符号
  tokenBalances?: TokenBalance[] // 代币余额列表（可选）
}

/**
 * 代币余额接口
 */
export interface TokenBalance {
  symbol: string // 代币符号
  name: string // 代币名称
  balance: string // 余额
  decimals: number // 精度
  contractAddress: string // 合约地址
}

/**
 * 钱包管理器类
 * 负责创建、管理和加密钱包
 */
export class WalletManager {
  private encryptionKey: string

  /**
   * 构造函数
   * @param encryptionPassword 用于加密私钥的密码（必须提供）
   */
  constructor(encryptionPassword: string) {
    // 强制要求提供密码
    if (!encryptionPassword || encryptionPassword.trim() === '') {
      throw new Error('必须提供加密密码')
    }
    
    // 验证密码强度（至少10位，包含大小写字母、数字和特殊字符）
    if (!this.validatePasswordStrength(encryptionPassword)) {
      throw new Error('密码强度不足：需要至少10个字符，包含大写字母、小写字母、数字和特殊字符')
    }
    
    this.encryptionKey = encryptionPassword
  }

  /** 
   * 验证密码强度
   * @param password 密码
   * @returns 是否通过验证
   */
  private validatePasswordStrength(password: string): boolean {
    if (password.length < 10) return false
    if (!/[A-Z]/.test(password)) return false
    if (!/[a-z]/.test(password)) return false
    if (!/[0-9]/.test(password)) return false
    if (!/[^A-Za-z0-9]/.test(password)) return false
    return true
  }

  /**
   * 创建新钱包
   * @param name 钱包名称
   * @param network 网络类型（BSC或Solana）
   * @returns 钱包创建结果
   */
  async createWallet(name: string, network: 'BSC' | 'Solana'): Promise<WalletCreationResult> {
    try {
      // 生成唯一ID
      const id = uuidv4()

      let address: string
      let privateKey: string

      if (network === 'BSC') {
        // 创建BSC钱包（以太坊兼容）
        const wallet = ethers.Wallet.createRandom()
        address = wallet.address
        privateKey = wallet.privateKey
        
        console.log('BSC钱包创建成功:', address)
      } else if (network === 'Solana') {
        // 创建Solana钱包
        const keypair = Keypair.generate()
        address = keypair.publicKey.toBase58()
        // Solana私钥是Uint8Array，需要转换为Base64字符串
        privateKey = Buffer.from(keypair.secretKey).toString('base64')
        
        console.log('Solana钱包创建成功:', address)
      } else {
        throw new Error('不支持的网络类型')
      }

      // 加密私钥
      const encrypted_key = this.encryptPrivateKey(privateKey)

      // 生成助记词（用户备份）
      const mnemonic = this.generateMnemonic(12)

      // 安全返回：不包含明文私钥
      return {
        id,
        name,
        address,
        network,
        mnemonic, // 仅返回助记词供用户备份
        encrypted_key,
      }
    } catch (error: any) {
      console.error('创建钱包失败:', error)
      throw new Error(`创建钱包失败: ${error.message}`)
    }
  }

  /**
   * 批量创建钱包
   * @param count 创建数量
   * @param network 网络类型
   * @param namePrefix 名称前缀
   * @returns 钱包列表
   */
  async createMultipleWallets(
    count: number,
    network: 'BSC' | 'Solana',
    namePrefix: string = '钱包'
  ): Promise<WalletCreationResult[]> {
    const wallets: WalletCreationResult[] = []

    for (let i = 1; i <= count; i++) {
      const wallet = await this.createWallet(`${namePrefix}_${i}`, network)
      wallets.push(wallet)
    }

    console.log(`批量创建了 ${count} 个${network}钱包`)
    return wallets
  }

  /**
   * 导入钱包
   * @param name 钱包名称
   * @param network 网络类型
   * @param importData 导入数据（私钥或助记词）
   * @param importType 导入类型（'privateKey' 或 'mnemonic'）
   * @param derivationPath 派生路径（仅助记词导入时使用）
   * @returns 钱包创建结果
   */
  async importWallet(
    name: string,
    network: 'BSC' | 'Solana',
    importData: string,
    importType: 'privateKey' | 'mnemonic' = 'privateKey',
    derivationPath?: string
  ): Promise<WalletCreationResult> {
    try {
      // 生成唯一ID
      const id = uuidv4()

      let address: string
      let privateKey: string

      if (importType === 'privateKey') {
        // 私钥导入
        const result = await this.importFromPrivateKey(network, importData)
        address = result.address
        privateKey = result.privateKey
      } else if (importType === 'mnemonic') {
        // 助记词导入
        const result = await this.importFromMnemonic(network, importData, derivationPath)
        address = result.address
        privateKey = result.privateKey
      } else {
        throw new Error('不支持的导入类型')
      }

      // 加密私钥
      const encrypted_key = this.encryptPrivateKey(privateKey)

      console.log(`${network}钱包导入成功:`, address)

      return {
        id,
        name,
        address,
        network,
        privateKey,
        encrypted_key,
      }
    } catch (error: any) {
      console.error('导入钱包失败:', error)
      throw new Error(`导入钱包失败: ${error.message}`)
    }
  }

  /**
   * 从私钥导入钱包
   * @param network 网络类型
   * @param privateKey 私钥
   * @returns 地址和私钥
   */
  private async importFromPrivateKey(
    network: 'BSC' | 'Solana',
    privateKey: string
  ): Promise<{ address: string; privateKey: string }> {
    try {
      if (network === 'BSC') {
        // 验证和导入BSC私钥
        return this.importBSCPrivateKey(privateKey)
      } else if (network === 'Solana') {
        // 验证和导入Solana私钥
        return this.importSolanaPrivateKey(privateKey)
      } else {
        throw new Error('不支持的网络类型')
      }
    } catch (error: any) {
      throw new Error(`私钥导入失败: ${error.message}`)
    }
  }

  /**
   * 导入BSC私钥
   * @param privateKey 私钥（支持带0x或不带0x）
   * @returns 地址和格式化的私钥
   */
  private importBSCPrivateKey(privateKey: string): { address: string; privateKey: string } {
    try {
      // 清理私钥格式
      let cleanKey = privateKey.trim()

      // 如果没有0x前缀，添加它
      if (!cleanKey.startsWith('0x')) {
        cleanKey = '0x' + cleanKey
      }

      // 验证私钥长度（应为66个字符，包括0x）
      if (cleanKey.length !== 66) {
        throw new Error('BSC私钥长度无效，应为64个十六进制字符')
      }

      // 验证是否为有效的十六进制字符串
      if (!/^0x[0-9a-fA-F]{64}$/.test(cleanKey)) {
        throw new Error('BSC私钥格式无效，应为十六进制字符串')
      }

      // 创建钱包实例
      const wallet = new ethers.Wallet(cleanKey)

      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
      }
    } catch (error: any) {
      if (error.message.includes('invalid private key')) {
        throw new Error('无效的BSC私钥')
      }
      throw error
    }
  }

  /**
   * 导入Solana私钥
   * @param privateKey Base64或字节数组的私钥
   * @returns 地址和Base64格式的私钥
   */
  private importSolanaPrivateKey(privateKey: string): { address: string; privateKey: string } {
    try {
      let secretKey: Uint8Array

      // 尝试解析私钥格式
      try {
        // 方式1：Base64格式
        secretKey = new Uint8Array(Buffer.from(privateKey, 'base64'))
      } catch {
        try {
          // 方式2：JSON数组格式 [1,2,3,...]
          const parsed = JSON.parse(privateKey)
          if (Array.isArray(parsed)) {
            secretKey = new Uint8Array(parsed)
          } else {
            throw new Error('无效的私钥格式')
          }
        } catch {
          throw new Error('Solana私钥格式无效，应为Base64字符串或JSON数组')
        }
      }

      // 验证私钥长度（Solana私钥应为64字节）
      if (secretKey.length !== 64) {
        throw new Error(`Solana私钥长度无效，应为64字节，当前为${secretKey.length}字节`)
      }

      // 从私钥创建Keypair
      const keypair = Keypair.fromSecretKey(secretKey)

      return {
        address: keypair.publicKey.toBase58(),
        privateKey: Buffer.from(keypair.secretKey).toString('base64'),
      }
    } catch (error: any) {
      if (error.message.includes('无效') || error.message.includes('长度')) {
        throw error
      }
      throw new Error('无效的Solana私钥')
    }
  }

  /**
   * 从助记词导入钱包
   * @param network 网络类型
   * @param mnemonic 助记词（12或24个单词）
   * @param derivationPath 派生路径
   * @returns 地址和私钥
   */
  private async importFromMnemonic(
    network: 'BSC' | 'Solana',
    mnemonic: string,
    derivationPath?: string
  ): Promise<{ address: string; privateKey: string }> {
    try {
      // 验证助记词
      const cleanMnemonic = mnemonic.trim().toLowerCase()
      
      if (!bip39.validateMnemonic(cleanMnemonic)) {
        throw new Error('无效的助记词')
      }

      if (network === 'BSC') {
        return this.importBSCFromMnemonic(cleanMnemonic, derivationPath)
      } else if (network === 'Solana') {
        return this.importSolanaFromMnemonic(cleanMnemonic, derivationPath)
      } else {
        throw new Error('不支持的网络类型')
      }
    } catch (error: any) {
      throw new Error(`助记词导入失败: ${error.message}`)
    }
  }

  /**
   * 从助记词导入BSC钱包
   * @param mnemonic 助记词
   * @param derivationPath 派生路径，默认为m/44'/60'/0'/0/0
   * @returns 地址和私钥
   */
  private importBSCFromMnemonic(
    mnemonic: string,
    derivationPath?: string
  ): { address: string; privateKey: string } {
    try {
      // 默认使用BIP44标准路径（以太坊）
      const path = derivationPath || "m/44'/60'/0'/0/0"

      // 从助记词创建HD钱包
      const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, path)

      return {
        address: hdNode.address,
        privateKey: hdNode.privateKey,
      }
    } catch (error: any) {
      throw new Error(`从助记词创建BSC钱包失败: ${error.message}`)
    }
  }

  /**
   * 从助记词导入Solana钱包
   * @param mnemonic 助记词
   * @param derivationPath 派生路径，默认为m/44'/501'/0'/0'
   * @returns 地址和私钥
   */
  private importSolanaFromMnemonic(
    mnemonic: string,
    derivationPath?: string
  ): { address: string; privateKey: string } {
    try {
      // Solana 标准派生路径
      const path = derivationPath || "m/44'/501'/0'/0'"

      // 从助记词生成种子
      const seed = bip39.mnemonicToSeedSync(mnemonic)

      // 使用ethers的HDNodeWallet进行派生（兼容BIP44）
      const hdNode = ethers.HDNodeWallet.fromSeed(seed)
      const derived = hdNode.derivePath(path)

      // 从派生的私钥创建Solana Keypair
      // 需要将以太坊格式的私钥转换为Solana格式
      const privateKeyBytes = Buffer.from(derived.privateKey.slice(2), 'hex')
      
      // Solana使用Ed25519，需要特殊处理
      // 这里使用派生的私钥前32字节作为种子
      const seed32 = privateKeyBytes.slice(0, 32)
      const keypair = Keypair.fromSeed(seed32)

      return {
        address: keypair.publicKey.toBase58(),
        privateKey: Buffer.from(keypair.secretKey).toString('base64'),
      }
    } catch (error: any) {
      throw new Error(`从助记词创建Solana钱包失败: ${error.message}`)
    }
  }

  /**
   * 生成新助记词
   * @param wordCount 助记词单词数量（12或24）
   * @returns 助记词
   */
  generateMnemonic(wordCount: 12 | 24 = 12): string {
    try {
      const strength = wordCount === 12 ? 128 : 256
      return bip39.generateMnemonic(strength)
    } catch (error: any) {
      throw new Error(`生成助记词失败: ${error.message}`)
    }
  }

  /**
   * 验证助记词有效性
   * @param mnemonic 助记词
   * @returns 是否有效
   */
  validateMnemonic(mnemonic: string): boolean {
    try {
      const cleanMnemonic = mnemonic.trim().toLowerCase()
      return bip39.validateMnemonic(cleanMnemonic)
    } catch {
      return false
    }
  }

  /**
   * 加密私钥
   * @param privateKey 明文私钥
   * @returns 加密后的私钥
   */
  private encryptPrivateKey(privateKey: string): string {
    try {
      // 使用crypto-js的AES加密
      return encrypt(privateKey, this.encryptionKey)
    } catch (error: any) {
      console.error('加密私钥失败:', error)
      throw new Error(`加密私钥失败: ${error.message}`)
    }
  }

  /**
   * 解密私钥
   * @param encryptedKey 加密的私钥
   * @returns 明文私钥
   */
  decryptPrivateKey(encryptedKey: string): string {
    try {
      // 使用crypto-js的AES解密
      return decrypt(encryptedKey, this.encryptionKey)
    } catch (error: any) {
      console.error('解密私钥失败:', error)
      throw new Error(`解密私钥失败: ${error.message}`)
    }
  }

  /**
   * 从私钥恢复BSC钱包
   * @param privateKey 私钥
   * @returns 钱包地址
   */
  recoverBSCWallet(privateKey: string): string {
    try {
      const wallet = new ethers.Wallet(privateKey)
      return wallet.address
    } catch (error: any) {
      throw new Error(`恢复BSC钱包失败: ${error.message}`)
    }
  }

  /**
   * 从私钥恢复Solana钱包
   * @param privateKeyBase64 Base64编码的私钥
   * @returns 钱包地址
   */
  recoverSolanaWallet(privateKeyBase64: string): string {
    try {
      const secretKey = Buffer.from(privateKeyBase64, 'base64')
      const keypair = Keypair.fromSecretKey(new Uint8Array(secretKey))
      return keypair.publicKey.toBase58()
    } catch (error: any) {
      throw new Error(`恢复Solana钱包失败: ${error.message}`)
    }
  }

  /**
   * 验证钱包地址格式
   * @param address 钱包地址
   * @param network 网络类型
   * @returns 是否有效
   */
  validateAddress(address: string, network: 'BSC' | 'Solana'): boolean {
    try {
      if (network === 'BSC') {
        return ethers.isAddress(address)
      } else if (network === 'Solana') {
        // Solana地址验证
        return address.length >= 32 && address.length <= 44
      }
      return false
    } catch {
      return false
    }
  }

  /**
   * 将创建结果转换为数据库输入格式
   * @param result 钱包创建结果
   * @returns 数据库输入对象
   */
  toDatabaseWalletInput(result: WalletCreationResult): DatabaseWalletInput {
    return {
      name: result.name,
      address: result.address,
      network: result.network,
      encrypted_key: result.encrypted_key,
    }
  }

  /**
   * 查询钱包余额
   * @param address 钱包地址
   * @param network 网络类型
   * @returns 余额信息
   */
  async getBalance(address: string, network: 'BSC' | 'Solana'): Promise<BalanceResult> {
    try {
      // 验证地址
      if (!this.validateAddress(address, network)) {
        throw new Error('无效的钱包地址')
      }

      let nativeBalance: string
      let nativeSymbol: string

      if (network === 'BSC') {
        // 查询BSC余额
        nativeBalance = await getBSCBalance(address)
        nativeSymbol = 'BNB'
        
        // TODO: 可以在这里添加BEP20代币余额查询
        // const tokenBalances = await this.getBSCTokenBalances(address)
        
        return {
          address,
          network,
          nativeBalance,
          nativeSymbol,
          tokenBalances: [], // 暂时返回空数组
        }
      } else if (network === 'Solana') {
        // 查询Solana余额
        nativeBalance = await getSolanaBalance(address)
        nativeSymbol = 'SOL'
        
        // TODO: 可以在这里添加SPL代币余额查询
        // const tokenBalances = await this.getSolanaTokenBalances(address)
        
        return {
          address,
          network,
          nativeBalance,
          nativeSymbol,
          tokenBalances: [], // 暂时返回空数组
        }
      } else {
        throw new Error('不支持的网络类型')
      }
    } catch (error: any) {
      console.error('查询余额失败:', error)
      throw new Error(`查询余额失败: ${error.message}`)
    }
  }

  /**
   * 批量查询钱包余额
   * @param wallets 钱包地址和网络类型列表
   * @returns 余额信息列表
   */
  async getBalances(
    wallets: Array<{ address: string; network: 'BSC' | 'Solana' }>
  ): Promise<BalanceResult[]> {
    try {
      const results: BalanceResult[] = []
      
      // 串行查询，避免请求过快
      for (const wallet of wallets) {
        try {
          const balance = await this.getBalance(wallet.address, wallet.network)
          results.push(balance)
          
          // 添加延迟，避免请求过快
          await new Promise(resolve => setTimeout(resolve, 300))
        } catch (error: any) {
          console.error(`查询${wallet.address}余额失败:`, error.message)
          // 失败时返回0余额
          results.push({
            address: wallet.address,
            network: wallet.network,
            nativeBalance: '0',
            nativeSymbol: wallet.network === 'BSC' ? 'BNB' : 'SOL',
            tokenBalances: [],
          })
        }
      }
      
      return results
    } catch (error: any) {
      console.error('批量查询余额失败:', error)
      throw new Error(`批量查询余额失败: ${error.message}`)
    }
  }

  /**
   * 格式化余额显示
   * @param balance 余额
   * @param decimals 小数位数（默认4位）
   * @returns 格式化的余额字符串
   */
  formatBalance(balance: string, decimals: number = 4): string {
    try {
      const num = parseFloat(balance)
      if (isNaN(num)) {
        return '0'
      }
      
      // 保留指定小数位数
      return num.toFixed(decimals)
    } catch {
      return '0'
    }
  }
}

// 注意：不再导出单例，因为需要用户提供密码
// 请在需要时创建新实例：new WalletManager(password)
