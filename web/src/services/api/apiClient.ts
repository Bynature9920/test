import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { tokenStorage } from '@/utils/tokenStorage'
import toast from 'react-hot-toast'

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL as string) || 'http://localhost:8000'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = tokenStorage.getAccessToken()
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor - handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config
        const isDemoToken = tokenStorage.getAccessToken()?.startsWith('demo-') || tokenStorage.getAccessToken() === 'demo-access-token'
        
        // Special handling for 401 Unauthorized
        if (error.response?.status === 401) {
          const isAuthEndpoint = originalRequest?.url?.includes('/auth/')
          
          // Don't retry if it's already a retry or a demo token or auth endpoint
          if (!originalRequest._retry && !isDemoToken && !isAuthEndpoint) {
            originalRequest._retry = true
            
            const refreshToken = tokenStorage.getRefreshToken()
            
            // Try to refresh the token
            if (refreshToken) {
              try {
                const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
                  refresh_token: refreshToken
                })
                
                const { access_token, refresh_token: new_refresh_token } = response.data
                tokenStorage.setTokens(access_token, new_refresh_token)
                
                // Retry the original request with new token
                originalRequest.headers.Authorization = `Bearer ${access_token}`
                return this.client(originalRequest)
              } catch (refreshError) {
                // Refresh failed, logout user
                tokenStorage.clearTokens()
                window.location.href = '/login'
                toast.error('Your session has expired. Please login again.')
                return Promise.reject(refreshError)
              }
            } else {
              // No refresh token, logout user
              tokenStorage.clearTokens()
              window.location.href = '/login'
              toast.error('Your session has expired. Please login again.')
            }
          }
        } 
        
        // Silently pass the error to the calling component
        return Promise.reject(error)
      }
    )
  }

  get instance() {
    return this.client
  }
}

export const apiClient = new ApiClient()

