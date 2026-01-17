import pino from 'pino'

/**
 * 结构化日志记录器
 * 使用pino库提供高性能的结构化日志
 */

// 判断是否为主进程
const isMainProcess = typeof process !== 'undefined' && process.type === 'browser'

// 开发环境配置（漂亮打印）
const developmentTransport = pino.transport({
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname',
    messageFormat: '{levelLabel} - {msg}',
    errorLikeObjectKeys: ['err', 'error'],
  }
})

// 生产环境配置（JSON格式）
const productionTransport = undefined // 默认JSON输出

/**
 * 创建日志记录器实例
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  
  // 开发环境使用pino-pretty，生产环境使用JSON
  transport: process.env.NODE_ENV === 'development' ? developmentTransport : productionTransport,
  
  // 基础配置
  base: {
    env: process.env.NODE_ENV || 'development',
    processType: isMainProcess ? 'main' : 'renderer'
  },
  
  // 时间戳
  timestamp: pino.stdTimeFunctions.isoTime,
  
  // 格式化错误对象
  formatters: {
    level: (label) => {
      return { level: label }
    },
    bindings: (bindings) => {
      return { 
        pid: bindings.pid, 
        host: bindings.hostname 
      }
    }
  },
  
  // 序列化器
  serializers: {
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  }
})

/**
 * 日志上下文类型
 */
export interface LogContext {
  module?: string
  action?: string
  walletId?: string
  walletAddress?: string
  network?: 'BSC' | 'Solana'
  txHash?: string
  [key: string]: any
}

/**
 * 创建子日志记录器（带模块标识）
 * @param module 模块名称
 * @returns 子日志记录器
 */
export function createModuleLogger(module: string) {
  return logger.child({ module })
}

/**
 * 安全地记录错误（不暴露敏感信息）
 * @param error 错误对象
 * @param context 上下文信息
 * @returns 安全的错误描述
 */
export function logErrorSafe(error: any, context?: LogContext): void {
  const safeError = {
    message: error.message || '未知错误',
    name: error.name || 'Error',
    code: error.code,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  }
  
  logger.error({ ...context, error: safeError }, '操作失败')
}

/**
 * 记录性能指标
 * @param operation 操作名称
 * @param duration 耗时（毫秒）
 * @param context 上下文信息
 */
export function logPerformance(operation: string, duration: number, context?: LogContext): void {
  logger.info({ 
    ...context, 
    operation, 
    duration, 
    unit: 'ms' 
  }, `性能指标: ${operation}`)
}

/**
 * 创建性能计时器
 * @param operation 操作名称
 * @returns 结束函数
 */
export function startTimer(operation: string, context?: LogContext) {
  const start = Date.now()
  return () => {
    const duration = Date.now() - start
    logPerformance(operation, duration, context)
  }
}

// 导出日志级别常量
export const LOG_LEVELS = {
  TRACE: 10,
  DEBUG: 20,
  INFO: 30,
  WARN: 40,
  ERROR: 50,
  FATAL: 60,
} as const

// 使用示例（注释）
/*
使用方法:

import { logger, createModuleLogger, logErrorSafe, startTimer } from './logger'

// 1. 基础使用
logger.info('应用启动')
logger.debug({ userId: '123' }, '用户登录')
logger.error({ error: err }, '操作失败')

// 2. 模块日志
const dbLogger = createModuleLogger('database')
dbLogger.info('数据库连接成功')
dbLogger.error({ table: 'wallets' }, '查询失败')

// 3. 安全错误日志
try {
  await sensitiveOperation()
} catch (error) {
  logErrorSafe(error, { module: 'wallet', action: 'create' })
}

// 4. 性能监控
const end = startTimer('createWallet', { walletId: 'xxx' })
await createWallet()
end() // 自动记录耗时

// 5. 带上下文的日志
logger.info({ 
  module: 'wallet',
  action: 'create',
  walletId: wallet.id,
  network: 'BSC'
}, '钱包创建成功')
*/

