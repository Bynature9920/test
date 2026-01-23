import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, ChevronLeft, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { paymentsService } from '@/services/api/paymentsService'

const PROVIDERS = [
  { 
    code: 'mtn', 
    name: 'MTN', 
    color: 'bg-[#FFCC00]',
    textColor: 'text-[#FFCC00]',
    borderColor: 'border-[#FFCC00]',
    bgGradient: 'from-[#FFCC00] to-[#FFD700]'
  },
  { 
    code: 'airtel', 
    name: 'Airtel', 
    color: 'bg-[#E30613]',
    textColor: 'text-[#E30613]',
    borderColor: 'border-[#E30613]',
    bgGradient: 'from-[#E30613] to-[#FF0000]'
  },
  { 
    code: 'glo', 
    name: 'Glo', 
    color: 'bg-[#009E4F]',
    textColor: 'text-[#009E4F]',
    borderColor: 'border-[#009E4F]',
    bgGradient: 'from-[#009E4F] to-[#00C853]'
  },
  { 
    code: '9mobile', 
    name: '9mobile', 
    color: 'bg-[#007A3D]',
    textColor: 'text-[#007A3D]',
    borderColor: 'border-[#007A3D]',
    bgGradient: 'from-[#007A3D] to-[#00A651]'
  },
]

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000]

export default function AirtimePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'provider' | 'details' | 'confirm'>('provider')
  const [selectedProvider, setSelectedProvider] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [processing, setProcessing] = useState(false)

  const handleProviderSelect = (code: string) => {
    setSelectedProvider(code)
    setStep('details')
  }

  const handleContinue = () => {
    if (!phoneNumber || phoneNumber.length < 11) {
      toast.error('Please enter a valid phone number')
      return
    }
    if (!amount || parseFloat(amount) < 50) {
      toast.error('Minimum amount is ₦50')
      return
    }
    setStep('confirm')
  }

  const handlePayment = async () => {
    setProcessing(true)
    try {
      await paymentsService.payBill({
        bill_type: 'airtime',
        provider_code: selectedProvider,
        customer_identifier: phoneNumber,
        amount: parseFloat(amount),
      })
      toast.success('Airtime purchase successful!')
      navigate('/dashboard')
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Payment failed'
      toast.error(message)
    } finally {
      setProcessing(false)
    }
  }

  const selectedProviderData = PROVIDERS.find(p => p.code === selectedProvider)

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
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Buy Airtime</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {step === 'provider' && 'Select your network'}
              {step === 'details' && 'Enter phone number and amount'}
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
                        ₦{amt}
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
                <div className="flex justify-between py-3">
                  <span className="text-gray-600 dark:text-gray-400">Amount</span>
                  <span className="font-bold text-2xl text-primary-600 dark:text-primary-400">₦{amount}</span>
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
