# 加密工具使用文档

## 概述

本项目使用 `crypto-js` 库实现私钥的加密和解密功能，采用 AES（Advanced Encryption Standard）算法保护敏感数据。

## 文件结构

- `src/shared/cryptoUtils.ts` - 加密工具核心模块
- `src/shared/cryptoUtils.example.ts` - 使用示例
- `src/main/WalletManager.ts` - 钱包管理器（集成加密功能）

## 核心功能

### 1. 基本加密解密

#### `encrypt(privateKey: string, password: string): string`

使用AES算法加密私钥。

**参数：**
- `privateKey` - 需要加密的明文私钥
- `password` - 加密密码

**返回：**
- 加密后的字符串（Base64格式）

**示例：**
```typescript
import { encrypt } from '@shared/cryptoUtils'

const privateKey = '0x1234567890abcdef...'
const password = 'MySecurePassword123!'
const encrypted = encrypt(privateKey, password)
console.log(encrypted) // U2FsdGVkX1+...
```

#### `decrypt(encryptedKey: string, password: string): string`

解密加密的私钥。

**参数：**
- `encryptedKey` - 加密的私钥
- `password` - 解密密码

**返回：**
- 明文私钥

**示例：**
```typescript
import { decrypt } from '@shared/cryptoUtils'

const encrypted = 'U2FsdGVkX1+...'
const password = 'MySecurePassword123!'
const privateKey = decrypt(encrypted, password)
console.log(privateKey) // 0x1234567890abcdef...
```

### 2. 密码工具

#### `generateRandomPassword(length?: number): string`

生成安全的随机密码。

**参数：**
- `length` - 密码长度（默认32）

**返回：**
- 随机密码字符串

**示例：**
```typescript
import { generateRandomPassword } from '@shared/cryptoUtils'

const password = generateRandomPassword(32)
console.log(password) // 生成32字符的随机密码
```

#### `validatePasswordStrength(password: string)`

验证密码强度。

**参数：**
- `password` - 要验证的密码

**返回：**
```typescript
{
  score: number,      // 0-4分
  description: string // 强度描述
}
```

**示例：**
```typescript
import { validatePasswordStrength } from '@shared/cryptoUtils'

const result = validatePasswordStrength('P@ssw0rd!123')
console.log(result) // { score: 4, description: '非常强' }
```

#### `hashPassword(password: string): string`

生成密码的SHA256哈希值。

**示例：**
```typescript
import { hashPassword } from '@shared/cryptoUtils'

const hash = hashPassword('MyPassword123')
console.log(hash) // SHA256哈希值
```

#### `verifyPasswordHash(password: string, hash: string): boolean`

验证密码与哈希值是否匹配。

**示例：**
```typescript
import { verifyPasswordHash } from '@shared/cryptoUtils'

const isValid = verifyPasswordHash('MyPassword123', hash)
console.log(isValid) // true
```

### 3. 对象加密

#### `encryptObject(data: any, password: string): string`

加密整个对象。

**示例：**
```typescript
import { encryptObject } from '@shared/cryptoUtils'

const walletData = {
  id: '123',
  privateKey: '0xabc...',
  mnemonic: 'word1 word2...'
}

const encrypted = encryptObject(walletData, 'password123')
```

#### `decryptObject<T>(encryptedData: string, password: string): T`

解密对象数据。

**示例：**
```typescript
import { decryptObject } from '@shared/cryptoUtils'

const decrypted = decryptObject<WalletData>(encrypted, 'password123')
console.log(decrypted.privateKey)
```

## 在 WalletManager 中的应用

`WalletManager` 类已集成加密功能：

```typescript
import { WalletManager } from '@main/WalletManager'

// 创建钱包管理器实例（使用用户密码）
const walletManager = new WalletManager('UserPassword123!')

// 创建钱包（私钥会自动加密）
const wallet = await walletManager.createWallet('主钱包', 'BSC')
console.log(wallet.encrypted_key) // 加密的私钥
console.log(wallet.privateKey)     // 明文私钥（仅用于显示给用户备份）

// 解密私钥
const decrypted = walletManager.decryptPrivateKey(wallet.encrypted_key)
console.log(decrypted) // 明文私钥
```

## 安全最佳实践

1. **密码强度**
   - 建议密码长度至少 12 个字符
   - 包含大小写字母、数字和特殊字符
   - 使用 `validatePasswordStrength()` 检查强度

2. **密码存储**
   - 永远不要在代码中硬编码密码
   - 不要将密码存储在数据库中
   - 可以存储密码的哈希值用于验证

3. **私钥处理**
   - 私钥应始终加密存储
   - 明文私钥只在内存中短暂存在
   - 使用后立即清除明文私钥

4. **用户教育**
   - 提醒用户妥善保管密码
   - 密码丢失无法恢复
   - 建议用户备份私钥和助记词

## 加密算法说明

### AES (Advanced Encryption Standard)

- **算法类型**: 对称加密
- **密钥长度**: 256位
- **模式**: CBC（Cipher Block Chaining）
- **填充**: PKCS7
- **库**: crypto-js

### 为什么选择 AES？

1. **安全性**: AES-256 是目前最安全的对称加密算法之一
2. **性能**: 加密解密速度快，适合频繁操作
3. **标准化**: 被广泛采用的国际标准
4. **兼容性**: crypto-js 支持浏览器和 Node.js

## 错误处理

所有加密函数都会在失败时抛出异常：

```typescript
try {
  const encrypted = encrypt(privateKey, password)
} catch (error) {
  console.error('加密失败:', error.message)
  // 处理错误
}

try {
  const decrypted = decrypt(encrypted, wrongPassword)
} catch (error) {
  console.error('解密失败:', error.message)
  // 可能是密码错误
}
```

## 运行示例

查看 `src/shared/cryptoUtils.example.ts` 获取完整的使用示例：

```bash
# 在项目中运行示例
npx ts-node src/shared/cryptoUtils.example.ts
```

## API 总结

| 函数 | 用途 | 输入 | 输出 |
|------|------|------|------|
| `encrypt` | 加密私钥 | 私钥, 密码 | 加密字符串 |
| `decrypt` | 解密私钥 | 加密字符串, 密码 | 明文私钥 |
| `generateRandomPassword` | 生成随机密码 | 长度(可选) | 随机密码 |
| `validatePasswordStrength` | 验证密码强度 | 密码 | 分数和描述 |
| `hashPassword` | 生成密码哈希 | 密码 | SHA256哈希 |
| `verifyPasswordHash` | 验证密码 | 密码, 哈希 | 布尔值 |
| `encryptObject` | 加密对象 | 对象, 密码 | 加密字符串 |
| `decryptObject` | 解密对象 | 加密字符串, 密码 | 对象 |

## 更新日志

- **v1.0.0** - 初始版本
  - 实现基本的 AES 加密解密
  - 集成到 WalletManager
  - 添加密码工具函数
  - 支持对象加密

## 相关资源

- [crypto-js 文档](https://github.com/brix/crypto-js)
- [AES 加密标准](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard)
- [密码学最佳实践](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
