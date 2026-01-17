import CryptoJS from 'crypto-js'

/**
 * 加密工具类
 * 使用AES算法加密和解密私钥
 */

/**
 * 加密私钥
 * 使用PBKDF2密钥派生 + AES-256-CBC + 随机salt和IV
 * @param privateKey 明文私钥
 * @param password 加密密码
 * @returns 加密后的私钥字符串（Base64：salt + iv + ciphertext）
 */
export function encrypt(privateKey: string, password: string): string {
  try {
    if (!privateKey) {
      throw new Error('私钥不能为空')
    }
    if (!password) {
      throw new Error('密码不能为空')
    }

    // 生成随机盐（16字节）
    const salt = CryptoJS.lib.WordArray.random(128 / 8)
    
    // 使用PBKDF2派生密钥（100,000次迭代，防止暴力破解）
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 100000
    })
    
    // 生成随机IV（16字节）
    const iv = CryptoJS.lib.WordArray.random(128 / 8)
    
    // 使用AES-256-CBC模式加密
    const encrypted = CryptoJS.AES.encrypt(privateKey, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    })
    
    // 组合：salt(16) + iv(16) + ciphertext
    const combined = CryptoJS.lib.WordArray.create()
      .concat(salt)
      .concat(iv)
      .concat(encrypted.ciphertext)
    
    return combined.toString(CryptoJS.enc.Base64)
  } catch (error: any) {
    console.error('加密失败:', error)
    throw new Error(`加密失败: ${error.message}`)
  }
}

/**
 * 解密私钥
 * @param encryptedKey 加密的私钥（Base64：salt + iv + ciphertext）
 * @param password 解密密码
 * @returns 明文私钥
 */
export function decrypt(encryptedKey: string, password: string): string {
  try {
    if (!encryptedKey) {
      throw new Error('加密数据不能为空')
    }
    if (!password) {
      throw new Error('密码不能为空')
    }

    // 解析Base64
    const combined = CryptoJS.enc.Base64.parse(encryptedKey)
    
    // 提取各部分（salt: 16字节=4 words, iv: 16字节=4 words）
    const salt = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4))
    const iv = CryptoJS.lib.WordArray.create(combined.words.slice(4, 8))
    const ciphertext = CryptoJS.lib.WordArray.create(combined.words.slice(8))
    
    // 使用相同参数派生密钥
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 100000
    })
    
    // 构造加密对象
    const encryptedObj = CryptoJS.lib.CipherParams.create({
      ciphertext: ciphertext
    })
    
    // 解密
    const decrypted = CryptoJS.AES.decrypt(encryptedObj, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    })
    
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8)
    
    if (!plaintext) {
      throw new Error('解密失败，密码可能不正确')
    }
    
    return plaintext
  } catch (error: any) {
    console.error('解密失败:', error)
    throw new Error(`解密失败: ${error.message}`)
  }
}

/**
 * 生成安全的随机密码
 * @param length 密码长度（默认32）
 * @returns 随机密码字符串
 */
export function generateRandomPassword(length: number = 32): string {
  const wordArray = CryptoJS.lib.WordArray.random(length / 2)
  return wordArray.toString()
}

/**
 * 验证密码强度
 * @param password 密码
 * @returns 密码强度分数（0-4）和描述
 */
export function validatePasswordStrength(password: string): {
  score: number
  description: string
} {
  let score = 0

  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  const descriptions = ['非常弱', '弱', '中等', '强', '非常强']
  
  return {
    score: Math.min(score, 4),
    description: descriptions[Math.min(score, 4)],
  }
}

/**
 * 生成密码的哈希值（用于验证）
 * @param password 密码
 * @returns SHA256哈希值
 */
export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString()
}

/**
 * 验证密码哈希
 * @param password 密码
 * @param hash 哈希值
 * @returns 是否匹配
 */
export function verifyPasswordHash(password: string, hash: string): boolean {
  const computedHash = hashPassword(password)
  return computedHash === hash
}

/**
 * 加密对象数据
 * @param data 要加密的对象
 * @param password 加密密码
 * @returns 加密后的字符串
 */
export function encryptObject(data: any, password: string): string {
  try {
    const jsonString = JSON.stringify(data)
    return encrypt(jsonString, password)
  } catch (error: any) {
    throw new Error(`对象加密失败: ${error.message}`)
  }
}

/**
 * 解密对象数据
 * @param encryptedData 加密的数据
 * @param password 解密密码
 * @returns 解密后的对象
 */
export function decryptObject<T = any>(encryptedData: string, password: string): T {
  try {
    const jsonString = decrypt(encryptedData, password)
    return JSON.parse(jsonString)
  } catch (error: any) {
    throw new Error(`对象解密失败: ${error.message}`)
  }
}
