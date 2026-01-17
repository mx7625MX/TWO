# P3级优化文档

## 概述

本文档介绍了P3级（低优先级）优化的实施内容，包括结构化日志、类型守卫和配置常量化。

## 1. 结构化日志 (logger.ts)

### 位置
`src/shared/logger.ts`

### 功能
使用 `pino` 库提供高性能的结构化日志记录，支持：
- JSON格式日志（生产环境）
- 漂亮打印（开发环境）
- 日志级别控制
- 性能监控
- 模块化日志
- 安全的错误日志（不暴露敏感信息）

### 使用示例

#### 基础日志
```typescript
import { logger } from '../shared/logger'

// 不同级别的日志
logger.trace('详细调试信息')
logger.debug('调试信息')
logger.info('一般信息')
logger.warn('警告信息')
logger.error('错误信息')
logger.fatal('致命错误')
```

#### 带上下文的日志
```typescript
logger.info({ 
  module: 'wallet',
  action: 'create',
  walletId: wallet.id,
  network: 'BSC'
}, '钱包创建成功')

// 输出: {"level":"info","module":"wallet","action":"create","walletId":"xxx","network":"BSC","msg":"钱包创建成功"}
```

#### 模块日志
```typescript
import { createModuleLogger } from '../shared/logger'

const dbLogger = createModuleLogger('database')
dbLogger.info('数据库连接成功')
dbLogger.error({ table: 'wallets' }, '查询失败')
```

#### 安全错误日志
```typescript
import { logErrorSafe } from '../shared/logger'

try {
  await sensitiveOperation()
} catch (error) {
  logErrorSafe(error, { 
    module: 'wallet', 
    action: 'create',
    walletId: 'xxx'
  })
  // 不会记录私钥等敏感信息
}
```

#### 性能监控
```typescript
import { startTimer, logPerformance } from '../shared/logger'

// 方式1: 自动计时
const end = startTimer('createWallet', { walletId: 'xxx' })
await createWallet()
end() // 自动记录耗时

// 方式2: 手动记录
const start = Date.now()
await operation()
logPerformance('operation', Date.now() - start, { context: 'value' })
```

### 日志级别
```typescript
import { LOG_LEVELS } from '../shared/logger'

// 设置环境变量
// LOG_LEVEL=debug npm run dev
// LOG_LEVEL=error npm run electron:build

// 代码中使用
if (logger.level <= LOG_LEVELS.DEBUG) {
  // 执行调试代码
}
```

### 配置
- **开发环境**: 使用 `pino-pretty` 彩色输出
- **生产环境**: JSON格式输出，便于日志收集和分析
- **日志级别**: 通过 `LOG_LEVEL` 环境变量控制

## 2. 类型守卫 (guards.ts)

### 位置
`src/shared/guards.ts`

### 功能
提供运行时类型检查和验证，确保数据类型安全：
- 接口类型检查
- 地址格式验证
- IPC响应验证
- 安全JSON解析
- 类型断言

### 使用示例

#### 类型检查
```typescript
import { isWallet, isCreateWalletInput, isWalletBalance } from '../shared/guards'

// 检查是否为Wallet类型
if (isWallet(data)) {
  // TypeScript现在知道data是Wallet类型
  console.log(data.address)
  console.log(data.network)
}

// 验证用户输入
if (!isCreateWalletInput(input)) {
  throw new Error('无效的创建钱包输入')
}
```

#### IPC响应处理
```typescript
import { isSuccessResponse, isErrorResponse } from '../shared/guards'

const response = await window.electronAPI.wallet.list()

if (isSuccessResponse(response)) {
  // response.data 可用且类型安全
  const wallets = response.data
  wallets.forEach(w => console.log(w.address))
} else if (isErrorResponse(response)) {
  // response.error 可用
  console.error(response.error)
}
```

#### 地址验证
```typescript
import { isBSCAddress, isSolanaAddress, isValidAddress } from '../shared/guards'

// BSC地址
if (isBSCAddress(address)) {
  // 0x开头的40字符十六进制地址
}

// Solana地址
if (isSolanaAddress(address)) {
  // Base58编码，32-44字符
}

// 根据网络验证
if (isValidAddress(address, 'BSC')) {
  // 有效的BSC地址
}
```

#### 类型断言
```typescript
import { assertType, isCreateWalletInput } from '../shared/guards'

// 如果验证失败会抛出错误
assertType(input, isCreateWalletInput, '无效的创建钱包输入')
// 继续执行，input保证是CreateWalletInput类型
```

#### 安全JSON解析
```typescript
import { safeParse, isWallet } from '../shared/guards'

const jsonString = localStorage.getItem('wallet')
const data = safeParse<Wallet>(jsonString)

if (data && isWallet(data)) {
  // 安全使用
  console.log(data.address)
}
```

#### 辅助验证
```typescript
import { 
  isNonEmptyArray, 
  isNonEmptyString, 
  isInRange 
} from '../shared/guards'

// 非空数组
if (isNonEmptyArray(wallets)) {
  // wallets有至少一个元素
}

// 非空字符串
if (isNonEmptyString(name)) {
  // name非空且非仅空白字符
}

// 数字范围
if (isInRange(slippage, 0, 100)) {
  // slippage在0-100之间
}
```

## 3. 配置常量化 (constants.ts)

### 位置
`src/shared/constants.ts`

### 功能
将项目中的魔术数字和硬编码值集中管理，提高可维护性。

### 新增配置项

#### CONFIG对象
```typescript
import { CONFIG } from '../shared/constants'

// 轮询间隔
CONFIG.POLL_INTERVAL // 3000ms (3秒)

// 重试配置
CONFIG.MAX_RETRY_ATTEMPTS // 3次
CONFIG.RETRY_DELAY // 1000ms (1秒)

// 超时配置
CONFIG.REQUEST_TIMEOUT // 30000ms (30秒)
CONFIG.RPC_CONNECTION_TIMEOUT // 5000ms (5秒)
CONFIG.BALANCE_QUERY_TIMEOUT // 10000ms (10秒)

// 并发控制
CONFIG.CONCURRENT_QUERIES // 5个并发查询

// 货币精度
CONFIG.CURRENCY_DECIMALS.BSC // 18 (BNB)
CONFIG.CURRENCY_DECIMALS.Solana // 9 (SOL)

// 费用估算
CONFIG.ESTIMATED_FEES.BSC_GAS_LIMIT // 21000
CONFIG.ESTIMATED_FEES.BSC_GAS_PRICE_MULTIPLIER // 1.1
CONFIG.ESTIMATED_FEES.SOLANA_TX_FEE // 5000 lamports

// 私钥格式
CONFIG.KEY_FORMATS.BSC_PRIVATE_KEY_LENGTH // 66 (含0x)
CONFIG.KEY_FORMATS.BSC_ADDRESS_LENGTH // 42 (含0x)
CONFIG.KEY_FORMATS.SOLANA_PRIVATE_KEY_LENGTH // 64字节
CONFIG.KEY_FORMATS.SOLANA_ADDRESS_MIN_LENGTH // 32
CONFIG.KEY_FORMATS.SOLANA_ADDRESS_MAX_LENGTH // 44

// 助记词配置
CONFIG.MNEMONIC.WORD_COUNT_12 // 12
CONFIG.MNEMONIC.WORD_COUNT_24 // 24
CONFIG.MNEMONIC.STRENGTH_128 // 12个单词
CONFIG.MNEMONIC.STRENGTH_256 // 24个单词

// 显示配置
CONFIG.BALANCE_DISPLAY_DECIMALS // 4位小数
CONFIG.PERCENTAGE_DECIMALS // 2位小数
```

#### CRYPTO_CONFIG扩展
```typescript
import { CRYPTO_CONFIG } from '../shared/constants'

CRYPTO_CONFIG.ENCRYPTION_ALGORITHM // 'AES'
CRYPTO_CONFIG.KEY_LENGTH // 256位
CRYPTO_CONFIG.PBKDF2_ITERATIONS // 100000次
CRYPTO_CONFIG.SALT_LENGTH // 16字节
CRYPTO_CONFIG.IV_LENGTH // 16字节
```

### 使用示例

#### 替换前（硬编码）
```typescript
// ❌ 不好 - 魔术数字
setTimeout(poll, 3000)
const key = CryptoJS.lib.WordArray.random(128 / 8)
const iterations = 100000
```

#### 替换后（使用常量）
```typescript
// ✅ 好 - 使用配置常量
import { CONFIG, CRYPTO_CONFIG } from '../shared/constants'

setTimeout(poll, CONFIG.POLL_INTERVAL)
const key = CryptoJS.lib.WordArray.random(CRYPTO_CONFIG.SALT_LENGTH)
const iterations = CRYPTO_CONFIG.PBKDF2_ITERATIONS
```

## 4. 修改的文件清单

### 新增文件
1. `src/shared/logger.ts` - 结构化日志系统
2. `src/shared/guards.ts` - 类型守卫工具
3. `docs/P3_OPTIMIZATIONS.md` - 本文档

### 修改文件
1. **src/shared/constants.ts**
   - 新增 `CONFIG` 对象
   - 扩展 `CRYPTO_CONFIG` 对象
   - 集中管理所有配置常量

2. **src/shared/cryptoUtils.ts**
   - 导入并使用 `CONFIG`、`CRYPTO_CONFIG`
   - 替换硬编码的加密参数

3. **src/main/WalletManager.ts**
   - 导入 `CONFIG`、`PublicKey`
   - 替换地址验证、助记词、并发控制等硬编码值

4. **src/main/ipcHandlers.ts**
   - 导入并使用 `CONFIG.BALANCE_QUERY_TIMEOUT`
   - 替换超时时间硬编码

5. **src/main/database.ts**
   - 导入并使用 `WALLET_LIMITS`
   - 替换钱包数量限制

6. **src/shared/bscUtils.ts**
   - 导入并使用 `CONFIG.RPC_CONNECTION_TIMEOUT`
   - 替换RPC连接超时时间

7. **src/shared/solanaUtils.ts**
   - 导入并使用 `CONFIG.RPC_CONNECTION_TIMEOUT`
   - 替换RPC连接超时时间

8. **src/shared/transferUtils.ts**
   - 导入并使用 `CONFIG.ESTIMATED_FEES.SOLANA_TX_FEE`
   - 替换Solana交易费用硬编码

9. **package.json**
   - 新增依赖: `pino@10.2.0`, `pino-pretty@13.1.3` (已安装)

## 5. 迁移建议

### 逐步替换console.log
建议在后续开发中逐步将 `console.log` 替换为结构化日志：

```typescript
// 替换前
console.log('钱包创建成功:', wallet.id)
console.error('创建失败:', error)

// 替换后
import { logger } from '../shared/logger'

logger.info({ walletId: wallet.id }, '钱包创建成功')
logger.error({ error }, '创建失败')
```

### 添加类型守卫到IPC处理器
在IPC处理器中添加输入验证：

```typescript
import { assertType, isCreateWalletInput } from '../shared/guards'

ipcMain.handle('wallet:create', async (_event, input) => {
  try {
    // 验证输入类型
    assertType(input, isCreateWalletInput, '无效的创建钱包输入')
    
    // 继续处理...
  } catch (error) {
    // ...
  }
})
```

## 6. 测试结果

所有现有测试通过：
```
Test Suites: 4 passed, 5 total
Tests:       45 passed, 45 total
Time:        3.715 s
```

新增文件未破坏任何现有功能。

## 7. 优势

### 结构化日志
- ✅ 便于日志收集和分析
- ✅ 生产环境性能更好
- ✅ 支持日志级别过滤
- ✅ 统一的日志格式
- ✅ 不暴露敏感信息

### 类型守卫
- ✅ 运行时类型安全
- ✅ 减少类型错误
- ✅ 更好的错误提示
- ✅ IDE自动补全支持
- ✅ 代码更易维护

### 配置常量化
- ✅ 集中管理配置
- ✅ 易于调整参数
- ✅ 减少魔术数字
- ✅ 提高代码可读性
- ✅ 便于测试和调试

## 8. 后续改进

1. **逐步迁移日志**
   - 在新代码中使用 `logger`
   - 逐步替换现有的 `console.log`

2. **扩展类型守卫**
   - 为新增类型添加守卫函数
   - 在API边界添加验证

3. **配置外部化**
   - 考虑将配置移到配置文件
   - 支持环境变量覆盖

4. **日志分析**
   - 集成日志收集服务（如ELK）
   - 添加日志监控和告警

## 9. 注意事项

1. **日志级别**: 生产环境建议使用 `info` 或更高级别，避免过多日志
2. **敏感信息**: 永远不要记录私钥、密码等敏感信息
3. **类型守卫**: 仅用于运行时验证，不能替代TypeScript编译时检查
4. **配置修改**: 修改CONFIG值后需要重新编译和部署

## 10. 相关文档

- [CRYPTO_UTILS.md](./CRYPTO_UTILS.md) - 加密工具文档
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - 测试指南
- [Pino文档](https://github.com/pinojs/pino) - 官方日志库文档
- [TypeScript类型守卫](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) - 官方文档
