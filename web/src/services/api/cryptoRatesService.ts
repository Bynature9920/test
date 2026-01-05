/**
 * Service for fetching REAL-TIME cryptocurrency exchange rates
 * Aggregates rates from multiple exchanges: Binance, Bybit, Coinbase, CoinGecko
 * for maximum accuracy
 */

interface ExchangeRate {
  source: string
  BTC: number
  USDT: number
  ETH: number
}

const CACHE_DURATION = 60000 // 1 minute cache (only for non-forced requests)
const USD_TO_NGN_RATE = 1500 // Approximate USD to NGN rate (can be fetched from forex API)

let cachedRates: {
  data: Record<string, number>
  timestamp: number
} | null = null

/**
 * Fetch rates from Binance API
 */
async function fetchBinanceRates(): Promise<ExchangeRate | null> {
  try {
    // Binance public API - get BTC/USDT, ETH/USDT prices
    const [btcResponse, ethResponse, usdtNgnResponse] = await Promise.all([
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', { cache: 'no-store' }),
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT', { cache: 'no-store' }),
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTNGN', { cache: 'no-store' }).catch(() => null),
    ])

    if (!btcResponse.ok || !ethResponse.ok) {
      throw new Error('Binance API error')
    }

    const btcData = await btcResponse.json()
    const ethData = await ethResponse.json()
    
    // Try to get USDT/NGN directly from Binance (if available)
    let usdtNgnRate = USD_TO_NGN_RATE
    if (usdtNgnResponse && usdtNgnResponse.ok) {
      try {
        const usdtNgnData = await usdtNgnResponse.json()
        const rate = parseFloat(usdtNgnData.price)
        if (rate > 0 && !isNaN(rate)) {
          usdtNgnRate = rate
        }
      } catch {
        // If USDT/NGN not available or invalid, use USD conversion
        usdtNgnRate = USD_TO_NGN_RATE
      }
    }

    const btcUsdt = parseFloat(btcData.price)
    const ethUsdt = parseFloat(ethData.price)
    const usdtNgn = usdtNgnRate

    if (isNaN(btcUsdt) || isNaN(ethUsdt) || btcUsdt === 0 || ethUsdt === 0) {
      throw new Error('Invalid Binance rates')
    }

    return {
      source: 'Binance',
      BTC: btcUsdt * usdtNgn,
      USDT: usdtNgn,
      ETH: ethUsdt * usdtNgn,
    }
  } catch (error) {
    console.warn('⚠️ Binance API failed:', error)
    return null
  }
}

/**
 * Fetch rates from Bybit API
 */
async function fetchBybitRates(): Promise<ExchangeRate | null> {
  try {
    // Bybit public API
    const [btcResponse, ethResponse] = await Promise.all([
      fetch('https://api.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT', { cache: 'no-store' }),
      fetch('https://api.bybit.com/v5/market/tickers?category=spot&symbol=ETHUSDT', { cache: 'no-store' }),
    ])

    if (!btcResponse.ok || !ethResponse.ok) {
      throw new Error('Bybit API error')
    }

    const btcData = await btcResponse.json()
    const ethData = await ethResponse.json()

    const btcUsdt = parseFloat(btcData.result.list[0]?.lastPrice || '0')
    const ethUsdt = parseFloat(ethData.result.list[0]?.lastPrice || '0')
    const usdtNgn = USD_TO_NGN_RATE // Bybit doesn't have direct NGN pairs

    if (btcUsdt === 0 || ethUsdt === 0) {
      throw new Error('Invalid Bybit rates')
    }

    return {
      source: 'Bybit',
      BTC: btcUsdt * usdtNgn,
      USDT: usdtNgn,
      ETH: ethUsdt * usdtNgn,
    }
  } catch (error) {
    console.warn('⚠️ Bybit API failed:', error)
    return null
  }
}

/**
 * Fetch rates from Coinbase API
 */
async function fetchCoinbaseRates(): Promise<ExchangeRate | null> {
  try {
    // Coinbase public API
    const [btcResponse, ethResponse, usdtResponse] = await Promise.all([
      fetch('https://api.coinbase.com/v2/exchange-rates?currency=BTC', { cache: 'no-store' }),
      fetch('https://api.coinbase.com/v2/exchange-rates?currency=ETH', { cache: 'no-store' }),
      fetch('https://api.coinbase.com/v2/exchange-rates?currency=USDT', { cache: 'no-store' }),
    ])

    if (!btcResponse.ok || !ethResponse.ok || !usdtResponse.ok) {
      throw new Error('Coinbase API error')
    }

    const btcData = await btcResponse.json()
    const ethData = await ethResponse.json()
    const usdtData = await usdtResponse.json()

    const btcUsd = parseFloat(btcData.data.rates.USD)
    const ethUsd = parseFloat(ethData.data.rates.USD)
    const usdtUsd = parseFloat(usdtData.data.rates.USD)
    const usdNgn = USD_TO_NGN_RATE

    return {
      source: 'Coinbase',
      BTC: btcUsd * usdNgn,
      USDT: usdtUsd * usdNgn,
      ETH: ethUsd * usdNgn,
    }
  } catch (error) {
    console.warn('⚠️ Coinbase API failed:', error)
    return null
  }
}

/**
 * Fetch rates from CoinGecko API
 */
async function fetchCoinGeckoRates(): Promise<ExchangeRate | null> {
  try {
    const timestamp = Date.now()
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether,ethereum&vs_currencies=ngn&t=${timestamp}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.bitcoin || !data.tether || !data.ethereum) {
      throw new Error('Invalid CoinGecko response format')
    }

    return {
      source: 'CoinGecko',
      BTC: data.bitcoin.ngn,
      USDT: data.tether.ngn,
      ETH: data.ethereum.ngn,
    }
  } catch (error) {
    console.warn('⚠️ CoinGecko API failed:', error)
    return null
  }
}

/**
 * Aggregate rates from multiple sources using median (more accurate than average)
 */
function aggregateRates(exchangeRates: ExchangeRate[]): Record<string, number> {
  if (exchangeRates.length === 0) {
    throw new Error('No exchange rates available')
  }

  // Get all rates for each currency
  const btcRates = exchangeRates.map(r => r.BTC).filter(r => r > 0).sort((a, b) => a - b)
  const usdtRates = exchangeRates.map(r => r.USDT).filter(r => r > 0).sort((a, b) => a - b)
  const ethRates = exchangeRates.map(r => r.ETH).filter(r => r > 0).sort((a, b) => a - b)

  // Calculate median (more robust than average)
  const getMedian = (arr: number[]) => {
    if (arr.length === 0) return 0
    const mid = Math.floor(arr.length / 2)
    return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid]
  }

  const rates = {
    BTC: getMedian(btcRates),
    USDT: getMedian(usdtRates),
    ETH: getMedian(ethRates),
  }

  // Validate rates
  if (rates.BTC === 0 || rates.USDT === 0 || rates.ETH === 0) {
    throw new Error('Invalid aggregated rates')
  }

  return rates
}

export const cryptoRatesService = {
  /**
   * Get REAL-TIME exchange rates for BTC, USDT, ETH in NGN
   * Aggregates rates from multiple exchanges for maximum accuracy
   * @param forceRefresh - If true, bypasses cache and fetches fresh data from API
   */
  async getLiveRates(forceRefresh: boolean = false): Promise<Record<string, number>> {
    // Only use cache if not forcing refresh and cache is less than 1 minute old
    if (!forceRefresh && cachedRates && Date.now() - cachedRates.timestamp < CACHE_DURATION) {
      console.log('📦 Using cached rates (use forceRefresh=true for real-time)')
      return cachedRates.data
    }

    try {
      // Fetch from all exchanges in parallel
      const [binanceRate, bybitRate, coinbaseRate, coinGeckoRate] = await Promise.all([
        fetchBinanceRates(),
        fetchBybitRates(),
        fetchCoinbaseRates(),
        fetchCoinGeckoRates(),
      ])

      // Filter out null results
      const exchangeRates: ExchangeRate[] = [
        binanceRate,
        bybitRate,
        coinbaseRate,
        coinGeckoRate,
      ].filter((rate): rate is ExchangeRate => rate !== null)

      if (exchangeRates.length === 0) {
        throw new Error('All exchange APIs failed')
      }

      // Log sources used
      const sources = exchangeRates.map(r => r.source).join(', ')
      console.log(`📊 Fetched rates from ${exchangeRates.length} sources: ${sources}`)

      // Aggregate rates using median
      const rates = aggregateRates(exchangeRates)

      // Validate rates are valid numbers and not zero
      if (isNaN(rates.BTC) || isNaN(rates.USDT) || isNaN(rates.ETH) || 
          rates.BTC === 0 || rates.USDT === 0 || rates.ETH === 0) {
        throw new Error('Invalid aggregated rate values')
      }

      // Cache the rates (only for 1 minute to ensure freshness)
      cachedRates = {
        data: rates,
        timestamp: Date.now(),
      }

      console.log('✅ Aggregated REAL-TIME rates from multiple exchanges:', {
        BTC: `₦${rates.BTC.toLocaleString()}`,
        USDT: `₦${rates.USDT.toLocaleString()}`,
        ETH: `₦${rates.ETH.toLocaleString()}`,
        sources: sources,
        timestamp: new Date().toISOString(),
      })

      return rates
    } catch (error) {
      console.error('❌ Error fetching real-time rates from exchanges:', error)
      
      // If we have cached rates and not forcing refresh, use them as fallback
      if (cachedRates && !forceRefresh) {
        console.warn('⚠️ Using cached rates due to API error')
        return cachedRates.data
      }
      
      // If forcing refresh and API fails, throw error to let caller handle
      if (forceRefresh) {
        throw new Error('Failed to fetch real-time rates from exchanges')
      }
      
      // Last resort fallback rates (should rarely be used)
      console.warn('⚠️ Using fallback rates - all exchange APIs unavailable')
      return {
        BTC: 50000000,
        USDT: 1500,
        ETH: 2000000,
      }
    }
  },

  /**
   * Get rate for a specific cryptocurrency (real-time)
   */
  async getRate(currency: 'BTC' | 'USDT' | 'ETH', forceRefresh: boolean = false): Promise<number> {
    const rates = await this.getLiveRates(forceRefresh)
    return rates[currency] || 0
  },

  /**
   * Convert crypto amount to Naira using real-time rates
   */
  async convertToNaira(
    currency: 'BTC' | 'USDT' | 'ETH',
    amount: number,
    forceRefresh: boolean = true
  ): Promise<number> {
    const rate = await this.getRate(currency, forceRefresh)
    return amount * rate
  },

  /**
   * Clear cache to force refresh on next call
   */
  clearCache() {
    cachedRates = null
    console.log('🗑️ Cache cleared - next fetch will be fresh from all exchanges')
  },

  /**
   * Get preview conversion amount (real-time)
   */
  async getConversionPreview(
    currency: 'BTC' | 'USDT' | 'ETH',
    amount: number
  ): Promise<{ nairaAmount: number; rate: number }> {
    const rates = await this.getLiveRates(true) // Force fresh fetch for preview
    const rate = rates[currency]
    return {
      nairaAmount: amount * rate,
      rate: rate,
    }
  },
}
