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
} as const
