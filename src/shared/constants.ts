// 共享常量
export const APP_NAME = 'Meme Master Pro'
export const APP_VERSION = '1.0.0'

// 网络配置
export const NETWORK_CONFIG = {
  BSC: {
    CHAIN_ID: 56,
    RPC_URL: 'https://bsc-dataseed1.binance.org',
    CURRENCY: 'BNB',
  },
  SOLANA: {
    CHAIN_ID: 'mainnet-beta',
    RPC_URL: 'https://api.mainnet-beta.solana.com',
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
} as const
