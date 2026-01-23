import { apiClient } from './apiClient'

interface WalletBalance {
  currency: string
  available_balance: string
  pending_balance: string
  total_balance: string
}

interface Transaction {
  id: string
  transaction_type: string
  status: string
  amount: string
  currency: string
  description: string
  created_at: string
}

interface SendToUserRequest {
  recipient_user_id: string
  amount: number
  description?: string
}

interface SendToUserResponse {
  message: string
  transaction_id: string
  recipient_user_id: string
  amount: string
  new_balance: string
}

export const walletService = {
  async getBalance(currency: string = 'NGN'): Promise<WalletBalance> {
    const response = await apiClient.instance.get<WalletBalance>(
      `/api/v1/wallet/balance?currency=${currency}`
    )
    return response.data
  },

  async getAllBalances(): Promise<{ balances: WalletBalance[] }> {
    const response = await apiClient.instance.get<{ balances: WalletBalance[] }>(
      '/api/v1/wallet/balances'
    )
    return response.data
  },

  async getTransactions(page: number = 1, limit: number = 20): Promise<{
    transactions: Transaction[]
    page: number
    limit: number
    total: number
  }> {
    const response = await apiClient.instance.get(
      `/api/v1/wallet/transactions?page=${page}&limit=${limit}`
    )
    return response.data
  },

  async sendToUser(data: SendToUserRequest): Promise<SendToUserResponse> {
    const response = await apiClient.instance.post<SendToUserResponse>(
      '/api/v1/wallet/send-to-user',
      data
    )
    return response.data
  },

  async initializeDeposit(amount: number): Promise<{
    authorization_url: string
    access_code: string
    reference: string
  }> {
    const response = await apiClient.instance.post(
      '/api/v1/wallet/deposit/initialize',
      { amount }
    )
    return response.data
  },
}

