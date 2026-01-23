import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wifi, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { paymentsService } from '@/services/api/paymentsService'

const PROVIDERS = [
  { 
    code: 'mtn-data', 
    name: 'MTN', 
    color: 'bg-[#FFCC00]',
    textColor: 'text-[#FFCC00]',
    borderColor: 'border-[#FFCC00]',
    bgGradient: 'from-[#FFCC00] to-[#FFD700]'
  },
  { 
    code: 'airtel-data', 
    name: 'Airtel', 
    color: 'bg-[#E30613]',
    textColor: 'text-[#E30613]',
    borderColor: 'border-[#E30613]',
    bgGradient: 'from-[#E30613] to-[#FF0000]'
  },
  { 
    code: 'glo-data', 
    name: 'Glo', 
    color: 'bg-[#009E4F]',
    textColor: 'text-[#009E4F]',
    borderColor: 'border-[#009E4F]',
    bgGradient: 'from-[#009E4F] to-[#00C853]'
  },
  { 
    code: '9mobile-data', 
    name: '9mobile', 
    color: 'bg-[#007A3D]',
    textColor: 'text-[#007A3D]',
    borderColor: 'border-[#007A3D]',
    bgGradient: 'from-[#007A3D] to-[#00A651]'
  },
]

const DATA_PLANS: Record<string, Array<{code: string, name: string, amount: number}>> = {
  'mtn-data': [
    { code: 'MTN-500MB-30D', name: '500MB - 30 Days', amount: 500 },
    { code: 'MTN-1GB-30D', name: '1GB - 30 Days', amount: 1000 },
    { code: 'MTN-2GB-30D', name: '2GB - 30 Days', amount: 2000 },
    { code: 'MTN-3GB-30D', name: '3GB - 30 Days', amount: 3000 },
    { code: 'MTN-5GB-30D', name: '5GB - 30 Days', amount: 5000 },
    { code: 'MTN-10GB-30D', name: '10GB - 30 Days', amount: 10000 },
  ],
  'airtel-data': [
    { code: 'AIRTEL-500MB-30D', name: '500MB - 30 Days', amount: 500 },
    { code: 'AIRTEL-1GB-30D', name: '1GB - 30 Days', amount: 1000 },
    { code: 'AIRTEL-2GB-30D', name: '2GB - 30 Days', amount: 2000 },
    { code: 'AIRTEL-3GB-30D', name: '3GB - 30 Days', amount: 3000 },
    { code: 'AIRTEL-5GB-30D', name: '5GB - 30 Days', amount: 5000 },
    { code: 'AIRTEL-10GB-30D', name: '10GB - 30 Days', amount: 10000 },
  ],
  'glo-data': [
    { code: 'GLO-500MB-30D', name: '500MB - 30 Days', amount: 500 },
    { code: 'GLO-1GB-30D', name: '1GB - 30 Days', amount: 1000 },
    { code: 'GLO-2GB-30D', name: '2GB - 30 Days', amount: 2000 },
    { code: 'GLO-3GB-30D', name: '3GB - 30 Days', amount: 3000 },
    { code: 'GLO-5GB-30D', name: '5GB - 30 Days', amount: 5000 },
    { code: 'GLO-10GB-30D', name: '10GB - 30 Days', amount: 10000 },
  ],
  '9mobile-data': [
    { code: '9MOBILE-500MB-30D', name: '500MB - 30 Days', amount: 500 },
    { code: '9MOBILE-1GB-30D', name: '1GB - 30 Days', amount: 1000 },
    { code: '9MOBILE-2GB-30D', name: '2GB - 30 Days', amount: 2000 },
    { code: '9MOBILE-3GB-30D', name: '3GB - 30 Days', amount: 3000 },
    { code: '9MOBILE-5GB-30D', name: '5GB - 30 Days', amount: 5000 },
    { code: '9MOBILE-10GB-30D', name: '10GB - 30 Days', amount: 10000 },
  ],
}

export default function DataPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'provider' | 'details' | 'confirm'>('provider')
  const [selectedProvider, setSelectedProvider] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<{code: string, name: string, amount: number} | null>(null)
  const [processing, setProcessing] = useState(false)

  const handleProviderSelect = (code: string) => {
    setSelectedProvider(code)
    setStep('details')
  }

  const handlePlanSelect = (plan: {code: string, name: string, amount: number}) => {
    setSelectedPlan(plan)
  }

  const handleContinue = () => {
    if (!phoneNumber || phoneNumber.length < 11) {
      toast.error('Please enter a valid phone number')
      return
    }
    if (!selectedPlan) {
      toast.error('Please select a data plan')
      return
    }
    setStep('confirm')
  }

  const handlePayment = async () => {
    if (!selectedPlan) return
    
    setProcessing(true)
    try {
      await paymentsService.payBill({
        bill_type: 'data',
        provider_code: selectedProvider,
        customer_identifier: phoneNumber,
        amount: selectedPlan.amount,
        plan_code: selectedPlan.code,
      })
      toast.success('Data purchase successful!')
      navigate('/dashboard')
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Payment failed'
      toast.error(message)
    } finally {
      setProcessing(false)
    }
  }

  const selectedProviderData = PROVIDERS.find(p => p.code === selectedProvider)
  const availablePlans = selectedProvider ? DATA_PLANS[selectedProvider] || [] : []

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
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Buy Data</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {step === 'provider' && 'Select your network'}
              {step === 'details' && 'Choose a data plan'}
              {step === 'confirm' && 'Confirm your purchase'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Step 1: Select Provider */}
        {step === 'provider' && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Select Network</h2>
            <div className="grid grid-cols-2 gap-4">
              {PROVIDERS.map((provider) => (
                <button
                  key={provider.code}
                  onClick={() => handleProviderSelect(provider.code)}
                  className="flex flex-col items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-700 hover:border-primary-500 transition-all"
                >
                  <div className={`w-16 h-16 rounded-full ${provider.color} flex items-center justify-center`}>
                    {provider.name === 'MTN' && (
                      <span className="text-black text-2xl font-black">MTN</span>
                    )}
                    {provider.name === 'Airtel' && (
                      <span className="text-white text-xl font-bold lowercase">airtel</span>
                    )}
                    {provider.name === 'Glo' && (
                      <span className="text-white text-2xl font-bold lowercase">glo</span>
                    )}
                    {provider.name === '9mobile' && (
                      <span className="text-white text-lg font-bold">9mobile</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{provider.name}</span>
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
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="08012345678"
                    maxLength={11}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Data Plan
                  </label>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {availablePlans.map((plan) => (
                      <button
                        key={plan.code}
                        onClick={() => handlePlanSelect(plan)}
                        className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                          selectedPlan?.code === plan.code
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{plan.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Valid for 30 days</p>
                          </div>
                          <p className="font-bold text-primary-600 dark:text-primary-400">₦{plan.amount}</p>
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
        {step === 'confirm' && selectedPlan && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confirm Purchase</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Network</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full ${selectedProviderData?.color} flex items-center justify-center`}>
                      <span className="text-white text-xs font-bold">
                        {selectedProviderData?.name === 'MTN' && <span className="text-black">M</span>}
                        {selectedProviderData?.name === 'Airtel' && 'A'}
                        {selectedProviderData?.name === 'Glo' && 'G'}
                        {selectedProviderData?.name === '9mobile' && '9'}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">{selectedProviderData?.name}</span>
                  </div>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Phone Number</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{phoneNumber}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Data Plan</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-600 dark:text-gray-400">Amount</span>
                  <span className="font-bold text-2xl text-primary-600 dark:text-primary-400">₦{selectedPlan.amount}</span>
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
