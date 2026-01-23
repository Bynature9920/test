import { useEffect, useState } from 'react'
import { cryptoService } from '@/services/api/cryptoService'
import { cryptoRatesService } from '@/services/api/cryptoRatesService'
import { formatCurrency } from '@/utils/format'
import { Coins, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CryptoPage() {
  const [balances, setBalances] = useState<any[]>([])
  const [rates, setRates] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [balancesData, liveRates] = await Promise.all([
        cryptoService.getBalances(),
        cryptoRatesService.getLiveRates(true),
      ])
      setBalances(balancesData.balances || [])
      
      let updatedBalances = (balancesData.balances || []).map((bal: any) => {
        const rate = liveRates[bal.currency] || 0
        return {
          ...bal,
          ngn_value: (parseFloat(bal.balance) * rate).toFixed(2),
        }
      })

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
      try {
        const liveRates = await cryptoRatesService.getLiveRates(true)
        setBalances([
          { currency: 'USDT', balance: '0.00000000', ngn_value: '0.00' },
          { currency: 'BTC', balance: '0.00000000', ngn_value: '0.00' },
          { currency: 'ETH', balance: '0.00000000', ngn_value: '0.00' },
        ])
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
        console.error('Failed to fetch rates, using fallback:', rateError)
        const fallbackRates = { BTC: 50000000, USDT: 1500, ETH: 2000000 }
        setBalances([
          { currency: 'USDT', balance: '0.00000000', ngn_value: '0.00' },
          { currency: 'BTC', balance: '0.00000000', ngn_value: '0.00' },
          { currency: 'ETH', balance: '0.00000000', ngn_value: '0.00' },
        ])
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
      cryptoRatesService.clearCache()
      const liveRates = await cryptoRatesService.getLiveRates(true)
      
      let updatedBalances = balances.map((bal) => {
        const rate = liveRates[bal.currency] || 0
        return {
          ...bal,
          ngn_value: (parseFloat(bal.balance) * rate).toFixed(2),
        }
      })

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
      toast.success('Rates updated successfully!')
    } catch (error) {
      console.error('Failed to refresh rates:', error)
      toast.error('Failed to refresh rates')
    } finally {
      setRefreshing(false)
    }
  }

  const currencyInfo = {
    BTC: { 
      name: 'Bitcoin',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/30',
      borderColor: 'border-orange-200 dark:border-orange-800'
    },
    ETH: { 
      name: 'Ethereum',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    USDT: { 
      name: 'Tether',
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-900/30',
      borderColor: 'border-teal-200 dark:border-teal-800'
    },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Crypto</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your cryptocurrency</p>
      </div>

      {/* Crypto Balances */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Your Balances
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Real-time cryptocurrency holdings</p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : balances.length === 0 ? (
            <div className="text-center py-12">
              <Coins className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
              <p className="text-gray-600 dark:text-gray-400">No crypto balances yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {['USDT', 'BTC', 'ETH'].map((currency) => {
                const balance = balances.find((b) => b.currency === currency) || {
                  currency,
                  balance: '0.00000000',
                  ngn_value: '0.00',
                }
                
                const info = currencyInfo[currency as 'BTC' | 'ETH' | 'USDT']
                
                return (
                  <div
                    key={balance.currency}
                    className={`flex items-center justify-between p-5 border-2 ${info.borderColor} ${info.bgColor} rounded-xl hover:shadow-md transition-all`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className={`text-lg font-bold ${info.color}`}>{balance.currency}</p>
                        <span className="text-sm text-gray-500 dark:text-gray-400">•</span>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{info.name}</p>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {parseFloat(balance.balance).toLocaleString('en-US', {
                          minimumFractionDigits: 8,
                          maximumFractionDigits: 8,
                        })}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{balance.currency}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">NGN Value</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(balance.ngn_value)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
