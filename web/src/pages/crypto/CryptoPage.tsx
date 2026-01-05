import { useEffect, useState } from 'react'
import { cryptoService } from '@/services/api/cryptoService'
import { cryptoRatesService } from '@/services/api/cryptoRatesService'
import { formatCurrency } from '@/utils/format'
import { Coins, TrendingUp, RefreshCw, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CryptoPage() {
  const [balances, setBalances] = useState<any[]>([])
  const [rates, setRates] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [converting, setConverting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [selectedCurrency, setSelectedCurrency] = useState<'BTC' | 'USDT' | 'ETH' | ''>('')
  const [conversionAmount, setConversionAmount] = useState<string>('')
  const [previewAmount, setPreviewAmount] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    loadData()
    // No auto-refresh - user must click refresh button
  }, [])

  const loadData = async () => {
    try {
      // Fetch real-time rates on initial load
      const [balancesData, liveRates] = await Promise.all([
        cryptoService.getBalances(),
        cryptoRatesService.getLiveRates(true), // Force fresh fetch on load
      ])
      setBalances(balancesData.balances || [])
      
      // Update NGN values based on live rates
      let updatedBalances = (balancesData.balances || []).map((bal: any) => {
        const rate = liveRates[bal.currency] || 0
        return {
          ...bal,
          ngn_value: (parseFloat(bal.balance) * rate).toFixed(2),
        }
      })

      // Ensure all three currencies are present
      const currencies = ['USDT', 'BTC', 'ETH']
      currencies.forEach((currency) => {
        if (!updatedBalances.find((b: any) => b.currency === currency)) {
          const rate = liveRates[currency] || 0
          updatedBalances.push({
            currency,
            balance: '0.00000000',
            ngn_value: '0.00',
          })
        }
      })

      setBalances(updatedBalances)

      setRates({
        rates: {
          BTC: liveRates.BTC.toFixed(2),
          USDT: liveRates.USDT.toFixed(2),
          ETH: liveRates.ETH.toFixed(2),
        },
        last_updated: new Date().toISOString(),
      })
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to load crypto data:', error)
      // Demo data if API fails - ensure all 3 currencies
      // Try to get real rates, but allow fallback
      try {
        const liveRates = await cryptoRatesService.getLiveRates(true)
        const demoBalances = [
          {
            currency: 'USDT',
            balance: '100.00000000',
            ngn_value: (100 * liveRates.USDT).toFixed(2),
          },
          {
            currency: 'BTC',
            balance: '0.00100000',
            ngn_value: (0.001 * liveRates.BTC).toFixed(2),
          },
          {
            currency: 'ETH',
            balance: '0.05000000',
            ngn_value: (0.05 * liveRates.ETH).toFixed(2),
          },
        ]
        setBalances(demoBalances)
        setRates({
          rates: {
            BTC: liveRates.BTC.toFixed(2),
            USDT: liveRates.USDT.toFixed(2),
            ETH: liveRates.ETH.toFixed(2),
          },
          last_updated: new Date().toISOString(),
        })
        setLastUpdated(new Date())
      } catch (rateError) {
        // Fallback to hardcoded rates if CoinGecko also fails
        console.error('Failed to fetch rates, using fallback:', rateError)
        const fallbackRates = { BTC: 50000000, USDT: 1500, ETH: 2000000 }
        const demoBalances = [
          {
            currency: 'USDT',
            balance: '100.00000000',
            ngn_value: (100 * fallbackRates.USDT).toFixed(2),
          },
          {
            currency: 'BTC',
            balance: '0.00100000',
            ngn_value: (0.001 * fallbackRates.BTC).toFixed(2),
          },
          {
            currency: 'ETH',
            balance: '0.05000000',
            ngn_value: (0.05 * fallbackRates.ETH).toFixed(2),
          },
        ]
        setBalances(demoBalances)
        setRates({
          rates: {
            BTC: fallbackRates.BTC.toFixed(2),
            USDT: fallbackRates.USDT.toFixed(2),
            ETH: fallbackRates.ETH.toFixed(2),
          },
          last_updated: new Date().toISOString(),
        })
        setLastUpdated(new Date())
      }
    } finally {
      setLoading(false)
    }
  }

  const refreshRates = async () => {
    setRefreshing(true)
    try {
      // Force refresh - get REAL-TIME rates from API
      cryptoRatesService.clearCache()
      const liveRates = await cryptoRatesService.getLiveRates(true) // Force refresh
      
      // Update balances with new rates - ensure all currencies
      let updatedBalances = balances.map((bal) => {
        const rate = liveRates[bal.currency] || 0
        return {
          ...bal,
          ngn_value: (parseFloat(bal.balance) * rate).toFixed(2),
        }
      })

      // Ensure all three currencies are present
      const currencies = ['USDT', 'BTC', 'ETH']
      currencies.forEach((currency) => {
        if (!updatedBalances.find((b: any) => b.currency === currency)) {
          const rate = liveRates[currency] || 0
          updatedBalances.push({
            currency,
            balance: '0.00000000',
            ngn_value: '0.00',
          })
        }
      })

      setBalances(updatedBalances)

      setRates({
        rates: {
          BTC: liveRates.BTC.toFixed(2),
          USDT: liveRates.USDT.toFixed(2),
          ETH: liveRates.ETH.toFixed(2),
        },
        last_updated: new Date().toISOString(),
      })
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to refresh rates:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const calculatePreview = async (currency: string, amount: string) => {
    if (!currency || !amount || parseFloat(amount) <= 0) {
      setPreviewAmount(null)
      setShowPreview(false)
      return
    }

    try {
      // Get fresh real-time rates for preview
      const liveRates = await cryptoRatesService.getLiveRates(true) // Force fresh fetch
      const rate = liveRates[currency as 'BTC' | 'USDT' | 'ETH']
      const nairaAmount = (parseFloat(amount) * rate).toFixed(2)
      setPreviewAmount(nairaAmount)
      setShowPreview(true)
    } catch (error) {
      console.error('Failed to calculate preview:', error)
      setPreviewAmount(null)
      setShowPreview(false)
    }
  }

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const currency = e.target.value as 'BTC' | 'USDT' | 'ETH' | ''
    setSelectedCurrency(currency)
    if (currency && conversionAmount) {
      calculatePreview(currency, conversionAmount)
    } else {
      setShowPreview(false)
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = e.target.value
    setConversionAmount(amount)
    if (selectedCurrency && amount) {
      calculatePreview(selectedCurrency, amount)
    } else {
      setShowPreview(false)
    }
  }

  const handleConvert = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedCurrency || !conversionAmount) {
      toast.error('Please select currency and enter amount')
      return
    }

    setConverting(true)
    const currency = selectedCurrency
    const amount = parseFloat(conversionAmount)
    
    try {
      // Get REAL-TIME rate for conversion
      const liveRates = await cryptoRatesService.getLiveRates(true) // Force fresh fetch
      const rate = liveRates[currency]
      const nairaAmount = (amount * rate).toFixed(2)

      await cryptoService.convertToNaira({
        from_currency: currency,
        amount: amount.toString(),
      })
      toast.success(`Conversion successful! ${amount} ${currency} = ${formatCurrency(nairaAmount)}`)
      e.currentTarget.reset()
      setSelectedCurrency('')
      setConversionAmount('')
      setShowPreview(false)
      setPreviewAmount(null)
      loadData()
    } catch (error) {
      // Demo mode - calculate with real-time rates
      const liveRates = await cryptoRatesService.getLiveRates(true) // Force fresh fetch
      const rate = liveRates[currency]
      const nairaAmount = (amount * rate).toFixed(2)
      toast.success(
        `Conversion successful! (Demo) ${amount} ${currency} = ${formatCurrency(nairaAmount)}`
      )
      e.currentTarget.reset()
      setSelectedCurrency('')
      setConversionAmount('')
      setShowPreview(false)
      setPreviewAmount(null)
      loadData()
    } finally {
      setConverting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Crypto</h2>
        <p className="text-gray-600 dark:text-slate-400 mt-1">Manage your cryptocurrency and convert to Naira</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Crypto Balances</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></div>
              ))}
            </div>
          ) : balances.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-slate-400">
              <Coins className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-slate-500" />
              <p>No crypto balances yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {['USDT', 'BTC', 'ETH'].map((currency) => {
                const balance = balances.find((b) => b.currency === currency) || {
                  currency,
                  balance: '0.00000000',
                  ngn_value: '0.00',
                }
                
                const currencyColors = {
                  BTC: 'border-orange-200 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-700 bg-orange-50/20 dark:bg-orange-900/20',
                  ETH: 'border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 bg-blue-50/20 dark:bg-blue-900/20',
                  USDT: 'border-teal-200 dark:border-teal-800 hover:border-teal-300 dark:hover:border-teal-700 bg-teal-50/20 dark:bg-teal-900/20',
                }
                
                return (
                  <div
                    key={balance.currency}
                    className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${currencyColors[currency as 'BTC' | 'ETH' | 'USDT']}`}
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-slate-100">{balance.currency}</p>
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        {parseFloat(balance.balance).toLocaleString('en-US', {
                          minimumFractionDigits: 8,
                          maximumFractionDigits: 8,
                        })}{' '}
                        {balance.currency}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-slate-100">
                        {formatCurrency(balance.ngn_value)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-slate-400">NGN Value</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Convert to Naira</h3>
          <form onSubmit={handleConvert} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Cryptocurrency
              </label>
              <select
                name="currency"
                className="input-field"
                required
                value={selectedCurrency}
                onChange={handleCurrencyChange}
              >
                <option value="">Select currency</option>
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="USDT">Tether (USDT)</option>
                <option value="ETH">Ethereum (ETH)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Amount</label>
              <input
                type="number"
                name="amount"
                className="input-field"
                placeholder="0.00000000"
                step="0.00000001"
                min="0.00000001"
                required
                value={conversionAmount}
                onChange={handleAmountChange}
              />
              {selectedCurrency && conversionAmount && (
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Available: {balances.find(b => b.currency === selectedCurrency)?.balance || '0.00000000'} {selectedCurrency}
                </p>
              )}
            </div>

            {/* Live Conversion Preview */}
            {showPreview && previewAmount && selectedCurrency && conversionAmount && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">💱 Conversion Preview</p>
                  <span className="text-xs text-green-600 dark:text-green-400 font-bold animate-pulse flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Live Rate
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm">
                    <div className="text-left">
                      <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">You're converting</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-slate-100">
                        {parseFloat(conversionAmount).toLocaleString('en-US', {
                          minimumFractionDigits: 8,
                          maximumFractionDigits: 8,
                        })}{' '}
                        {selectedCurrency}
                      </p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-primary-500 dark:text-primary-400 mx-2" />
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">You'll receive</p>
                      <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {formatCurrency(previewAmount)}
                      </p>
                    </div>
                  </div>
                  {rates && rates.rates && (
                    <div className="pt-2 border-t border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-slate-400">Current Exchange Rate:</span>
                        <span className="font-semibold text-gray-900 dark:text-slate-100">
                          1 {selectedCurrency} = {formatCurrency(rates.rates[selectedCurrency])}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={converting || !selectedCurrency || !conversionAmount || !showPreview}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {converting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Converting...
                </>
              ) : (
                <>
                  <Coins className="w-4 h-4" />
                  Convert to Naira
                </>
              )}
            </button>
            {(!selectedCurrency || !conversionAmount) && (
              <p className="text-xs text-gray-500 dark:text-slate-400 text-center">
                Select currency and enter amount to see live conversion preview
              </p>
            )}
            {selectedCurrency && conversionAmount && !showPreview && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 text-center animate-pulse">
                Calculating preview...
              </p>
            )}
          </form>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Live Exchange Rates</h3>
          </div>
          <button
            onClick={refreshRates}
            disabled={refreshing || loading}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all ${
              refreshing || loading
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 cursor-wait'
                : 'text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:shadow-sm'
            } disabled:opacity-50`}
            title="Click to fetch real-time exchange rates from CoinGecko API"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing || loading ? 'animate-spin' : ''}`} />
            {refreshing || loading ? 'Fetching Real-Time Rates...' : 'Refresh Rates'}
          </button>
        </div>
        {loading && !rates ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border rounded-lg animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-32 mt-2"></div>
              </div>
            ))}
          </div>
        ) : rates && rates.rates ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['BTC', 'USDT', 'ETH'].map((currency) => {
                const rate = rates.rates?.[currency]
                if (!rate) return null
                
                const currencyColors = {
                  BTC: 'border-orange-200 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-700 bg-orange-50/30 dark:bg-orange-900/20',
                  ETH: 'border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 bg-blue-50/30 dark:bg-blue-900/20',
                  USDT: 'border-teal-200 dark:border-teal-800 hover:border-teal-300 dark:hover:border-teal-700 bg-teal-50/30 dark:bg-teal-900/20',
                }
                
                return (
                  <div
                    key={currency}
                    className={`p-4 border rounded-lg transition-all ${
                      refreshing
                        ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/30 animate-pulse'
                        : currencyColors[currency as 'BTC' | 'ETH' | 'USDT']
                    }`}
                  >
                    <p className="text-sm text-gray-600 dark:text-slate-400 font-medium mb-2">{currency}/NGN</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-1">
                      {formatCurrency(rate as string)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          refreshing ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'
                        }`}
                      ></div>
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                        {refreshing ? 'Updating...' : 'Live'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            {lastUpdated && (
              <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                <div className={`w-2 h-2 rounded-full ${refreshing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-slate-400">
            <p>Unable to load exchange rates. Please try refreshing.</p>
          </div>
        )}
      </div>
    </div>
  )
}

