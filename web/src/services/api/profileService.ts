import { apiClient } from './apiClient'

export const profileService = {
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.instance.post<{ message: string}>(
      '/api/v1/auth/change-password',
      { current_password: currentPassword, new_password: newPassword }
    )
    return response.data
  },

  async updateEmail(email: string, password: string): Promise<{ message: string }> {
    const response = await apiClient.instance.post<{ message: string }>(
      '/api/v1/auth/update-email',
      { email, password }
    )
    return response.data
  },

  async updatePhone(phone: string, password: string): Promise<{ message: string }> {
    const response = await apiClient.instance.post<{ message: string }>(
      '/api/v1/auth/update-phone',
      { phone, password }
    )
    return response.data
  },

  async uploadProfilePicture(file: File): Promise<{ url: string }> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await apiClient.instance.post<{ url: string }>(
      '/api/v1/auth/profile-picture',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },
}




