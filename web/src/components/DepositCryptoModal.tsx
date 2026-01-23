import { useState, useEffect } from 'react'
import { X, Copy, Check, Download, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

interface DepositInfo {
  address: string
  qr_code: string
  hosted_url: string
  expires_at: string
  amount_crypto: any
  currency: string
}

interface DepositCryptoModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DepositCryptoModal({ isOpen, onClose }: DepositCryptoModalProps) {
  const [step, setStep] = useState<'select' | 'amount' | 'address'>('select')
  const [loading, setLoading] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USDT')
  const [amount, setAmount] = useState('')
  const [depositInfo, setDepositInfo] = useState<DepositInfo | null>(null)
  const [copiedAddress, setCopiedAddress] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Reset to selection step when opened
      setStep('select')
      setDepositInfo(null)
      setAmount('')
    }
  }, [isOpen])

  const handleContinue = () => {
    if (!selectedCurrency) {
      toast.error('Please select a cryptocurrency')
      return
    }
    setStep('amount')
  }

  const handleInitializeDeposit = async () => {
    const amountNum = parseFloat(amount)
    
    if (!amount || amountNum < 30000) {
      toast.error('Minimum deposit is ₦30,000 (NOWPayments requirement)')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/v1/crypto/deposit/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currency: selectedCurrency,
          amount: amountNum
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        
        if (response.status === 500 && error.detail?.includes('NOWPayments is not configured')) {
          toast.error(
            '⚠️ Crypto deposits not configured yet. Please contact support.',
            { duration: 7000 }
          )
        } else if (response.status === 503) {
          toast.error(
            '⚠️ Crypto deposit service is temporarily unavailable. Please try again in a few minutes.',
            { duration: 7000 }
          )
        } else if (error.detail?.includes('settlement') || error.detail?.includes('address')) {
          toast.error(
            '⚠️ Crypto service is being set up. Please try again later or contact support.',
            { duration: 7000 }
          )
        } else {
          throw new Error(error.detail || 'Failed to initialize deposit')
        }
        
        setLoading(false)
        return
      }

      const data = await response.json()
      setDepositInfo(data)
      setStep('address')
      toast.success('Deposit address generated!')
    } catch (error: any) {
      console.error('Error initializing deposit:', error)
      toast.error(error.message || 'Failed to initialize deposit')
    } finally {
      setLoading(false)
    }
  }

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopiedAddress(true)
    toast.success('Address copied to clipboard!')
    setTimeout(() => setCopiedAddress(false), 2000)
  }

  const downloadQR = (currency: string, qrCode: string) => {
    // Create a download link for the QR code
    const link = document.createElement('a')
    link.href = qrCode
    link.download = `${currency}_deposit_address.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`QR code downloaded for ${currency}`)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100">
              Deposit Cryptocurrency
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
              Send crypto to your wallet address below
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1: Select Currency */}
          {step === 'select' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-4">
                  Select Cryptocurrency
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Bitcoin */}
                  <button
                    onClick={() => setSelectedCurrency('BTC')}
                    className={`group relative p-4 sm:p-6 rounded-2xl border-2 transition-all duration-200 hover:scale-105 ${
                      selectedCurrency === 'BTC'
                        ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20 shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 hover:border-orange-300 hover:shadow-md bg-white dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                        selectedCurrency === 'BTC'
                          ? 'bg-orange-500 text-white'
                          : 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400'
                      }`}>
                        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z"/>
                        </svg>
                      </div>
                      <div className="font-bold text-lg text-gray-900 dark:text-slate-100 mb-1">
                        BTC
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">
                        Bitcoin
                      </div>
                    </div>
                    {selectedCurrency === 'BTC' && (
                      <div className="absolute top-2 right-2">
                        <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                  </button>

                  {/* Ethereum */}
                  <button
                    onClick={() => setSelectedCurrency('ETH')}
                    className={`group relative p-4 sm:p-6 rounded-2xl border-2 transition-all duration-200 hover:scale-105 ${
                      selectedCurrency === 'ETH'
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:shadow-md bg-white dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                        selectedCurrency === 'ETH'
                          ? 'bg-blue-500 text-white'
                          : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                      }`}>
                        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"/>
                        </svg>
                      </div>
                      <div className="font-bold text-lg text-gray-900 dark:text-slate-100 mb-1">
                        ETH
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">
                        Ethereum
                      </div>
                    </div>
                    {selectedCurrency === 'ETH' && (
                      <div className="absolute top-2 right-2">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                  </button>

                  {/* USDT */}
                  <button
                    onClick={() => setSelectedCurrency('USDT')}
                    className={`group relative p-4 sm:p-6 rounded-2xl border-2 transition-all duration-200 hover:scale-105 ${
                      selectedCurrency === 'USDT'
                        ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 hover:border-green-300 hover:shadow-md bg-white dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 mb-3 rounded-full overflow-hidden">
                        <img 
                          src="https://cryptologos.cc/logos/tether-usdt-logo.png" 
                          alt="USDT" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="font-bold text-lg text-gray-900 dark:text-slate-100 mb-1">
                        USDT
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">
                        Tether
                      </div>
                    </div>
                    {selectedCurrency === 'USDT' && (
                      <div className="absolute top-2 right-2">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Step 2: Enter Amount */}
          {step === 'amount' && (
            <>
              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
                <p className="text-sm text-primary-900 dark:text-primary-200">
                  <strong>Selected:</strong> {selectedCurrency} ({selectedCurrency === 'BTC' ? 'Bitcoin' : selectedCurrency === 'ETH' ? 'Ethereum' : 'Tether'})
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Amount to Deposit (NGN)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-slate-100"
                  placeholder="Enter amount (Min: ₦1,000)"
                  min="30000"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                  Minimum: ₦30,000
                </p>
              </div>
            </>
          )}

          {/* Step 3: Payment Ready - Redirect to NOWPayments */}
          {step === 'address' && depositInfo && (
            <>
              {/* Success Message */}
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100 mb-3">
                  Payment Link Ready! 🎉
                </h3>
                <p className="text-gray-600 dark:text-slate-400 mb-2">
                  Your {selectedCurrency} deposit request has been created successfully.
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-500">
                  Click the button below to complete your deposit securely through NOWPayments.
                </p>
              </div>

              {/* Main CTA - Go to NOWPayments */}
              {depositInfo.hosted_url && (
                <a
                  href={depositInfo.hosted_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  <button className="w-full py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2 sm:gap-3 font-semibold text-base sm:text-lg">
                    <ExternalLink className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-sm sm:text-base">Complete Deposit on NOWPayments</span>
                  </button>
                </a>
              )}

              {/* Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-slate-500 mb-1">Amount</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-slate-100">
                    ₦{parseInt(amount).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-slate-500 mb-1">Currency</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-slate-100">
                    {selectedCurrency}
                  </p>
                </div>
              </div>

              {/* What Happens Next */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5 mt-6">
                <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  What happens next?
                </h4>
                <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">1.</span>
                    <span>Click the button above to open NOWPayments secure page</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">2.</span>
                    <span>You'll see the payment address and QR code there</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">3.</span>
                    <span>Send {selectedCurrency} from your wallet to complete the deposit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">4.</span>
                    <span>Your BenGo wallet will be credited automatically (3-15 minutes)</span>
                  </li>
                </ol>
              </div>

              {/* Security Note */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mt-4">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="text-sm">
                  <p className="font-medium text-gray-900 dark:text-slate-100 mb-1">
                    🔒 Secure Payment
                  </p>
                  <p className="text-gray-600 dark:text-slate-400">
                    NOWPayments is a trusted crypto payment provider. Your transaction is secure and will be processed automatically.
                  </p>
                </div>
              </div>
            </>
          )}

          {loading && (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-slate-400">Processing...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => {
              if (step === 'amount') setStep('select')
              else if (step === 'address') setStep('amount')
              else onClose()
            }}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-slate-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {step === 'select' ? 'Close' : 'Back'}
          </button>

          {step === 'select' && (
            <button
              onClick={handleContinue}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              Continue
            </button>
          )}

          {step === 'amount' && (
            <button
              onClick={handleInitializeDeposit}
              disabled={loading || !amount || parseFloat(amount) < 30000}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Payment Link'}
            </button>
          )}

          {step === 'address' && (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
