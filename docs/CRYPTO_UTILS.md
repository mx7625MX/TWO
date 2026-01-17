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

## 常见问题 (FAQ)

### Q: 为什么解密失败？

**A**: 最常见的原因：
1. **密码错误** - 确保使用与加密时相同的密码
2. **数据损坏** - 检查加密字符串是否完整
3. **编码问题** - 确保字符串没有被错误转换

```typescript
try {
  const decrypted = decrypt(encrypted, password)
} catch (error) {
  if (error.message.includes('解密失败')) {
    console.error('密码可能不正确')
  }
}
```

### Q: 如何安全地存储密码？

**A**: 
- ✅ 使用操作系统的密钥链（Keychain/Keyring）
- ✅ 只存储密码的哈希值用于验证
- ❌ 不要将密码存储在数据库中
- ❌ 不要将密码硬编码在代码中

```typescript
import { hashPassword, verifyPasswordHash } from '@shared/cryptoUtils'

// 存储哈希值而不是密码
const hash = hashPassword('userPassword')
localStorage.setItem('passwordHash', hash)

// 验证密码
const isValid = verifyPasswordHash('userPassword', hash)
```

### Q: 多个钱包使用相同密码安全吗？

**A**: 
- 使用相同的主密码是可以的
- 每个钱包的私钥是独立的
- AES-256 加密足够安全
- 但建议启用额外的安全措施（如 2FA）

### Q: 加密后的数据可以跨平台使用吗？

**A**: 
✅ 可以。crypto-js 生成的 AES 加密数据是标准格式，可以在：
- 不同操作系统（Windows/macOS/Linux）
- 浏览器和 Node.js 环境
- 不同的加密库（只要支持 AES-256-CBC）

之间互通。

### Q: 如何处理忘记密码的情况？

**A**: 
⚠️ **重要提示**: 密码丢失后无法恢复私钥！

应对措施：
1. 提醒用户备份私钥和助记词（未加密版本）
2. 在创建钱包时提供明文私钥用于备份
3. 考虑实现密码找回机制（使用安全问题等）
4. 教育用户使用密码管理器

```typescript
// 创建钱包时提供明文私钥用于备份
const wallet = await walletManager.createWallet('钱包名', 'BSC')
console.log('请备份您的私钥:', wallet.privateKey)
console.log('请备份您的助记词:', wallet.mnemonic)
```

### Q: 性能问题 - 加密解密很慢吗？

**A**: 
AES-256 加密非常快速：
- **加密**: < 1ms（单个私钥）
- **解密**: < 1ms
- **批量操作**: 100个钱包 < 100ms

如果遇到性能问题：
```typescript
// ❌ 避免在循环中频繁加密
for (let i = 0; i < 1000; i++) {
  const encrypted = encrypt(privateKey, password)
}

// ✅ 缓存加密结果
const encrypted = encrypt(privateKey, password)
for (let i = 0; i < 1000; i++) {
  // 使用缓存的 encrypted
}
```

## 性能注意事项

### 1. 批量操作优化

```typescript
// ❌ 低效方式
const encryptedKeys = []
for (const wallet of wallets) {
  encryptedKeys.push(encrypt(wallet.privateKey, password))
}

// ✅ 高效方式
const encryptedKeys = wallets.map(wallet => 
  encrypt(wallet.privateKey, password)
)
```

### 2. 内存管理

```typescript
// 使用后清除敏感数据
let privateKey = decrypt(encrypted, password)
// 使用 privateKey...
privateKey = null // 清除引用
```

### 3. 异步操作

对于大量加密操作，考虑使用 Web Worker：

```typescript
// worker.ts
self.onmessage = (e) => {
  const { privateKey, password } = e.data
  const encrypted = encrypt(privateKey, password)
  self.postMessage(encrypted)
}

// main.ts
const worker = new Worker('worker.ts')
worker.postMessage({ privateKey, password })
worker.onmessage = (e) => {
  const encrypted = e.data
}
```

## 实际使用场景

### 场景 1: 用户登录验证

```typescript
// 注册时保存密码哈希
const passwordHash = hashPassword(userPassword)
await database.saveUser({ username, passwordHash })

// 登录时验证
const user = await database.getUser(username)
const isValid = verifyPasswordHash(inputPassword, user.passwordHash)
if (isValid) {
  // 创建 WalletManager 实例
  const manager = new WalletManager(inputPassword)
}
```

### 场景 2: 导出加密的钱包备份

```typescript
// 导出所有钱包为加密JSON
async function exportWallets(password: string) {
  const wallets = await database.getAllWallets()
  const exportData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    wallets: wallets.map(w => ({
      name: w.name,
      network: w.network,
      address: w.address,
      encrypted_key: w.encrypted_key
    }))
  }
  
  // 再次加密整个导出数据
  const encrypted = encryptObject(exportData, password)
  
  // 保存到文件
  const blob = new Blob([encrypted], { type: 'application/json' })
  saveAs(blob, 'wallets-backup.enc')
}

// 导入加密备份
async function importWallets(file: File, password: string) {
  const content = await file.text()
  const data = decryptObject(content, password)
  
  for (const wallet of data.wallets) {
    await database.insertWallet(wallet)
  }
}
```

### 场景 3: 跨设备同步

```typescript
// 设备A: 加密并上传
const wallets = await database.getAllWallets()
const encrypted = encryptObject(wallets, syncPassword)
await cloudStorage.upload('wallets.enc', encrypted)

// 设备B: 下载并解密
const encrypted = await cloudStorage.download('wallets.enc')
const wallets = decryptObject(encrypted, syncPassword)
for (const wallet of wallets) {
  await database.insertWallet(wallet)
}
```

### 场景 4: 临时解密用于交易

```typescript
async function sendTransaction(walletId: string, to: string, amount: string) {
  const wallet = await database.getWallet(walletId)
  
  // 临时解密私钥
  const privateKey = walletManager.decryptPrivateKey(wallet.encrypted_key)
  
  try {
    // 使用私钥签名交易
    const tx = await signAndSendTransaction(privateKey, to, amount)
    return tx
  } finally {
    // 确保清除私钥
    privateKey = null
  }
}
```

### 场景 5: 密码强度实时检查

```typescript
function PasswordInput() {
  const [password, setPassword] = useState('')
  const [strength, setStrength] = useState({ score: 0, description: '' })
  
  const handleChange = (value: string) => {
    setPassword(value)
    const result = validatePasswordStrength(value)
    setStrength(result)
  }
  
  return (
    <div>
      <input 
        type="password" 
        value={password}
        onChange={(e) => handleChange(e.target.value)}
      />
      <div className={`strength-${strength.score}`}>
        密码强度: {strength.description} ({strength.score}/4)
      </div>
      {strength.score < 3 && (
        <div className="warning">
          建议使用更强的密码（包含大小写、数字、特殊字符）
        </div>
      )}
    </div>
  )
}
```

---

**最后更新**: 2026-01-17  
**版本**: v1.0.0  
**维护者**: TWO 开发团队
