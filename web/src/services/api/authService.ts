import { apiClient } from './apiClient'

interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

interface RegisterData {
  email: string
  password: string
  phone: string
  first_name: string
  last_name: string
  country_code: string
}

interface User {
  id: string
  email: string
  phone: string
  first_name: string
  last_name: string
  kyc_status: string
  is_active: boolean
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.instance.post<LoginResponse>(
      '/api/v1/auth/login',
      { email, password }
    )
    return response.data
  },

  async register(data: RegisterData): Promise<User> {
    const response = await apiClient.instance.post<User>(
      '/api/v1/auth/register',
      data
    )
    return response.data
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.instance.get<User>('/api/v1/auth/me')
    return response.data
  },

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await apiClient.instance.post<LoginResponse>(
      '/api/v1/auth/refresh',
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    )
    return response.data
  },

  async initiateKYC(): Promise<{ status: string; message: string }> {
    const response = await apiClient.instance.post('/api/v1/auth/kyc/verify')
    return response.data
  },

  async googleOAuth(idToken: string, accessToken?: string): Promise<LoginResponse> {
    const response = await apiClient.instance.post<LoginResponse>(
      '/api/v1/auth/google',
      { id_token: idToken, access_token: accessToken },
      {
        timeout: 30000, // 30 second timeout
      }
    )
    return response.data
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.instance.post<{ message: string }>(
      '/api/v1/auth/forgot-password',
      { email }
    )
    return response.data
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.instance.post<{ message: string }>(
      '/api/v1/auth/reset-password',
      { token, new_password: newPassword }
    )
    return response.data
  },
}

