import { apiClient } from './apiClient'

export interface Card {
  card_id: string
  card_number: string
  cardholder_name: string
  expiry_month: number
  expiry_year: number
  cvv?: string  // Only available on creation
  card_type: string
  status: string
  currency: string
  balance: string
  created_at: string
}

export interface CreateCardRequest {
  cardholder_name?: string
  currency?: string
}

export interface FundCardRequest {
  amount: number
}

export const cardService = {
  async createCard(data: CreateCardRequest): Promise<Card> {
    const response = await apiClient.instance.post<Card>('/api/v1/cards/create', data)
    return response.data
  },

  async getCards(): Promise<{ cards: Card[] }> {
    const response = await apiClient.instance.get<{ cards: Card[] }>('/api/v1/cards')
    return response.data
  },

  async fundCard(cardId: string, data: FundCardRequest): Promise<{ message: string; card_balance: string; wallet_balance: string }> {
    const response = await apiClient.instance.post(`/api/v1/cards/${cardId}/fund`, data)
    return response.data
  },

  async freezeCard(cardId: string): Promise<{ message: string; status: string }> {
    const response = await apiClient.instance.post(`/api/v1/cards/${cardId}/freeze`)
    return response.data
  },

  async unfreezeCard(cardId: string): Promise<{ message: string; status: string }> {
    const response = await apiClient.instance.post(`/api/v1/cards/${cardId}/unfreeze`)
    return response.data
  },

  async deleteCard(cardId: string): Promise<{ message: string }> {
    const response = await apiClient.instance.delete(`/api/v1/cards/${cardId}`)
    return response.data
  },

  async getCardCVV(cardId: string): Promise<{ cvv: string }> {
    const response = await apiClient.instance.get(`/api/v1/cards/${cardId}/cvv`)
    return response.data
  },
}
