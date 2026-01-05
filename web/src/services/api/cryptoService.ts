import { apiClient } from './apiClient'

interface CryptoBalance {
  currency: string
  balance: string
  ngn_value: string
}

interface FundAccountRequest {
  crypto_currency: 'BTC' | 'USDT' | 'ETH'
  amount: string
}

interface ConvertRequest {
  from_currency: 'BTC' | 'USDT' | 'ETH'
  amount: string
}

interface ConversionResponse {
  conversion_id: string
  from_currency: string
  to_currency: string
  from_amount: string
  to_amount: string
  exchange_rate: string
  status: string
}

export const cryptoService = {
  async getBalances(): Promise<{ balances: CryptoBalance[] }> {
    const response = await apiClient.instance.get<{ balances: CryptoBalance[] }>(
      '/api/v1/crypto/balances'
    )
    return response.data
  },

  async fundAccount(data: FundAccountRequest) {
    const response = await apiClient.instance.post('/api/v1/crypto/fund', data)
    return response.data
  },

  async convertToNaira(data: ConvertRequest): Promise<ConversionResponse> {
    const response = await apiClient.instance.post<ConversionResponse>(
      '/api/v1/crypto/convert',
      data
    )
    return response.data
  },

  async getExchangeRates(): Promise<{
    rates: Record<string, string>
    last_updated: string
  }> {
    try {
      const response = await apiClient.instance.get('/api/v1/crypto/rates')
      return response.data
    } catch (error) {
      // Fallback to live rates if API fails
      const { cryptoRatesService } = await import('./cryptoRatesService')
      const liveRates = await cryptoRatesService.getLiveRates()
      return {
        rates: {
          BTC: liveRates.BTC.toFixed(2),
          USDT: liveRates.USDT.toFixed(2),
          ETH: liveRates.ETH.toFixed(2),
        },
        last_updated: new Date().toISOString(),
      }
    }
  },

  async getTransactions(page: number = 1, limit: number = 20) {
    const response = await apiClient.instance.get(
      `/api/v1/crypto/transactions?page=${page}&limit=${limit}`
    )
    return response.data
  },
}

