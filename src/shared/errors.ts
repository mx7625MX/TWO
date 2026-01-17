/**
 * 应用错误类
 * 用于统一错误处理和用户友好的错误信息
 */

/**
 * 应用错误基类
 */
export class AppError extends Error {
  constructor(
    message: string,
    public userMessage: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
    
    // 捕获堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }

  /**
   * 转换为用户友好的错误对象
   */
  toUserError(): { message: string; code?: string } {
    return {
      message: this.userMessage,
      code: this.code
    }
  }
}

/**
 * 钱包相关错误
 */
export class WalletError extends AppError {
  constructor(message: string, userMessage: string, code?: string) {
    super(message, userMessage, code)
    this.name = 'WalletError'
  }
}

/**
 * 网络相关错误
 */
export class NetworkError extends AppError {
  constructor(message: string, userMessage: string, code?: string) {
    super(message, userMessage, code)
    this.name = 'NetworkError'
  }
}

/**
 * 数据库相关错误
 */
export class DatabaseError extends AppError {
  constructor(message: string, userMessage: string, code?: string) {
    super(message, userMessage, code)
    this.name = 'DatabaseError'
  }
}

/**
 * 加密相关错误
 */
export class CryptoError extends AppError {
  constructor(message: string, userMessage: string, code?: string) {
    super(message, userMessage, code)
    this.name = 'CryptoError'
  }
}

/**
 * 验证相关错误
 */
export class ValidationError extends AppError {
  constructor(message: string, userMessage: string, code?: string) {
    super(message, userMessage, code)
    this.name = 'ValidationError'
  }
}

/**
 * 将普通错误转换为用户友好的错误信息
 * @param error 原始错误对象
 * @param defaultMessage 默认用户消息
 * @returns 用户友好的错误信息
 */
export function toUserFriendlyError(error: any, defaultMessage: string = '操作失败'): string {
  // 如果是 AppError 实例，直接返回用户消息
  if (error instanceof AppError) {
    return error.userMessage
  }

  // 记录原始错误到控制台（仅在开发环境）
  if (process.env.NODE_ENV === 'development') {
    console.error('详细错误信息:', error)
  }

  // 根据错误类型返回不同的用户友好消息
  const errorMessage = error?.message || ''

  // 网络相关错误
  if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
    return '网络请求超时，请检查网络连接'
  }
  if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('DNS')) {
    return '网络连接失败，请检查网络设置'
  }
  if (errorMessage.includes('ECONNREFUSED')) {
    return '无法连接到服务器'
  }

  // 钱包相关错误
  if (errorMessage.includes('insufficient funds')) {
    return '账户余额不足'
  }
  if (errorMessage.includes('invalid address')) {
    return '钱包地址无效'
  }
  if (errorMessage.includes('private key')) {
    return '私钥格式错误'
  }

  // 加密相关错误
  if (errorMessage.includes('decrypt') || errorMessage.includes('解密')) {
    return '密码错误或数据已损坏'
  }
  if (errorMessage.includes('password') || errorMessage.includes('密码')) {
    return '密码不正确'
  }

  // 数据库相关错误
  if (errorMessage.includes('UNIQUE constraint')) {
    return '该记录已存在'
  }
  if (errorMessage.includes('database')) {
    return '数据库操作失败'
  }

  // 返回默认消息
  return defaultMessage
}

/**
 * 安全地记录错误（不暴露敏感信息）
 * @param error 错误对象
 * @param context 上下文信息
 */
export function logError(error: any, context?: string): void {
  const timestamp = new Date().toISOString()
  const prefix = context ? `[${context}]` : ''
  
  if (error instanceof AppError) {
    console.error(`${timestamp} ${prefix} ${error.name}:`, {
      message: error.message,
      userMessage: error.userMessage,
      code: error.code,
      stack: error.stack
    })
  } else {
    console.error(`${timestamp} ${prefix} Error:`, {
      message: error?.message || String(error),
      stack: error?.stack
    })
  }
}

/**
 * 创建常见错误的工厂方法
 */
export const ErrorFactory = {
  /**
   * 创建密码错误
   */
  passwordError: (details?: string) => 
    new CryptoError(
      `Password validation failed: ${details}`,
      '密码格式不正确',
      'PASSWORD_INVALID'
    ),

  /**
   * 创建地址无效错误
   */
  invalidAddress: (network: string) => 
    new ValidationError(
      `Invalid ${network} address format`,
      `${network}钱包地址格式无效`,
      'ADDRESS_INVALID'
    ),

  /**
   * 创建网络连接错误
   */
  networkUnavailable: (network: string) => 
    new NetworkError(
      `All ${network} RPC nodes are unavailable`,
      `${network}网络暂时不可用，请稍后重试`,
      'NETWORK_UNAVAILABLE'
    ),

  /**
   * 创建数据库错误
   */
  databaseError: (operation: string) => 
    new DatabaseError(
      `Database operation failed: ${operation}`,
      '数据操作失败',
      'DATABASE_ERROR'
    ),

  /**
   * 创建钱包已存在错误
   */
  walletExists: () => 
    new WalletError(
      'Wallet with this address already exists',
      '该钱包地址已存在',
      'WALLET_EXISTS'
    ),

  /**
   * 创建钱包数量超限错误
   */
  walletLimitReached: (limit: number) => 
    new WalletError(
      `Wallet limit reached: ${limit}`,
      `钱包数量已达上限（${limit}个）`,
      'WALLET_LIMIT_REACHED'
    ),
}
