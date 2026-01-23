import { apiClient } from './apiClient'

interface P2PTransferRequest {
  recipient_id: string
  amount: string
  currency?: string
  description?: string
}

interface BankTransferRequest {
  account_number: string
  bank_code: string
  account_name: string
  amount: string
  currency?: string
  description?: string
  narration?: string
}

interface PaymentResponse {
  payment_id: string
  status: string
  amount: string
  currency: string
  fee: string
  net_amount: string
}

interface BillPaymentRequest {
  bill_type: 'airtime' | 'data' | 'tv' | 'betting'
  provider_code: string
  customer_identifier: string
  amount: number
  plan_code?: string
}

export const paymentsService = {
  async p2pTransfer(data: P2PTransferRequest): Promise<PaymentResponse> {
    const response = await apiClient.instance.post<PaymentResponse>(
      '/api/v1/payments/p2p',
      { ...data, currency: data.currency || 'NGN' }
    )
    return response.data
  },

  async bankTransfer(data: BankTransferRequest): Promise<PaymentResponse> {
    const response = await apiClient.instance.post<PaymentResponse>(
      '/api/v1/payments/bank-transfer',
      { ...data, currency: data.currency || 'NGN' }
    )
    return response.data
  },

  async payTuition(data: {
    institution_id: string
    student_id: string
    amount: string
    currency?: string
    description?: string
  }): Promise<PaymentResponse> {
    const response = await apiClient.instance.post<PaymentResponse>(
      '/api/v1/payments/tuition',
      { ...data, currency: data.currency || 'NGN' }
    )
    return response.data
  },

  async getPayments(page: number = 1, limit: number = 20) {
    const response = await apiClient.instance.get(
      `/api/v1/payments?page=${page}&limit=${limit}`
    )
    return response.data
  },

  async payBill(data: BillPaymentRequest): Promise<any> {
    const response = await apiClient.instance.post(
      '/api/v1/bills/purchase',
      {
        bill_type: data.bill_type,
        provider_code: data.provider_code,
        amount: data.amount,
        phone_number: data.bill_type !== 'tv' && data.bill_type !== 'betting' ? data.customer_identifier : null,
        account_number: data.bill_type === 'tv' || data.bill_type === 'betting' ? data.customer_identifier : null,
        data_plan_code: data.plan_code,
      }
    )
    return response.data
  },
}

