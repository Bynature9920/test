import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService } from '@/services/api/authService'
import { tokenStorage } from '@/utils/tokenStorage'

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  loginWithGoogle: (idToken: string, accessToken?: string) => Promise<void>
  logout: () => void
  loading: boolean
}

interface User {
  id: string
  email: string
  phone: string
  first_name: string
  last_name: string
  kyc_status: string
}

interface RegisterData {
  email: string
  password: string
  phone: string
  first_name: string
  last_name: string
  country_code: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = tokenStorage.getAccessToken()
    if (token) {
      // Check if it's a demo token
      if (token === 'demo-access-token') {
        const demoUser: User = {
          id: 'demo-user-123',
          email: 'demo@fintech.com',
          phone: '+2348012345678',
          first_name: 'Demo',
          last_name: 'User',
          kyc_status: 'verified',
        }
        setUser(demoUser)
        setIsAuthenticated(true)
        setLoading(false)
        return
      }
      
      // Check if it's a demo token for a registered user
      if (token.startsWith('demo-token-')) {
        const userId = token.replace('demo-token-', '')
        const demoUsers = JSON.parse(localStorage.getItem('demo_users') || '[]')
        const demoUser = demoUsers.find((u: User) => u.id === userId)
        if (demoUser) {
          setUser(demoUser)
          setIsAuthenticated(true)
          setLoading(false)
          return
        }
      }

      // Real API check
      try {
        const userData = await authService.getCurrentUser()
        setUser(userData)
        setIsAuthenticated(true)
      } catch (error) {
        tokenStorage.clearTokens()
        setIsAuthenticated(false)
        setUser(null)
      }
    }
    setLoading(false)
  }

  const login = async (email: string, password: string) => {
    // PRIORITY 1: Allow demo login with demo credentials (always works, no API call)
    if (email === 'demo@fintech.com' && password === 'demo123') {
      const demoUser: User = {
        id: 'demo-user-123',
        email: 'demo@fintech.com',
        phone: '+2348012345678',
        first_name: 'Demo',
        last_name: 'User',
        kyc_status: 'verified',
      }
      tokenStorage.setTokens('demo-access-token', 'demo-refresh-token')
      setUser(demoUser)
      setIsAuthenticated(true)
      return
    }
    
    // PRIORITY 2: Check localStorage for registered demo users (no API call)
    const demoUsers = JSON.parse(localStorage.getItem('demo_users') || '[]')
    const demoUser = demoUsers.find((u: User) => u.email === email)
    
    // If user exists in demo storage, allow login with any password
    if (demoUser) {
      tokenStorage.setTokens(`demo-token-${demoUser.id}`, `demo-refresh-${demoUser.id}`)
      setUser(demoUser)
      setIsAuthenticated(true)
      return
    }

    // PRIORITY 3: Try real API login (only if not a demo user)
    try {
      const response = await authService.login(email, password)
      tokenStorage.setTokens(response.access_token, response.refresh_token)
      const userData = await authService.getCurrentUser()
      setUser(userData)
      setIsAuthenticated(true)
    } catch (error: any) {
      // If API fails, check if it's a network error and user might be demo
      // For now, just throw the error - user should use demo credentials
      const errorMessage = error?.response?.data?.error || error?.message || 'Login failed'
      throw new Error(errorMessage)
    }
  }

  const register = async (data: RegisterData) => {
    try {
      // Try real API first
      const response = await authService.register(data)
      console.log('Registration successful:', response)
      
      // Auto-login after registration
      await login(data.email, data.password)
    } catch (error: any) {
      // Log the actual error for debugging
      console.error('Registration error:', error)
      console.error('Error response:', error?.response?.data)
      console.error('Error status:', error?.response?.status)
      
      // Only use demo mode if it's a network error (backend not available)
      const isNetworkError = error?.code === 'ERR_NETWORK' || error?.message?.includes('Network')
      
      if (isNetworkError) {
        console.log('Network error - backend not available, using demo mode')
        // Store user in localStorage for demo
        const demoUsers = JSON.parse(localStorage.getItem('demo_users') || '[]')
        const newUser: User = {
          id: `demo-${Date.now()}`,
          email: data.email,
          phone: data.phone,
          first_name: data.first_name,
          last_name: data.last_name,
          kyc_status: 'pending',
        }
        
        // Check if email already exists
        if (demoUsers.find((u: User) => u.email === data.email)) {
          throw new Error('Email already registered')
        }
        
        demoUsers.push(newUser)
        localStorage.setItem('demo_users', JSON.stringify(demoUsers))
        
        // Auto-login with demo credentials
        tokenStorage.setTokens(`demo-token-${newUser.id}`, `demo-refresh-${newUser.id}`)
        setUser(newUser)
        setIsAuthenticated(true)
      } else {
        // For API errors (validation, etc.), throw the error
        throw error
      }
    }
  }

  const loginWithGoogle = async (idToken: string, accessToken?: string) => {
    try {
      const response = await authService.googleOAuth(idToken, accessToken)
      tokenStorage.setTokens(response.access_token, response.refresh_token)
      const userData = await authService.getCurrentUser()
      setUser(userData)
      setIsAuthenticated(true)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Google sign-in failed'
      throw new Error(errorMessage)
    }
  }

  const logout = () => {
    tokenStorage.clearTokens()
    setIsAuthenticated(false)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        register,
        loginWithGoogle,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

