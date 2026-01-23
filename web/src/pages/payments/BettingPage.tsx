import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { paymentsService } from '@/services/api/paymentsService'

const BETTING_PLATFORMS = [
  { code: 'SPORTYBET', name: 'SportyBet', logo: '⚽' },
  { code: 'BET9JA', name: 'Bet9ja', logo: '🎰' },
  { code: 'BETWAY', name: 'Betway', logo: '🎲' },
  { code: '1XBET', name: '1xBet', logo: '🏆' },
  { code: 'NAIRABET', name: 'NairaBet', logo: '🎯' },
  { code: 'MERRYBET', name: 'MerryBet', logo: '🍀' },
  { code: '22BET', name: '22Bet', logo: '🎊' },
  { code: 'ILOTBET', name: 'iLOTBet', logo: '🎪' },
]

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000]

export default function BettingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'provider' | 'details' | 'confirm'>('provider')
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [accountId, setAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [processing, setProcessing] = useState(false)

  const handlePlatformSelect = (code: string) => {
    setSelectedPlatform(code)
    setStep('details')
  }

  const handleContinue = () => {
    if (!accountId || accountId.length < 5) {
      toast.error('Please enter a valid betting account ID')
      return
    }
    if (!amount || parseFloat(amount) < 100) {
      toast.error('Minimum amount is ₦100')
      return
    }
    setStep('confirm')
  }

  const handlePayment = async () => {
    setProcessing(true)
    try {
      await paymentsService.fundBettingAccount({
        platform_code: selectedPlatform,
        account_id: accountId,
        amount: parseFloat(amount),
      })
      toast.success('Betting account funded successfully!')
      navigate('/dashboard')
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Payment failed'
      toast.error(message)
    } finally {
      setProcessing(false)
    }
  }

  const selectedPlatformData = BETTING_PLATFORMS.find(p => p.code === selectedPlatform)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => step === 'provider' ? navigate('/dashboard') : setStep(step === 'confirm' ? 'details' : 'provider')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Fund Betting Account</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {step === 'provider' && 'Select betting platform'}
              {step === 'details' && 'Enter account details'}
              {step === 'confirm' && 'Confirm your payment'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Step 1: Select Platform */}
        {step === 'provider' && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Betting Platform</h2>
            <div className="grid grid-cols-2 gap-4">
              {BETTING_PLATFORMS.map((platform) => (
                <button
                  key={platform.code}
                  onClick={() => handlePlatformSelect(platform.code)}
                  className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all text-center"
                >
                  <div className="text-4xl mb-2">{platform.logo}</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{platform.name}</h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Enter Details */}
        {step === 'details' && (
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-3xl">{selectedPlatformData?.logo}</div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedPlatformData?.name}</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Betting Account ID / Username
                  </label>
                  <input
                    type="text"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    placeholder="Enter your betting account ID"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter your account ID or username from {selectedPlatformData?.name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount (₦)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {QUICK_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setAmount(amt.toString())}
                        className="py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white transition-colors"
                      >
                        ₦{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleContinue}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confirm Payment</h2>
              <div className="space-y-3">
                <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Platform</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedPlatformData?.name}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Account ID</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{accountId}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-600 dark:text-gray-400">Amount</span>
                  <span className="font-bold text-2xl text-primary-600 dark:text-primary-400">₦{amount}</span>
                </div>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  ⚠️ Please verify your account ID is correct. Funds sent to wrong accounts cannot be reversed.
                </p>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : 'Fund Account'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
