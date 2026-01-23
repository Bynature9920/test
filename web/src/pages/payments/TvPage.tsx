import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tv, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { paymentsService } from '@/services/api/paymentsService'

const PROVIDERS = [
  { code: 'dstv', name: 'DStv', logo: '📺' },
  { code: 'gotv', name: 'GOtv', logo: '📡' },
  { code: 'startimes', name: 'StarTimes', logo: '⭐' },
  { code: 'showmax', name: 'Showmax', logo: '🎬' },
]

const TV_PACKAGES: Record<string, Array<{code: string, name: string, amount: number}>> = {
  'dstv': [
    { code: 'DSTV-PADI', name: 'DStv Padi', amount: 2500 },
    { code: 'DSTV-YANGA', name: 'DStv Yanga', amount: 3500 },
    { code: 'DSTV-CONFAM', name: 'DStv Confam', amount: 6200 },
    { code: 'DSTV-COMPACT', name: 'DStv Compact', amount: 10500 },
    { code: 'DSTV-COMPACT-PLUS', name: 'DStv Compact Plus', amount: 16600 },
    { code: 'DSTV-PREMIUM', name: 'DStv Premium', amount: 24500 },
  ],
  'gotv': [
    { code: 'GOTV-LITE', name: 'GOtv Lite', amount: 1100 },
    { code: 'GOTV-JINJA', name: 'GOtv Jinja', amount: 2250 },
    { code: 'GOTV-JOLLI', name: 'GOtv Jolli', amount: 3300 },
    { code: 'GOTV-MAX', name: 'GOtv Max', amount: 4850 },
    { code: 'GOTV-SUPA', name: 'GOtv Supa', amount: 6400 },
  ],
  'startimes': [
    { code: 'STARTIMES-NOVA', name: 'Nova', amount: 1200 },
    { code: 'STARTIMES-BASIC', name: 'Basic', amount: 2100 },
    { code: 'STARTIMES-SMART', name: 'Smart', amount: 2800 },
    { code: 'STARTIMES-CLASSIC', name: 'Classic', amount: 3200 },
    { code: 'STARTIMES-SUPER', name: 'Super', amount: 5000 },
  ],
  'showmax': [
    { code: 'SHOWMAX-MOBILE', name: 'Mobile', amount: 1450 },
    { code: 'SHOWMAX-STANDARD', name: 'Standard', amount: 2900 },
    { code: 'SHOWMAX-PRO', name: 'Pro', amount: 4300 },
  ],
}

export default function TvPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'provider' | 'details' | 'confirm'>('provider')
  const [selectedProvider, setSelectedProvider] = useState('')
  const [smartCardNumber, setSmartCardNumber] = useState('')
  const [selectedPackage, setSelectedPackage] = useState<{code: string, name: string, amount: number} | null>(null)
  const [processing, setProcessing] = useState(false)

  const handleProviderSelect = (code: string) => {
    setSelectedProvider(code)
    setStep('details')
  }

  const handlePackageSelect = (pkg: {code: string, name: string, amount: number}) => {
    setSelectedPackage(pkg)
  }

  const handleContinue = () => {
    if (!smartCardNumber || smartCardNumber.length < 10) {
      toast.error('Please enter a valid smart card number')
      return
    }
    if (!selectedPackage) {
      toast.error('Please select a subscription package')
      return
    }
    setStep('confirm')
  }

  const handlePayment = async () => {
    if (!selectedPackage) return
    
    setProcessing(true)
    try {
      await paymentsService.payBill({
        bill_type: 'tv',
        provider_code: selectedProvider,
        customer_identifier: smartCardNumber,
        amount: selectedPackage.amount,
        plan_code: selectedPackage.code,
      })
      toast.success('TV subscription successful!')
      navigate('/dashboard')
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Payment failed'
      toast.error(message)
    } finally {
      setProcessing(false)
    }
  }

  const selectedProviderData = PROVIDERS.find(p => p.code === selectedProvider)
  const availablePackages = selectedProvider ? TV_PACKAGES[selectedProvider] || [] : []

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
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">TV Subscription</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {step === 'provider' && 'Select TV provider'}
              {step === 'details' && 'Choose a package'}
              {step === 'confirm' && 'Confirm your subscription'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Step 1: Select Provider */}
        {step === 'provider' && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select TV Provider</h2>
            <div className="grid grid-cols-2 gap-4">
              {PROVIDERS.map((provider) => (
                <button
                  key={provider.code}
                  onClick={() => handleProviderSelect(provider.code)}
                  className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all text-center"
                >
                  <div className="text-4xl mb-2">{provider.logo}</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{provider.name}</h3>
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
                <div className="text-3xl">{selectedProviderData?.logo}</div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedProviderData?.name}</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Smart Card Number / IUC Number
                  </label>
                  <input
                    type="text"
                    value={smartCardNumber}
                    onChange={(e) => setSmartCardNumber(e.target.value)}
                    placeholder="Enter your smart card number"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Package
                  </label>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {availablePackages.map((pkg) => (
                      <button
                        key={pkg.code}
                        onClick={() => handlePackageSelect(pkg)}
                        className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                          selectedPackage?.code === pkg.code
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{pkg.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Monthly subscription</p>
                          </div>
                          <p className="font-bold text-primary-600 dark:text-primary-400">₦{pkg.amount}</p>
                        </div>
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
        {step === 'confirm' && selectedPackage && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confirm Subscription</h2>
              <div className="space-y-3">
                <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Provider</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedProviderData?.name}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Smart Card Number</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{smartCardNumber}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Package</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedPackage.name}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-600 dark:text-gray-400">Amount</span>
                  <span className="font-bold text-2xl text-primary-600 dark:text-primary-400">₦{selectedPackage.amount}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
