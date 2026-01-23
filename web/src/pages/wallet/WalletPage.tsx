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
  
  // Deposit states
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositMethod, setDepositMethod] = useState<'card' | 'transfer' | 'ussd'>('card')
  const [processingDeposit, setProcessingDeposit] = useState(false)

  // Display the full numeric user ID
  const userId = user?.id || '000000000000'

  useEffect(() => {
    loadData()
    
    // Check if user returned from Paystack payment
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('deposit') === 'success') {
      toast.success('🎉 Payment successful! Your wallet will be credited shortly.', { duration: 5000 })
      
      // Remove the query parameter from URL
      window.history.replaceState({}, '', '/wallet')
      
      // Reload wallet data after a short delay to allow webhook processing
      setTimeout(() => {
        loadData()
      }, 3000)
    }
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
      toast.error('Failed to load wallet data')
      // NO DEMO DATA - Show actual empty state
      setBalance(null)
      setTransactions([])
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

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount)
    
    if (!depositAmount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (amount < 100) {
      toast.error('Minimum deposit amount is ₦100')
      return
    }

    if (amount > 10000000) {
      toast.error('Maximum deposit amount is ₦10,000,000')
      return
    }

    setProcessingDeposit(true)

    try {
      if (depositMethod === 'card') {
        // Initialize Paystack payment
        const response = await fetch('http://localhost:8000/api/v1/wallet/deposit/initialize', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amount,
            payment_method: 'card'
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          
          // Check if it's a configuration error (Paystack not set up)
          if (response.status === 500 && error.detail?.includes('Paystack is not configured')) {
            toast.error(
              '⚠️ Payment system not configured yet. Please see PAYSTACK_SETUP.md to set up Paystack.',
              { duration: 7000 }
            )
          } else {
            throw new Error(error.detail || 'Failed to initialize payment')
          }
          
          setProcessingDeposit(false)
          return
        }

        const data = await response.json()

        if (data.authorization_url) {
          // Redirect to Paystack payment page
          toast.success('Redirecting to Paystack...', { duration: 2000 })
          
          // Give user a moment to see the toast
          setTimeout(() => {
            window.location.href = data.authorization_url
          }, 500)
        } else {
          toast.error('No payment URL received from server')
          setProcessingDeposit(false)
        }
      } else if (depositMethod === 'transfer' || depositMethod === 'ussd') {
        // These methods are not yet available
        toast.error(`${depositMethod === 'transfer' ? 'Bank transfer' : 'USSD'} is not yet available. Please use Card payment.`)
        setProcessingDeposit(false)
      }
    } catch (error: any) {
      console.error('Deposit error:', error)
      toast.error(error.message || 'Failed to process deposit')
      setProcessingDeposit(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">Wallet</h2>
        <p className="text-gray-600 dark:text-slate-400 mt-1">Manage your wallet and currencies</p>
      </div>

      {/* User ID Card */}
      <div className="card bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm mb-1">Your Unique ID</p>
            <p className="text-lg sm:text-2xl font-bold font-mono break-all">{userId}</p>
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

      {/* Deposit Options - Main Feature */}
      <div className="card">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">Fund Your Wallet</h3>
        <p className="text-gray-600 dark:text-slate-400 mb-6">Choose your preferred deposit method</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card Payment */}
          <button
            onClick={() => {
              setDepositMethod('card')
              setShowDepositModal(true)
            }}
            className="p-6 border-2 border-gray-200 dark:border-slate-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group"
          >
            <div className="text-4xl mb-3">💳</div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">Card Payment</h4>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">
              Instant funding via Paystack
            </p>
            <div className="flex items-center justify-center gap-2 text-primary-600 dark:text-primary-400 font-medium group-hover:gap-3 transition-all">
              <span>Pay Now</span>
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </button>

          {/* Bank Transfer */}
          <button
            onClick={() => {
              toast.error('Bank transfer is coming soon. Please use Card payment.')
            }}
            className="p-6 border-2 border-gray-200 dark:border-slate-700 rounded-lg opacity-60 cursor-not-allowed"
          >
            <div className="text-4xl mb-3">🏦</div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">Bank Transfer</h4>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">
              Transfer to dedicated account
            </p>
            <div className="flex items-center justify-center gap-2 text-gray-400 font-medium">
              <span>Coming Soon</span>
            </div>
          </button>

          {/* USSD */}
          <button
            onClick={() => {
              toast.error('USSD is coming soon. Please use Card payment.')
            }}
            className="p-6 border-2 border-gray-200 dark:border-slate-700 rounded-lg opacity-60 cursor-not-allowed"
          >
            <div className="text-4xl mb-3">📱</div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">USSD Code</h4>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">
              Dial code on your phone
            </p>
            <div className="flex items-center justify-center gap-2 text-gray-400 font-medium">
              <span>Coming Soon</span>
            </div>
          </button>
        </div>
      </div>

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

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">Fund Your Wallet</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Deposit Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setDepositMethod('card')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      depositMethod === 'card'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    💳 Card
                  </button>
                  <button
                    onClick={() => setDepositMethod('transfer')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      depositMethod === 'transfer'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    🏦 Transfer
                  </button>
                  <button
                    onClick={() => setDepositMethod('ussd')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      depositMethod === 'ussd'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    📱 USSD
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="input-field"
                  placeholder="Enter amount (Min: ₦100)"
                  step="100"
                  min="100"
                  max="10000000"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                  Minimum: ₦100 | Maximum: ₦10,000,000
                </p>
              </div>

              {depositMethod === 'card' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    <strong>Card Payment:</strong> Instant funding via Paystack (1.5% fee).
                  </p>
                </div>
              )}

              {depositMethod === 'transfer' && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-sm text-yellow-900 dark:text-yellow-200">
                    <strong>⚠️ Coming Soon:</strong> Bank transfer is not yet available. Please use Card payment for now.
                  </p>
                </div>
              )}

              {depositMethod === 'ussd' && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-sm text-yellow-900 dark:text-yellow-200">
                    <strong>⚠️ Coming Soon:</strong> USSD payment is not yet available. Please use Card payment for now.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowDepositModal(false)
                    setDepositAmount('')
                  }}
                  className="flex-1 btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeposit}
                  disabled={!depositAmount || parseFloat(depositAmount) < 100 || processingDeposit}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50"
                >
                  {processingDeposit ? 'Processing...' : 'Proceed'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
