/**
 * src/renderer/App.tsx
 * 主应用组件 - 集成所有功能模块
 */

import React, { useState, useEffect, createContext, useContext } from 'react'
import { Layout, Menu, Button, Badge, Avatar, Dropdown, Space, Tabs } from 'antd'
import {
  DashboardOutlined,
  WalletOutlined,
  DollarOutlined,
  RocketOutlined,
  ShoppingCartOutlined,
  UnorderedListOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import './App.css'

// 导入页面组件
import Login from './Login'
import WalletList from './WalletList'
import MultiChainBalanceChecker from './MultiChainBalanceChecker'
// import LaunchToken from './LaunchToken' // 临时注释：组件未实现
// import BundleBuy from './BundleBuy' // 临时注释：组件未实现
// import LaunchTasks from './LaunchTasks' // 临时注释：该组件使用了不存在的 shadcn/ui 库

const { Header, Sider, Content } = Layout
const { TabPane } = Tabs

// ==================== 类型定义 ====================

interface User {
  id: string
  username: string
  isAuthenticated: boolean
}

interface AppContextType {
  user: User | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

// ==================== 全局 Context ====================

const AppContext = createContext<AppContextType | undefined>(undefined)

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

// ==================== App Provider ====================

interface AppProviderProps {
  children: React.ReactNode
}

const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)

  // 从本地存储恢复登录状态
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Failed to parse saved user:', error)
      }
    }
  }, [])

  const login = async (username: string, password: string) => {
    // 模拟登录（实际应该调用后端 API）
    const mockUser: User = {
      id: '1',
      username,
      isAuthenticated: true
    }

    setUser(mockUser)
    localStorage.setItem('user', JSON.stringify(mockUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  const value: AppContextType = {
    user,
    login,
    logout
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// ==================== 主布局组件 ====================

const MainLayout: React.FC = () => {
  const { user, logout } = useApp()
  const [collapsed, setCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      logout()
    }
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ]

  const tabItems = [
    {
      key: 'dashboard',
      label: (
        <span>
          <DashboardOutlined />
          Dashboard
        </span>
      ),
      children: (
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-gray-500 text-sm">Total Wallets</div>
              <div className="text-3xl font-bold mt-2">0</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-gray-500 text-sm">Active Tasks</div>
              <div className="text-3xl font-bold mt-2">0</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-gray-500 text-sm">Total Launches</div>
              <div className="text-3xl font-bold mt-2">0</div>
            </div>
          </div>
          <p className="mt-6 text-gray-600">
            欢迎使用 Meme Master Pro！使用标签页导航切换不同功能。
          </p>
        </div>
      )
    },
    {
      key: 'wallets',
      label: (
        <span>
          <WalletOutlined />
          钱包管理
        </span>
      ),
      children: <WalletList />
    },
    {
      key: 'balance',
      label: (
        <span>
          <DollarOutlined />
          余额查询
        </span>
      ),
      children: <MultiChainBalanceChecker />
    },
    // 临时注释：LaunchToken 组件未实现
    // {
    //   key: 'launch',
    //   label: (
    //     <span>
    //       <RocketOutlined />
    //       发币
    //     </span>
    //   ),
    //   children: <LaunchToken />
    // },
    // 临时注释：BundleBuy 组件未实现
    // {
    //   key: 'bundle',
    //   label: (
    //     <span>
    //       <ShoppingCartOutlined />
    //       批量买入
    //     </span>
    //   ),
    //   children: <BundleBuy />
    // }
    // 临时注释：LaunchTasks 组件使用了不存在的 shadcn/ui 库
    // {
    //   key: 'tasks',
    //   label: (
    //     <span>
    //       <UnorderedListOutlined />
    //       任务列表
    //     </span>
    //   ),
    //   children: <LaunchTasks />
    // }
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginRight: '24px' }}>
            Meme Master Pro
          </div>
          <Badge count="v1.0.0" style={{ backgroundColor: '#52c41a' }} />
        </div>
        <Space>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.username}</span>
            </Space>
          </Dropdown>
        </Space>
      </Header>

      <Content style={{ padding: '24px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="card"
        />
      </Content>
    </Layout>
  )
}

// ==================== 主 App 组件 ====================

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    setIsLoggedIn(!!savedUser)
  }, [])

  return (
    <AppProvider>
      {isLoggedIn ? <MainLayout /> : <Login />}
    </AppProvider>
  )
}

export default App
