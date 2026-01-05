import { useEffect, useState } from 'react'
import { walletService } from '@/services/api/walletService'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/utils/format'
import { Wallet, ArrowUpRight, ArrowDownLeft, Eye, EyeOff, DollarSign, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

// USD to NGN exchange rate (demo - in production, fetch from API)
const USD_TO_NGN_RATE = 1500 // Approximate rate

export default function WalletPage() {
  const { user } = useAuth()
  const [balance, setBalance] = useState<any>(null)
  const [usdBalance, setUsdBalance] = useState<string>('0.00')
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [balanceHidden, setBalanceHidden] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [convertAmount, setConvertAmount] = useState('')
  const [convertDirection, setConvertDirection] = useState<'NGN_TO_USD' | 'USD_TO_NGN'>('NGN_TO_USD')
  const [converting, setConverting] = useState(false)
  const [userIdCopied, setUserIdCopied] = useState(false)

  // Display the full numeric user ID
  const userId = user?.id || '000000000000'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [balanceData, transactionsData] = await Promise.all([
        walletService.getBalance(),
        walletService.getTransactions(),
      ])
      setBalance(balanceData)
      setTransactions(transactionsData.transactions || [])
      
      // Calculate USD balance
      if (balanceData?.available_balance) {
        const ngnAmount = parseFloat(balanceData.available_balance)
        const usdAmount = (ngnAmount / USD_TO_NGN_RATE).toFixed(2)
        setUsdBalance(usdAmount)
      }
    } catch (error) {
      console.error('Failed to load wallet data:', error)
      // Demo data if API fails
      const demoBalance = {
        available_balance: '50000.00',
        pending_balance: '5000.00',
        total_balance: '55000.00',
        currency: 'NGN',
        usd_balance: '33.33',
      }
      setBalance(demoBalance)
      setUsdBalance('33.33')
      setTransactions([
        {
          id: 'txn-1',
          transaction_type: 'P2P',
          status: 'COMPLETED',
          amount: '5000.00',
          currency: 'NGN',
          description: 'Payment from John Doe',
          created_at: new Date().toISOString(),
        },
        {
          id: 'txn-2',
          transaction_type: 'BANK_TRANSFER',
          status: 'COMPLETED',
          amount: '10000.00',
          currency: 'NGN',
          description: 'Transfer to bank account',
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleConvert = async () => {
    if (!convertAmount || parseFloat(convertAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setConverting(true)
    try {
      const amount = parseFloat(convertAmount)
      const ngnBalance = parseFloat(balance?.available_balance || '0')
      
      if (convertDirection === 'NGN_TO_USD') {
        if (amount > ngnBalance) {
          toast.error('Insufficient NGN balance')
          setConverting(false)
          return
        }
        const usdAmount = (amount / USD_TO_NGN_RATE).toFixed(2)
        // Update balances (demo mode)
        setBalance({
          ...balance,
          available_balance: (ngnBalance - amount).toFixed(2),
        })
        setUsdBalance((parseFloat(usdBalance) + parseFloat(usdAmount)).toFixed(2))
        toast.success(`Converted ₦${amount.toLocaleString()} to $${usdAmount}`)
      } else {
        const usdAmount = parseFloat(usdBalance)
        if (amount > usdAmount) {
          toast.error('Insufficient USD balance')
          setConverting(false)
          return
        }
        const ngnAmount = (amount * USD_TO_NGN_RATE).toFixed(2)
        setBalance({
          ...balance,
          available_balance: (ngnBalance + parseFloat(ngnAmount)).toFixed(2),
        })
        setUsdBalance((usdAmount - amount).toFixed(2))
        toast.success(`Converted $${amount.toLocaleString()} to ₦${parseFloat(ngnAmount).toLocaleString()}`)
      }
      
      setShowConvertModal(false)
      setConvertAmount('')
    } catch (error) {
      toast.error('Conversion failed')
    } finally {
      setConverting(false)
    }
  }

  const copyUserId = () => {
    navigator.clipboard.writeText(userId)
    setUserIdCopied(true)
    toast.success('User ID copied to clipboard!')
    setTimeout(() => setUserIdCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Wallet</h2>
        <p className="text-gray-600 dark:text-slate-400 mt-1">Manage your wallet and currencies</p>
      </div>

      {/* User ID Card */}
      <div className="card bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm mb-1">Your Unique ID</p>
            <p className="text-2xl font-bold font-mono">{userId}</p>
            <p className="text-purple-100 text-xs mt-1">Share this ID to receive money from other users</p>
          </div>
          <button
            onClick={copyUserId}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            {userIdCopied ? (
              <>
                <Check className="w-4 h-4" />
                <span className="text-sm">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span className="text-sm">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card animate-pulse">
          <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded"></div>
        </div>
      ) : (
        <div className="card bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-primary-100 text-sm">Available Balance</p>
                <button
                  onClick={() => setBalanceHidden(!balanceHidden)}
                  className="text-primary-100 hover:text-white transition-colors"
                  title={balanceHidden ? 'Show balance' : 'Hide balance'}
                >
                  {balanceHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-4xl font-bold mt-2">
                {balanceHidden ? '••••••' : (balance ? formatCurrency(balance.available_balance) : '₦0.00')}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <p className="text-primary-100 text-sm">
                  Pending: {balanceHidden ? '••••' : (balance ? formatCurrency(balance.pending_balance) : '₦0.00')}
                </p>
                <div className="h-4 w-px bg-primary-300"></div>
                <p className="text-primary-100 text-sm">
                  USD: {balanceHidden ? '••••' : `$${parseFloat(usdBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <Wallet className="w-16 h-16 text-primary-200" />
              <button
                onClick={() => setShowConvertModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm"
              >
                <DollarSign className="w-4 h-4" />
                Convert Currency
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert Currency Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">Convert Currency</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Convert Direction
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConvertDirection('NGN_TO_USD')}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      convertDirection === 'NGN_TO_USD'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    NGN → USD
                  </button>
                  <button
                    onClick={() => setConvertDirection('USD_TO_NGN')}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      convertDirection === 'USD_TO_NGN'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    USD → NGN
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Amount ({convertDirection === 'NGN_TO_USD' ? 'NGN' : 'USD'})
                </label>
                <input
                  type="number"
                  value={convertAmount}
                  onChange={(e) => setConvertAmount(e.target.value)}
                  className="input-field"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                />
                {convertAmount && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                    You will receive:{' '}
                    <span className="font-semibold">
                      {convertDirection === 'NGN_TO_USD'
                        ? `$${((parseFloat(convertAmount) || 0) / USD_TO_NGN_RATE).toFixed(2)}`
                        : `₦${((parseFloat(convertAmount) || 0) * USD_TO_NGN_RATE).toFixed(2)}`}
                    </span>
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConvertModal(false)
                    setConvertAmount('')
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConvert}
                  disabled={converting || !convertAmount}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {converting ? 'Converting...' : 'Convert'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Recent Transactions</h3>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-slate-400">
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {tx.transaction_type === 'P2P' ? (
                    <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <ArrowDownLeft className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-slate-200">{tx.transaction_type}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{tx.description || 'No description'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-slate-100">
                    {formatCurrency(tx.amount)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
