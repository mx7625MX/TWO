// 共享常量
export const APP_NAME = 'Meme Master Pro'
export const APP_VERSION = '1.0.0'

// RPC节点配置（支持故障切换）
export const RPC_ENDPOINTS = {
  BSC: [
    'https://bsc-dataseed1.binance.org',
    'https://bsc-dataseed2.binance.org',
    'https://bsc-dataseed3.binance.org',
    'https://bsc-dataseed4.binance.org',
    'https://bsc-dataseed1.defibit.io',
    'https://bsc-dataseed2.defibit.io',
  ],
  Solana: [
    'https://api.mainnet-beta.solana.com',
    'https://solana-api.projectserum.com',
    'https://rpc.ankr.com/solana',
    'https://solana-mainnet.g.alchemy.com/v2/demo',
  ]
} as const

// 网络配置
export const NETWORK_CONFIG = {
  BSC: {
    CHAIN_ID: 56,
    RPC_URLS: RPC_ENDPOINTS.BSC,
    CURRENCY: 'BNB',
  },
  SOLANA: {
    CHAIN_ID: 'mainnet-beta',
    RPC_URLS: RPC_ENDPOINTS.Solana,
    CURRENCY: 'SOL',
  },
} as const

// 钱包限制
export const WALLET_LIMITS = {
  MAX_WALLETS: 100,
  MIN_PASSWORD_LENGTH: 10,
  MAX_WALLET_NAME_LENGTH: 50,
} as const

// 加密配置
export const CRYPTO_CONFIG = {
  ENCRYPTION_ALGORITHM: 'AES',
  KEY_LENGTH: 256,
  PBKDF2_ITERATIONS: 100000, // PBKDF2迭代次数
  SALT_LENGTH: 16, // salt长度（字节）
  IV_LENGTH: 16, // IV长度（字节）
} as const

// 应用配置
export const CONFIG = {
  // 轮询间隔
  POLL_INTERVAL: 3000, // 3秒
  
  // 重试配置
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1秒
  
  // 超时配置
  REQUEST_TIMEOUT: 30000, // 30秒
  RPC_CONNECTION_TIMEOUT: 5000, // RPC连接超时 5秒
  BALANCE_QUERY_TIMEOUT: 10000, // 余额查询超时 10秒
  
  // 并发控制
  CONCURRENT_QUERIES: 5, // 最大并发查询数
  
  // 货币精度
  CURRENCY_DECIMALS: {
    BSC: 18, // BNB使用18位小数
    Solana: 9, // SOL使用9位小数
  } as const,
  
  // 费用估算（lamports/wei）
  ESTIMATED_FEES: {
    BSC_GAS_LIMIT: 21000, // ETH转账标准gas limit
    BSC_GAS_PRICE_MULTIPLIER: 1.1, // gas price乘数（留10%余量）
    SOLANA_TX_FEE: 5000, // Solana交易费用（lamports）
  } as const,
  
  // 私钥格式
  KEY_FORMATS: {
    BSC_PRIVATE_KEY_LENGTH: 66, // 包含0x前缀
    BSC_ADDRESS_LENGTH: 42, // 包含0x前缀
    SOLANA_PRIVATE_KEY_LENGTH: 64, // 字节数
    SOLANA_ADDRESS_MIN_LENGTH: 32, // Base58编码最小长度
    SOLANA_ADDRESS_MAX_LENGTH: 44, // Base58编码最大长度
  } as const,
  
  // 助记词配置
  MNEMONIC: {
    WORD_COUNT_12: 12,
    WORD_COUNT_24: 24,
    STRENGTH_128: 128, // 12个单词
    STRENGTH_256: 256, // 24个单词
  } as const,
  
  // 显示配置
  BALANCE_DISPLAY_DECIMALS: 4, // 余额显示小数位数
  PERCENTAGE_DECIMALS: 2, // 百分比显示小数位数
} as const
