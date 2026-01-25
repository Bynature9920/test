import { useEffect, useState, useRef } from 'react'
import { walletService } from '@/services/api/walletService'
import { Wallet, TrendingUp, Send, Coins, Eye, EyeOff, ArrowDownCircle, CreditCard, Building2, Smartphone, Phone, Wifi, Tv, Trophy, ArrowLeftRight, Sparkles, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/utils/format'
import DepositCryptoModal from '@/components/DepositCryptoModal'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

type BalanceView = 'naira' | 'crypto'
type CryptoType = 'USDT' | 'BTC' | 'ETH'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [balance, setBalance] = useState<any>(null)
  const [cryptoBalances, setCryptoBalances] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hideBalance, setHideBalance] = useState(false)
  const [showDepositCryptoModal, setShowDepositCryptoModal] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositMethod, setDepositMethod] = useState<'card' | 'transfer' | 'ussd'>('card')
  const [processingDeposit, setProcessingDeposit] = useState(false)
  const [convertCurrency, setConvertCurrency] = useState<'USDT' | 'BTC' | 'ETH'>('USDT')
  const [convertAmount, setConvertAmount] = useState('')
  const [processingConvert, setProcessingConvert] = useState(false)
  
  // Swipeable balance card state
  const [currentView, setCurrentView] = useState<BalanceView>('naira')
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoType>('USDT')
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadBalance()
    loadCryptoBalances()
  }, [])

  const loadBalance = async () => {
    try {
      const data = await walletService.getBalance()
      console.log('Balance data received:', data)
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

  const loadCryptoBalances = async () => {
    try {
      const data = await walletService.getAllBalances()
      console.log('Crypto balances received:', data)
      
      // Extract crypto balances
      const cryptoData: Record<CryptoType, string> = {
        USDT: '0.00',
        BTC: '0.00',
        ETH: '0.00'
      }
      
      if (data.balances) {
        data.balances.forEach((bal: any) => {
          if (bal.currency === 'USDT' || bal.currency === 'BTC' || bal.currency === 'ETH') {
            cryptoData[bal.currency as CryptoType] = bal.available_balance
          }
        })
      }
      
      setCryptoBalances(cryptoData)
    } catch (error) {
      console.error('Failed to load crypto balances:', error)
      // Set default zero balances
      setCryptoBalances({
        USDT: '0.00',
        BTC: '0.00',
        ETH: '0.00'
      })
    }
  }

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setProcessingDeposit(true)
    try {
      if (depositMethod === 'card') {
        const paymentData = await walletService.initializeDeposit(parseFloat(depositAmount))
        if (paymentData.authorization_url) {
          window.location.href = paymentData.authorization_url
        }
      } else if (depositMethod === 'transfer') {
        toast.success('Bank transfer details will be provided')
      } else if (depositMethod === 'ussd') {
        toast.success('USSD code will be provided')
      }
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Failed to process deposit'
      toast.error(message)
    } finally {
      setProcessingDeposit(false)
    }
  }

  const handleConvert = async () => {
    if (!convertAmount || parseFloat(convertAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setProcessingConvert(true)
    try {
      // TODO: Implement crypto to Naira conversion API
      toast.success(`Converting ${convertAmount} ${convertCurrency} to Naira...`)
      // Placeholder for now - will need backend implementation
      setTimeout(() => {
        setShowConvertModal(false)
        setConvertAmount('')
        toast.success('Conversion completed successfully!')
        loadBalance() // Reload balance after conversion
      }, 2000)
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Failed to convert crypto'
      toast.error(message)
    } finally {
      setProcessingConvert(false)
    }
  }

  // Swipe gesture handlers
  const minSwipeDistance = 50
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
    setIsDragging(true)
  }
  
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return
    const currentTouch = e.targetTouches[0].clientX
    const diff = currentTouch - touchStart
    
    // Limit drag to prevent over-scrolling
    const maxDrag = 100
    const limitedDiff = Math.max(-maxDrag, Math.min(maxDrag, diff))
    setDragOffset(limitedDiff)
    setTouchEnd(currentTouch)
  }
  
  const onTouchEnd = () => {
    if (!touchStart || touchEnd === null) {
      setIsDragging(false)
      setDragOffset(0)
      return
    }
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe && currentView === 'naira') {
      // Swipe left: go to crypto view
      setCurrentView('crypto')
    } else if (isRightSwipe && currentView === 'crypto') {
      // Swipe right: go back to naira view
      setCurrentView('naira')
    }
    
    setIsDragging(false)
    setDragOffset(0)
    setTouchStart(null)
    setTouchEnd(null)
  }

  // Mouse drag handlers for desktop
  const onMouseDown = (e: React.MouseEvent) => {
    setTouchEnd(null)
    setTouchStart(e.clientX)
    setIsDragging(true)
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!touchStart || !isDragging) return
    const currentPos = e.clientX
    const diff = currentPos - touchStart
    
    // Limit drag to prevent over-scrolling
    const maxDrag = 100
    const limitedDiff = Math.max(-maxDrag, Math.min(maxDrag, diff))
    setDragOffset(limitedDiff)
    setTouchEnd(currentPos)
  }

  const onMouseUp = () => {
    if (!touchStart || touchEnd === null) {
      setIsDragging(false)
      setDragOffset(0)
      return
    }
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe && currentView === 'naira') {
      setCurrentView('crypto')
    } else if (isRightSwipe && currentView === 'crypto') {
      setCurrentView('naira')
    }
    
    setIsDragging(false)
    setDragOffset(0)
    setTouchStart(null)
    setTouchEnd(null)
  }

  const getCryptoIcon = (crypto: CryptoType) => {
    switch (crypto) {
      case 'USDT':
        return '₮'
      case 'BTC':
        return '₿'
      case 'ETH':
        return 'Ξ'
    }
  }

  const formatCryptoBalance = (amount: string, crypto: CryptoType) => {
    const num = parseFloat(amount)
    if (isNaN(num)) return '0.00'
    
    if (crypto === 'BTC') {
      return num.toFixed(8) // Bitcoin uses 8 decimals
    } else if (crypto === 'ETH') {
      return num.toFixed(6) // Ethereum uses 6 decimals
    } else {
      return num.toFixed(2) // USDT uses 2 decimals
    }
  }

  const depositOptions = [
    {
      name: 'Card Payment',
      method: 'card' as const,
      icon: CreditCard,
      description: 'Pay with debit/credit card',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    },
    {
      name: 'Bank Transfer',
      method: 'transfer' as const,
      icon: Building2,
      description: 'Transfer to BenGo account',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
    },
    {
      name: 'USSD Code',
      method: 'ussd' as const,
      icon: Smartphone,
      description: 'Use USSD code to fund',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/30',
    },
  ]

  const payBillsOptions = [
    {
      name: 'Airtime',
      icon: Phone,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      action: () => navigate('/payments/airtime'),
    },
    {
      name: 'Data',
      icon: Wifi,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
      action: () => navigate('/payments/data'),
    },
    {
      name: 'TV',
      icon: Tv,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/30',
      action: () => navigate('/payments/tv'),
    },
    {
      name: 'Betting account',
      icon: Trophy,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/30',
      action: () => navigate('/payments/betting'),
    },
  ]

  const stats = [
    {
      name: 'Deposit Crypto',
      value: '₦0.00',
      icon: ArrowDownCircle,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Premium Header with Gradient */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 dark:from-primary-900 dark:via-primary-950 dark:to-gray-950 text-white p-6 md:p-8 rounded-b-3xl shadow-xl mb-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
              <p className="text-sm text-primary-100">Welcome back,</p>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">{user?.first_name || 'User'}</h2>
          </div>

          {loading ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 animate-pulse">
              <div className="h-20 bg-white/10 rounded"></div>
            </div>
          ) : (
            <>
              {/* Swipeable Balance Card */}
              <div className="relative">
                {/* Swipe Indicators */}
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      currentView === 'naira' ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                    }`}
                  />
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      currentView === 'crypto' ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                    }`}
                  />
                </div>

                {/* Balance Card Container */}
                <div
                  ref={cardRef}
                  className="relative overflow-hidden touch-pan-y select-none cursor-grab active:cursor-grabbing"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onMouseLeave={() => {
                    if (isDragging) onMouseUp()
                  }}
                >
                  <div
                    className="flex transition-transform duration-300 ease-out"
                    style={{
                      transform: isDragging
                        ? `translateX(${dragOffset}px)`
                        : currentView === 'naira'
                        ? 'translateX(0%)'
                        : 'translateX(-100%)',
                    }}
                  >
                    {/* Naira Balance View */}
                    <div className="w-full flex-shrink-0">
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:bg-white/15 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-white/80" />
                            <p className="text-sm font-medium text-white/80">Available Balance</p>
                          </div>
                          <button
                            onClick={() => setHideBalance(!hideBalance)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-all transform hover:scale-110"
                            title={hideBalance ? 'Show balance' : 'Hide balance'}
                          >
                            {hideBalance ? (
                              <EyeOff className="w-5 h-5 text-white/80" />
                            ) : (
                              <Eye className="w-5 h-5 text-white/80" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <p className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                            {hideBalance ? '••••••' : (balance ? formatCurrency(balance.available_balance) : '₦0.00')}
                          </p>
                        </div>
                        <div className="flex items-center justify-center mt-3 opacity-50">
                          <ChevronLeft className="w-4 h-4 text-white/60" />
                          <span className="text-xs text-white/60 mx-2">Swipe for crypto</span>
                          <ChevronRight className="w-4 h-4 text-white/60" />
                        </div>
                      </div>
                    </div>

                    {/* Crypto Balance View */}
                    <div className="w-full flex-shrink-0 pl-4">
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:bg-white/15 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Coins className="w-5 h-5 text-white/80" />
                            <p className="text-sm font-medium text-white/80">Crypto Balance</p>
                          </div>
                          <button
                            onClick={() => setHideBalance(!hideBalance)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-all transform hover:scale-110"
                            title={hideBalance ? 'Show balance' : 'Hide balance'}
                          >
                            {hideBalance ? (
                              <EyeOff className="w-5 h-5 text-white/80" />
                            ) : (
                              <Eye className="w-5 h-5 text-white/80" />
                            )}
                          </button>
                        </div>
                        
                        {/* Crypto Amount Display */}
                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-3xl md:text-4xl font-bold text-white/90">
                            {getCryptoIcon(selectedCrypto)}
                          </span>
                          <p className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                            {hideBalance
                              ? '••••••'
                              : cryptoBalances
                              ? formatCryptoBalance(cryptoBalances[selectedCrypto], selectedCrypto)
                              : '0.00'}
                          </p>
                          <span className="text-xl text-white/60 font-semibold">{selectedCrypto}</span>
                        </div>

                        {/* Crypto Selector Pills */}
                        <div className="flex items-center gap-2">
                          {(['USDT', 'BTC', 'ETH'] as CryptoType[]).map((crypto) => (
                            <button
                              key={crypto}
                              onClick={() => setSelectedCrypto(crypto)}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                selectedCrypto === crypto
                                  ? 'bg-white text-primary-600 shadow-md'
                                  : 'bg-white/10 text-white/70 hover:bg-white/20'
                              }`}
                            >
                              {getCryptoIcon(crypto)} {crypto}
                            </button>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-center mt-3 opacity-50">
                          <ChevronLeft className="w-4 h-4 text-white/60" />
                          <span className="text-xs text-white/60 mx-2">Swipe for Naira</span>
                          <ChevronRight className="w-4 h-4 text-white/60" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6 -mt-4">
        {!loading && (
          <>
            {/* Quick Actions - Enhanced Design */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Quick Actions</h3>
              <div className="flex justify-start gap-6 md:gap-8">
                {/* Deposit Crypto Button */}
                <button
                  onClick={() => setShowDepositCryptoModal(true)}
                  className="flex flex-col items-center gap-3 group"
                >
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 w-16 h-16 md:w-18 md:h-18 rounded-2xl flex items-center justify-center transition-all hover:scale-110 hover:shadow-xl shadow-lg group-hover:shadow-blue-500/50">
                    <Plus className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center max-w-[70px]">Deposit Crypto</span>
                </button>

                {/* Convert to Naira Button */}
                <button
                  onClick={() => setShowConvertModal(true)}
                  className="flex flex-col items-center gap-3 group"
                >
                  <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 w-16 h-16 md:w-18 md:h-18 rounded-2xl flex items-center justify-center transition-all hover:scale-110 hover:shadow-xl shadow-lg group-hover:shadow-green-500/50">
                    <ArrowLeftRight className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center max-w-[70px]">Convert to Naira</span>
                </button>

                {/* Send to User Button */}
                <button
                  onClick={() => navigate('/send-to-user')}
                  className="flex flex-col items-center gap-3 group"
                >
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 w-16 h-16 md:w-18 md:h-18 rounded-2xl flex items-center justify-center transition-all hover:scale-110 hover:shadow-xl shadow-lg group-hover:shadow-purple-500/50">
                    <Send className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center max-w-[70px]">Send to User</span>
                </button>
              </div>
            </div>

        {/* Fund Your Wallet - Premium Grid */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-4 md:p-6 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/40 dark:to-blue-900/40 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Fund Your Wallet
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Choose your preferred funding method</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4">
              {depositOptions.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.method}
                    onClick={() => {
                      setDepositMethod(option.method)
                      setShowDepositModal(true)
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all hover:shadow-lg hover:scale-105 group"
                  >
                    <div className={`${option.bgColor} w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-md`}>
                      <Icon className={`w-6 h-6 ${option.color}`} strokeWidth={2} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center leading-tight">{option.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Pay Bills - Premium Grid */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-4 md:p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/40 dark:to-emerald-900/40 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Pay Bills
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Quick bill payments at your fingertips</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-4 gap-4">
              {payBillsOptions.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.name}
                    onClick={option.action}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 transition-all hover:shadow-lg hover:scale-105 group"
                  >
                    <div className={`${option.bgColor} w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-md`}>
                      <Icon className={`w-6 h-6 ${option.color}`} strokeWidth={2} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center leading-tight max-w-[70px]">{option.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Recent Transactions - Enhanced Empty State */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recent Transactions
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your latest financial activity</p>
          </div>
          <div className="p-8 md:p-12">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Coins className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No transactions yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your transaction history will appear here once you start using BenGo</p>
            </div>
          </div>
        </div>
      </>
        )}
      </div>

      {/* Deposit Crypto Modal */}
      <DepositCryptoModal
        isOpen={showDepositCryptoModal}
        onClose={() => setShowDepositCryptoModal(false)}
      />

      {/* Convert to Naira Modal - Premium Design */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md border border-gray-200 dark:border-gray-800 animate-scale-in">
            {/* Modal Header */}
            <div className="relative p-6 pb-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-t-3xl border-b border-gray-200 dark:border-gray-800">
              <button
                onClick={() => {
                  setShowConvertModal(false)
                  setConvertAmount('')
                }}
                className="absolute top-4 right-4 p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-xl transition-all"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <ArrowLeftRight className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Convert to Naira</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Instant crypto conversion</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Currency Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Select Cryptocurrency
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['USDT', 'BTC', 'ETH'] as const).map((currency) => (
                    <button
                      key={currency}
                      onClick={() => setConvertCurrency(currency)}
                      className={`p-4 rounded-xl border-2 transition-all font-bold shadow-sm hover:shadow-md ${
                        convertCurrency === currency
                          ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/40 dark:to-green-900/20 text-green-700 dark:text-green-300 scale-105'
                          : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-green-300 dark:hover:border-green-700'
                      }`}
                    >
                      {currency}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Amount ({convertCurrency})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={convertAmount}
                    onChange={(e) => setConvertAmount(e.target.value)}
                    placeholder={`0.00`}
                    className="w-full px-4 py-4 border-2 border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold text-lg outline-none transition-all"
                    step="0.00000001"
                    min="0"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <span className="text-sm font-bold text-gray-400">{convertCurrency}</span>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ArrowLeftRight className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-green-800 dark:text-green-300 mb-1">Instant Conversion</p>
                    <p className="text-xs text-green-700 dark:text-green-400 leading-relaxed">
                      Your {convertCurrency} will be converted to Nigerian Naira at the current market rate and added to your wallet balance.
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Balance Info (if available) */}
              {balance && balance.crypto_value && parseFloat(balance.crypto_value) > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Available Crypto Balance</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">≈ ${balance.crypto_value}</p>
                </div>
              )}

              <button
                onClick={handleConvert}
                disabled={processingConvert || !convertAmount || parseFloat(convertAmount) <= 0}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:shadow-none"
              >
                {processingConvert ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Converting...
                  </>
                ) : (
                  <>
                    <ArrowLeftRight className="w-5 h-5" />
                    Convert to Naira
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal (Card/Transfer/USSD) - Premium Design */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md border border-gray-200 dark:border-gray-800 animate-scale-in">
            {/* Modal Header */}
            <div className="relative p-6 pb-4 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-950/30 dark:to-blue-950/30 rounded-t-3xl border-b border-gray-200 dark:border-gray-800">
              <button
                onClick={() => {
                  setShowDepositModal(false)
                  setDepositAmount('')
                }}
                className="absolute top-4 right-4 p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-xl transition-all"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                  {depositMethod === 'card' && <CreditCard className="w-6 h-6 text-white" />}
                  {depositMethod === 'transfer' && <Building2 className="w-6 h-6 text-white" />}
                  {depositMethod === 'ussd' && <Smartphone className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {depositMethod === 'card' && 'Card Payment'}
                    {depositMethod === 'transfer' && 'Bank Transfer'}
                    {depositMethod === 'ussd' && 'USSD Payment'}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Fund your wallet securely</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Amount
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <span className="text-lg font-bold text-gray-400">₦</span>
                  </div>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-4 border-2 border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-lg outline-none transition-all"
                    min="100"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 pl-1">Minimum amount: ₦100</p>
              </div>

              <div className="bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-950/20 dark:to-blue-950/20 rounded-xl p-4 border border-primary-200 dark:border-primary-800">
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">
                    {depositMethod === 'card' && '💳'}
                    {depositMethod === 'transfer' && '🏦'}
                    {depositMethod === 'ussd' && '📱'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary-800 dark:text-primary-300 mb-1">
                      {depositMethod === 'card' && 'Secure Payment'}
                      {depositMethod === 'transfer' && 'Direct Transfer'}
                      {depositMethod === 'ussd' && 'Mobile Payment'}
                    </p>
                    <p className="text-xs text-primary-700 dark:text-primary-400 leading-relaxed">
                      {depositMethod === 'card' && 'You will be redirected to Paystack to complete your payment securely.'}
                      {depositMethod === 'transfer' && 'Transfer details will be provided after you confirm the amount.'}
                      {depositMethod === 'ussd' && 'Dial the USSD code on your phone to complete the payment.'}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleDeposit}
                disabled={processingDeposit || !depositAmount || parseFloat(depositAmount) < 100}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:shadow-none"
              >
                {processingDeposit ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Continue
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
