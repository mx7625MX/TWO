# Copilot Instructions for Meme Master Pro

## Project Overview

**Meme Master Pro** is an Electron-based multi-chain wallet manager supporting BSC (BNB Chain) and Solana networks. Built with React 18, TypeScript, and Vite, using AES-256 encryption for secure private key storage.

## Architecture

### Process Model (Electron)
- **Main Process** ([src/main/](../src/main/)): Node.js environment with database and crypto access
  - [main.ts](../src/main/main.ts): App lifecycle, window management
  - [database.ts](../src/main/database.ts): SQLite operations via `better-sqlite3`
  - [WalletManager.ts](../src/main/WalletManager.ts): Core wallet creation/encryption logic
  - [ipcHandlers.ts](../src/main/ipcHandlers.ts): IPC endpoint registration
- **Renderer Process** ([src/renderer/](../src/renderer/)): React UI in browser environment
  - Isolated with `contextIsolation`, communicates via [preload.ts](../src/main/preload.ts)
- **Preload Script**: Exposes `window.electronAPI` bridge for secure IPC

### Data Flow Pattern
```
Renderer (React) → window.electronAPI.wallet.create()
  → preload.ts ipcRenderer.invoke('wallet:create')
    → ipcHandlers.ts IPC_CHANNELS.WALLET_CREATE
      → WalletManager.createWallet() → encrypt()
        → database.ts insertWallet()
```

## Critical Patterns

### 1. Private Key Security
**Never store plaintext private keys in the database.** Always use [WalletManager](../src/main/WalletManager.ts):
```typescript
const manager = new WalletManager(userPassword)
const wallet = await manager.createWallet(name, network)
// wallet.encrypted_key → database
// wallet.privateKey → shown once to user, never persisted
```

Password requirements enforced by `validatePasswordStrength()`: ≥10 chars, uppercase, lowercase, digit, special char.

### 2. Network-Specific Key Formats
- **BSC**: `ethers.Wallet` produces `0x`-prefixed 66-char hex private keys
- **Solana**: `Keypair` secret keys stored as **Base64-encoded Uint8Array** (not hex)
  ```typescript
  // Solana import requires conversion
  const keypair = Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'))
  ```

### 3. IPC Communication Contract
All IPC handlers return `IPCResponse<T>`:
```typescript
{ success: true, data: T } | { success: false, error: string }
```
Never throw errors across IPC boundary - always catch and return structured response.

### 4. Database Constraints
- Max 100 wallets enforced in [database.ts](../src/main/database.ts) `insertWallet()`
- `address` column has `UNIQUE` constraint - check with `getWalletByAddress()` before insert
- Uses WAL mode for concurrent reads

## Development Workflows

### Build & Run
```bash
npm install                 # Install dependencies
npm run electron:dev        # Dev mode (hot reload at :5173)
npm run electron:build      # Production build
```

### Testing Strategy
Two test modes via [package.json](../package.json) scripts:
```bash
npm test                    # Quick local tests (no network calls)
npm run test:full           # Full integration tests (hits BSC/Solana RPCs)
```

**Test execution**: Uses `tsx` to run TypeScript directly without compilation. Tests import from [src/main/](../src/main/) and [src/shared/](../src/shared/) using `.js` extensions in imports (ESM requirement).

### Path Aliases
Configured in [vite.config.ts](../vite.config.ts):
- `@main` → `src/main`
- `@renderer` → `src/renderer`
- `@shared` → `src/shared`

Use these in renderer code. Main process uses relative paths.

## Type System

[types.ts](../src/shared/types.ts) defines the contract between processes:
- `CreateWalletInput`: User provides `name`, `network`, `password`
- `CreateWalletResult`: System returns `id`, `address`, `privateKey`, optional `mnemonic`
- `DatabaseWalletInput`: What gets persisted (includes `encrypted_key`, no plaintext keys)
- `Wallet`: Database record shape (includes `created_at` timestamp)

## External Dependencies

### Blockchain SDKs
- **BSC**: `ethers` v6.x for EVM operations
- **Solana**: `@solana/web3.js` for Solana RPC calls
- **Mnemonic**: `bip39` for 12/24-word phrases (BSC only currently)

### Encryption
- [cryptoUtils.ts](../src/shared/cryptoUtils.ts) uses `crypto-js` AES-256
- Functions are shared between main and renderer for validation UI

### UI Framework
- Ant Design (`antd`) for components
- Custom CSS in [src/renderer/*.css](../src/renderer/) for wallet-specific styling

## Common Pitfalls

1. **Don't use Node.js APIs in renderer** without exposing via preload
2. **Solana private keys are Base64**, not hex - conversion required
3. **Test with `npm test` first** - network tests are slow and can fail on rate limits
4. **Database auto-creates in userData** on first run - clean by deleting `wallets.db`
5. **Vite dev server runs on port 5173** - ensure not in use before `electron:dev`

## Project-Specific Conventions

- **File naming**: PascalCase for components/classes (e.g., `WalletManager.ts`), camelCase for utilities
- **Import extensions**: Use `.js` in imports even for `.ts` files (ESM requirement for tsx)
- **Error handling**: Wrap operations in try-catch, log to console, return user-friendly messages
- **Network labels**: Always uppercase `'BSC' | 'Solana'` in code
- **Timestamps**: Use `Date.now()` for `created_at` fields (milliseconds since epoch)
