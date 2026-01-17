import { contextBridge, ipcRenderer } from 'electron'
import type { CreateWalletInput, CreateWalletResult, ImportWalletInput, ImportWalletResult, GetBalanceParams, IPCResponse, Wallet, WalletBalance } from '../shared/types'

// IPC通信频道常量
const IPC_CHANNELS = {
  WALLET_CREATE: 'wallet:create',
  WALLET_IMPORT: 'wallet:import',
  WALLET_LIST: 'wallet:list',
  WALLET_BALANCE: 'wallet:balance',
  WALLET_GET_BY_ID: 'wallet:getById',
  WALLET_UPDATE_NAME: 'wallet:updateName',
  WALLET_DELETE: 'wallet:delete',
} as const

// 暴露受保护的方法到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 钱包操作API
  wallet: {
    /**
     * 创建新钱包
     */
    create: (input: CreateWalletInput): Promise<IPCResponse<CreateWalletResult>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.WALLET_CREATE, input)
    },

    /**
     * 导入钱包
     */
    import: (input: ImportWalletInput): Promise<IPCResponse<ImportWalletResult>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.WALLET_IMPORT, input)
    },

    /**
     * 获取所有钱包列表
     */
    list: (): Promise<IPCResponse<Wallet[]>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.WALLET_LIST)
    },

    /**
     * 获取钱包余额
     */
    getBalance: (params: GetBalanceParams): Promise<IPCResponse<WalletBalance>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.WALLET_BALANCE, params)
    },

    /**
     * 根据ID获取钱包
     */
    getById: (id: string): Promise<IPCResponse<Wallet | null>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.WALLET_GET_BY_ID, id)
    },

    /**
     * 更新钱包名称
     */
    updateName: (id: string, name: string): Promise<IPCResponse<boolean>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.WALLET_UPDATE_NAME, id, name)
    },

    /**
     * 删除钱包
     */
    delete: (id: string): Promise<IPCResponse<boolean>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.WALLET_DELETE, id)
    },
  },

  // 获取应用版本等信息
  getVersion: (): NodeJS.ProcessVersions => {
    return process.versions
  },

  // 通用 invoke 方法
  invoke: (channel: string, ...args: any[]): Promise<any> => {
    return ipcRenderer.invoke(channel, ...args)
  },

  // 事件监听
  on: (channel: string, callback: (...args: any[]) => void) => {
    const validChannels = ['launch:progress', 'bundle:progress', 'wallet:update']
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, callback)
    }
  },

  // 移除事件监听
  removeListener: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback)
  },

  // Launch API (发币功能)
  launch: {
    onLaunchProgress: (callback: (event: any, data: any) => void) => {
      ipcRenderer.on('launch:progress', callback)
    },
    removeLaunchProgressListener: (callback: (event: any, data: any) => void) => {
      ipcRenderer.removeListener('launch:progress', callback)
    }
  },

  // Bundle API (批量买入功能)
  bundle: {
    onBundleProgress: (callback: (event: any, data: any) => void) => {
      ipcRenderer.on('bundle:progress', callback)
    },
    removeBundleProgressListener: (callback: (event: any, data: any) => void) => {
      ipcRenderer.removeListener('bundle:progress', callback)
    }
  }
})
