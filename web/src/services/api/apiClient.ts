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

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Check if it's a network error (backend not available)
        const isNetworkError = error.code === 'ERR_NETWORK' || error.message?.includes('Network')
        const isDemoToken = tokenStorage.getAccessToken()?.startsWith('demo-') || tokenStorage.getAccessToken() === 'demo-access-token'
        
        // Special handling for 401 Unauthorized
        if (error.response?.status === 401) {
          // Only redirect to login if it's not a demo token and not an auth endpoint
          const isAuthEndpoint = error.config?.url?.includes('/auth/')
          if (!isDemoToken && !isAuthEndpoint) {
            tokenStorage.clearTokens()
            window.location.href = '/login'
            toast.error('Session expired. Please login again.')
          }
          // For auth endpoints, let the component handle the error (don't show toast here)
        } 
        // Don't show automatic toasts for other errors - let components handle them
        // This prevents double toasts and unwanted popups
        
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

