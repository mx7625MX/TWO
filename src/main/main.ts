import { app, BrowserWindow } from 'electron'
import path from 'path'
import { walletDB } from './database'
import { registerIPCHandlers, removeIPCHandlers } from './ipcHandlers'

// 定义全局窗口变量
let mainWindow: BrowserWindow | null = null

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // 开发环境加载Vite开发服务器
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    // 打开开发者工具
    mainWindow.webContents.openDevTools()
  } else {
    // 生产环境加载打包后的文件
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 当Electron完成初始化时创建窗口
app.whenReady().then(() => {
  // 初始化数据库
  try {
    walletDB.initialize()
    console.log('数据库初始化完成')
  } catch (error) {
    console.error('数据库初始化失败:', error)
  }

  // 注册IPC处理器
  registerIPCHandlers()

  createWindow()

  app.on('activate', () => {
    // 在macOS上，当点击dock图标并且没有其他窗口打开时，
    // 通常会在应用程序中重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 当所有窗口关闭时退出应用（除了macOS）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 应用退出前清理
app.on('before-quit', () => {
  // 移除IPC处理器
  removeIPCHandlers()
  // 关闭数据库连接
  walletDB.close()
})
