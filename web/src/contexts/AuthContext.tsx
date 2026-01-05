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
    try {
      const response = await authService.login(email, password)
      tokenStorage.setTokens(response.access_token, response.refresh_token)
      const userData = await authService.getCurrentUser()
      setUser(userData)
      setIsAuthenticated(true)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Login failed'
      throw new Error(errorMessage)
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const response = await authService.register(data)
      console.log('Registration successful:', response)
      
      // Auto-login after registration
      await login(data.email, data.password)
    } catch (error: any) {
      // Log the actual error for debugging
      console.error('Registration error:', error)
      console.error('Error response:', error?.response?.data)
      console.error('Error status:', error?.response?.status)
      
      // Throw the error to be handled by the calling component
      throw error
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

