import { apiClient } from './apiClient'

export interface VerificationDocument {
  document_type: string
  document_side?: string
  file_data: string // Base64 encoded
}

export interface VerificationSubmitRequest {
  country_code: string
  documents: VerificationDocument[]
}

export interface VerificationStatusResponse {
  status: string
  documents: Array<{
    id: string
    document_type: string
    document_side?: string
    status: string
    submitted_at?: string
    reviewed_at?: string
    rejection_reason?: string
  }>
}

export const verificationService = {
  async submitDocuments(data: VerificationSubmitRequest): Promise<any> {
    const response = await apiClient.instance.post('/api/v1/verification/submit', data)
    return response.data
  },

  async getStatus(): Promise<VerificationStatusResponse> {
    const response = await apiClient.instance.get('/api/v1/verification/status')
    return response.data
  },
}



