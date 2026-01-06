import { useEffect, useState } from 'react'
import { walletService } from '@/services/api/walletService'
import { Wallet, TrendingUp, Send, Coins, Eye, EyeOff, ArrowDownCircle } from 'lucide-react'
import { formatCurrency } from '@/utils/format'

export default function DashboardPage() {
  const [balance, setBalance] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hideBalance, setHideBalance] = useState(false)

  useEffect(() => {
    loadBalance()
  }, [])

  const loadBalance = async () => {
    try {
      const data = await walletService.getBalance()
      setBalance(data)
    } catch (error) {
      console.error('Failed to load balance:', error)
      // Show zero balance if API fails (real accounts start at ₦0.00)
      setBalance({
        available_balance: '0.00',
        pending_balance: '0.00',
        total_balance: '0.00',
        currency: 'NGN',
        crypto_value: '0.00',
      })
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    {
      name: 'Crypto Value',
      value: balance?.crypto_value ? formatCurrency(balance.crypto_value) : '₦0.00',
      icon: Coins,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/30',
    },
    {
      name: 'Deposit Crypto',
      value: '₦0.00',
      icon: ArrowDownCircle,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back! Here's your financial overview.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Available Balance with Hide/Show */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Available Balance</p>
                  <button
                    onClick={() => setHideBalance(!hideBalance)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-colors"
                    title={hideBalance ? 'Show balance' : 'Hide balance'}
                  >
                    {hideBalance ? (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {hideBalance ? '****' : (balance ? formatCurrency(balance.available_balance) : '₦0.00')}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg">
                <Wallet className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          {/* Other Stats */}
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.name} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Transactions</h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No transactions yet</p>
          <p className="text-sm mt-2">Your transaction history will appear here</p>
        </div>
      </div>
    </div>
  )
}

