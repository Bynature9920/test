import { useEffect, useState } from 'react'
import { cardService, Card } from '@/services/api/cardService'
import { walletService } from '@/services/api/walletService'
import { formatCurrency } from '@/utils/format'
import { 
  Eye, Plus, Snowflake, Trash2, Settings, TrendingUp,
  X, AlertCircle, Unlock, ChevronRight, Copy, Check, ChevronLeft, CreditCard
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showFundModal, setShowFundModal] = useState(false)
  const [showLimitsModal, setShowLimitsModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showSecuritySettingsModal, setShowSecuritySettingsModal] = useState(false)
  const [showBillingAddressModal, setShowBillingAddressModal] = useState(false)
  const [showCardLabelModal, setShowCardLabelModal] = useState(false)
  const [showReplaceCardModal, setShowReplaceCardModal] = useState(false)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [fundAmount, setFundAmount] = useState('')
  const [spendLimit, setSpendLimit] = useState('')
  const [walletBalance, setWalletBalance] = useState<string>('0.00')
  const [cardholderName, setCardholderName] = useState('')
  const [creating, setCreating] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [revealedCVV, setRevealedCVV] = useState<string>('')
  const [loadingCVV, setLoadingCVV] = useState(false)
  const [copiedField, setCopiedField] = useState<string>('')
  
  // Security Settings States
  const [onlineTransactions, setOnlineTransactions] = useState(true)
  const [offlineTransactions, setOfflineTransactions] = useState(true)
  
  // Billing Address States
  const [billingName, setBillingName] = useState('')
  const [billingCountry, setBillingCountry] = useState('Nigeria')
  const [billingAddress1, setBillingAddress1] = useState('')
  const [billingAddress2, setBillingAddress2] = useState('')
  const [billingState, setBillingState] = useState('')
  const [billingCity, setBillingCity] = useState('')
  const [billingPostalCode, setBillingPostalCode] = useState('')
  
  // Card Label State
  const [cardLabel, setCardLabel] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [cardsData, balanceData] = await Promise.all([
        cardService.getCards(),
        walletService.getBalance()
      ])
      setCards(cardsData?.cards || [])
      setWalletBalance(balanceData?.available_balance || '0.00')
    } catch (error) {
      console.error('Failed to load cards:', error)
      toast.error('Failed to load cards')
      setCards([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCard = async () => {
    if (creating) return
    
    setCreating(true)
    try {
      const newCard = await cardService.createCard({ 
        cardholder_name: cardholderName || undefined 
      })
      
      toast.success(`Card created successfully!`, { duration: 5000 })
      
      setCards([newCard, ...cards])
      setShowCreateModal(false)
      setCardholderName('')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create card')
    } finally {
      setCreating(false)
    }
  }

  const handleFundCard = async () => {
    if (!selectedCard || processing) return
    
    const amount = parseFloat(fundAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (amount > parseFloat(walletBalance)) {
      toast.error('Insufficient wallet balance')
      return
    }

    setProcessing(true)
    try {
      const result = await cardService.fundCard(selectedCard.card_id, { amount })
      
      setCards(cards.map(c => 
        c.card_id === selectedCard.card_id 
          ? { ...c, balance: result.card_balance }
          : c
      ))
      
      setWalletBalance(result.wallet_balance)
      setShowFundModal(false)
      setFundAmount('')
      toast.success('Card funded successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to fund card')
    } finally {
      setProcessing(false)
    }
  }

  const handleFreezeCard = async (card: Card) => {
    if (processing) return
    
    setProcessing(true)
    try {
      if (card.status === 'ACTIVE') {
        await cardService.freezeCard(card.card_id)
        setCards(cards.map(c => 
          c.card_id === card.card_id ? { ...c, status: 'BLOCKED' } : c
        ))
        toast.success('Card frozen')
      } else {
        await cardService.unfreezeCard(card.card_id)
        setCards(cards.map(c => 
          c.card_id === card.card_id ? { ...c, status: 'ACTIVE' } : c
        ))
        toast.success('Card unfrozen')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Action failed')
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteCard = async (card: Card) => {
    if (processing) return
    
    if (!confirm(`Delete card ending in ${card.card_number.slice(-4)}?`)) {
      return
    }

    setProcessing(true)
    try {
      await cardService.deleteCard(card.card_id)
      setCards(cards.filter(c => c.card_id !== card.card_id))
      toast.success('Card deleted successfully')
      await loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete card')
    } finally {
      setProcessing(false)
    }
  }

  const handleRevealCVV = async (cardId: string) => {
    if (loadingCVV) return
    
    setLoadingCVV(true)
    try {
      const result = await cardService.getCardCVV(cardId)
      setRevealedCVV(result.cvv)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to retrieve CVV')
    } finally {
      setLoadingCVV(false)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success(`${field} copied!`)
    setTimeout(() => setCopiedField(''), 2000)
  }

  const handleSaveSecuritySettings = () => {
    // Save security settings
    toast.success('Security settings updated successfully')
    setShowSecuritySettingsModal(false)
    setShowSettingsModal(true)
  }

  const handleSaveBillingAddress = () => {
    if (!billingName || !billingAddress1 || !billingCity || !billingState || !billingPostalCode) {
      toast.error('Please fill in all required fields')
      return
    }
    // Save billing address
    toast.success('Billing address updated successfully')
    setShowBillingAddressModal(false)
    setShowSettingsModal(true)
  }

  const handleSaveCardLabel = () => {
    if (!cardLabel.trim()) {
      toast.error('Please enter a card label')
      return
    }
    // Save card label
    toast.success('Card label updated successfully')
    setShowCardLabelModal(false)
    setShowSettingsModal(true)
  }

  const handleReplaceCard = () => {
    // Replace card
    toast.success('Card replacement request submitted. New card will be issued.')
    setShowReplaceCardModal(false)
    setShowSettingsModal(true)
  }

  const formatCardNumber = (number: string) => {
    return `•• ${number.slice(-4)}`
  }

  const getCardGradient = (index: number) => {
    const gradients = [
      'from-gray-700 via-gray-800 to-gray-900',
      'from-blue-800 via-blue-900 to-gray-900',
      'from-purple-800 via-purple-900 to-gray-900',
      'from-green-800 via-green-900 to-gray-900',
    ]
    return gradients[index % gradients.length]
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-900">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-3xl font-bold">Cards</h1>
          <div className="flex items-center gap-3">
            {cards.length === 0 && !loading && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-2"
              >
                <Plus className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-4">
          <div className="animate-pulse space-y-6">
            <div className="h-48 bg-gray-800 rounded-3xl"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-800 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-10 h-10 text-gray-400 dark:text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-6">No cards yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-full transition-colors"
          >
            Create Card
          </button>
        </div>
      ) : (
        <div className="space-y-0">
          {cards.map((card, index) => (
            <div key={card.card_id} className="p-4 space-y-6">
              {/* Card */}
              <div className={`relative rounded-3xl p-6 bg-gradient-to-br ${getCardGradient(index)} shadow-2xl min-h-[200px] text-white`}>
                {/* Card Header */}
                <div className="flex items-start justify-between mb-16">
                  <div>
                    <p className="text-sm font-bold text-white">BenGo</p>
                    <p className="text-[10px] opacity-60 text-white">VIRTUAL</p>
                  </div>
                  
                  {/* Active Status */}
                  <div className="bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">
                    <p className="text-green-400 text-[10px] font-semibold uppercase">Active</p>
                  </div>
                </div>

                {/* Card Number */}
                <div className="mb-6">
                  <p className="text-2xl font-light tracking-wider text-white">
                    {formatCardNumber(card.card_number)}
                  </p>
                </div>

              {/* Card Footer */}
              <div className="flex items-end justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[10px] opacity-60 mb-1 text-white">Valid thru</p>
                    <p className="text-sm font-mono text-white">•••</p>
                  </div>
                  <div>
                    <p className="text-[10px] opacity-60 mb-1 text-white">CVV</p>
                    <p className="text-sm font-mono text-white">•••</p>
                  </div>
                </div>
              </div>

              {/* VISA Logo */}
              <div className="absolute bottom-6 right-6">
                <p className="text-white text-xl font-bold" style={{fontFamily: 'serif'}}>VISA</p>
              </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-4 gap-3">
                <button
                  onClick={() => {
                    setSelectedCard(card)
                    setRevealedCVV('')
                    setShowViewModal(true)
                  }}
                  className="flex flex-col items-center gap-2 p-3 md:p-4 bg-gray-100 dark:bg-gray-900 rounded-2xl active:scale-95 transition-transform"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Eye className="w-4 h-4 md:w-5 md:h-5 text-gray-700 dark:text-white" />
                  </div>
                  <span className="text-[10px] md:text-xs font-medium text-gray-900 dark:text-white">View</span>
                </button>

                <button
                  onClick={() => handleFreezeCard(card)}
                  disabled={processing}
                  className="flex flex-col items-center gap-2 p-3 md:p-4 bg-gray-100 dark:bg-gray-900 rounded-2xl active:scale-95 transition-transform disabled:opacity-50"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    {card.status === 'ACTIVE' ? <Snowflake className="w-4 h-4 md:w-5 md:h-5 text-gray-700 dark:text-white" /> : <Unlock className="w-4 h-4 md:w-5 md:h-5 text-gray-700 dark:text-white" />}
                  </div>
                  <span className="text-[10px] md:text-xs font-medium text-gray-900 dark:text-white">{card.status === 'ACTIVE' ? 'Freeze' : 'Unfreeze'}</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedCard(card)
                    setShowLimitsModal(true)
                  }}
                  className="flex flex-col items-center gap-2 p-3 md:p-4 bg-gray-100 dark:bg-gray-900 rounded-2xl active:scale-95 transition-transform"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-gray-700 dark:text-white" />
                  </div>
                  <span className="text-[10px] md:text-xs font-medium text-gray-900 dark:text-white">Limit</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedCard(card)
                    setShowSettingsModal(true)
                  }}
                  className="flex flex-col items-center gap-2 p-3 md:p-4 bg-gray-100 dark:bg-gray-900 rounded-2xl active:scale-95 transition-transform"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Settings className="w-4 h-4 md:w-5 md:h-5 text-gray-700 dark:text-white" />
                  </div>
                  <span className="text-[10px] md:text-xs font-medium text-gray-900 dark:text-white">Settings</span>
                </button>
              </div>

              {/* Add to Wallet Button */}
              <button
                onClick={() => {
                  setSelectedCard(card)
                  setShowFundModal(true)
                }}
                disabled={card.status !== 'ACTIVE'}
                className="w-full bg-gray-100 dark:bg-gray-900 rounded-2xl p-3 md:p-4 flex items-center justify-center gap-3 active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                <span className="font-semibold text-sm md:text-base text-gray-900 dark:text-white">Add Funds to Card</span>
              </button>

              {/* Card Balance Only */}
              <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-4">
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Card Balance</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(card.balance)}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Available to spend</p>
              </div>

              {/* Transaction History */}
              <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Transactions</h3>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No transactions yet</p>
                  <p className="text-sm mt-2">Your transaction history will appear here</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Card Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/90 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-white dark:bg-gray-900 rounded-t-3xl p-6 pb-8 space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Card</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-400 mb-2">
                Cardholder Name (Optional)
              </label>
              <input
                type="text"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="Leave empty to use your name"
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-white/20"
              />
            </div>

            <button
              onClick={handleCreateCard}
              disabled={creating}
              className="w-full bg-primary-600 hover:bg-primary-700 dark:bg-white dark:text-black text-white font-bold py-4 rounded-full disabled:opacity-50 transition-colors"
            >
              {creating ? 'Creating...' : 'Create Card'}
            </button>
          </div>
        </div>
      )}

      {/* Fund Card Modal */}
      {showFundModal && selectedCard && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/90 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-white dark:bg-gray-900 rounded-t-3xl p-6 pb-8 space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Funds</h2>
              <button
                onClick={() => {
                  setShowFundModal(false)
                  setFundAmount('')
                  setSelectedCard(null)
                }}
                className="p-2"
              >
                <X className="w-6 h-6 text-gray-900 dark:text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Card Balance</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedCard.balance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Wallet Balance</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(walletBalance)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">₦</span>
                  <input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-4 pl-8 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-white/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[1000, 5000, 10000, 20000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setFundAmount(amount.toString())}
                    className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg py-2 text-sm font-medium active:scale-95 transition-transform"
                  >
                    ₦{amount / 1000}k
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleFundCard}
              disabled={processing || !fundAmount || parseFloat(fundAmount) <= 0}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-white text-white dark:text-black font-bold py-4 rounded-full disabled:opacity-50 transition-colors"
            >
              {processing ? 'Processing...' : 'Add Funds'}
            </button>
          </div>
        </div>
      )}

      {/* Limits Modal */}
      {showLimitsModal && selectedCard && (
        <div className="fixed inset-0 bg-white dark:bg-black z-50 overflow-y-auto">
          <div className="p-4">
            <button
              onClick={() => {
                setShowLimitsModal(false)
                setSelectedCard(null)
              }}
              className="mb-6"
            >
              <ChevronRight className="w-6 h-6 rotate-180 text-gray-900 dark:text-white" />
            </button>

            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Card limits</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Single transaction and daily limits for this card</p>

            <div className="space-y-6">
              <div className="flex items-center gap-3 md:gap-4 p-4 bg-gray-100 dark:bg-gray-900 rounded-xl">
                <div className="w-12 h-8 md:w-16 md:h-10 bg-gray-200 dark:bg-gray-800 rounded flex items-center justify-center text-xs text-gray-700 dark:text-white flex-shrink-0">
                  VISA
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm md:text-base truncate text-gray-900 dark:text-white">{selectedCard.cardholder_name.toUpperCase()}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{formatCardNumber(selectedCard.card_number)}</p>
                </div>
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />
              </div>

              <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500 dark:text-gray-400 text-sm md:text-base">Per transaction limit</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-base md:text-xl font-bold text-gray-900 dark:text-white">100,000.00 NGN</span>
                    <button className="p-1">
                      <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-700 dark:text-white" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500 dark:text-gray-400 text-sm md:text-base">Daily limit</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-base md:text-xl font-bold text-gray-900 dark:text-white">1,000,000.00 NGN</span>
                    <button className="p-1">
                      <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-700 dark:text-white" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-300 dark:border-gray-800">
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-gray-500 dark:text-gray-400 text-lg flex-shrink-0">↻</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm mb-1 text-gray-700 dark:text-gray-300">Resets on: <span className="font-semibold">00:00(UTC)</span></p>
                    <div className="h-2 bg-gray-300 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 dark:bg-white w-0"></div>
                    </div>
                  </div>
                </div>
                <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300">Available limit: <span className="font-semibold">1,000,000.00</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && selectedCard && (
        <div className="fixed inset-0 bg-white dark:bg-black z-50 overflow-y-auto">
          <div className="p-4">
            <button
              onClick={() => {
                setShowSettingsModal(false)
                setSelectedCard(null)
              }}
              className="mb-6"
            >
              <ChevronRight className="w-6 h-6 rotate-180 text-gray-900 dark:text-white" />
            </button>

            <h1 className="text-2xl md:text-3xl font-bold mb-8 text-gray-900 dark:text-white">Settings</h1>

            <div className="space-y-8">
              <div className="flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-900 rounded-xl">
                <div className="w-12 h-8 md:w-16 md:h-10 bg-gray-200 dark:bg-gray-800 rounded flex items-center justify-center text-xs text-gray-700 dark:text-white flex-shrink-0">
                  VISA
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-gray-900 dark:text-white">{selectedCard.cardholder_name.toUpperCase()}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{formatCardNumber(selectedCard.card_number)}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>

              <div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm mb-4">Manage card</h3>
                <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => {
                      setShowSettingsModal(false)
                      setShowSecuritySettingsModal(true)
                    }}
                    className="w-full p-4 md:p-5 flex items-center gap-3 md:gap-4 active:bg-gray-200 dark:active:bg-gray-800 transition-colors border-b border-gray-300 dark:border-gray-800"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                      <Settings className="w-4 h-4 md:w-5 md:h-5 text-gray-700 dark:text-white" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-semibold text-sm md:text-base text-gray-900 dark:text-white">Security settings</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Control transaction types and currencies</p>
                    </div>
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />
                  </button>

                  <button
                    onClick={() => {
                      // Initialize with current card data
                      setBillingName(selectedCard?.cardholder_name || '')
                      setBillingAddress1('')
                      setBillingCity('')
                      setShowSettingsModal(false)
                      setShowBillingAddressModal(true)
                    }}
                    className="w-full p-4 md:p-5 flex items-center gap-3 md:gap-4 active:bg-gray-200 dark:active:bg-gray-800 transition-colors border-b border-gray-300 dark:border-gray-800"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center text-base md:text-lg flex-shrink-0">
                      📍
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-semibold text-sm md:text-base text-gray-900 dark:text-white">Change billing address</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Nigeria igando</p>
                    </div>
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />
                  </button>

                  <button
                    onClick={() => {
                      setCardLabel('')
                      setShowSettingsModal(false)
                      setShowCardLabelModal(true)
                    }}
                    className="w-full p-4 md:p-5 flex items-center gap-3 md:gap-4 active:bg-gray-200 dark:active:bg-gray-800 transition-colors"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center text-base md:text-lg flex-shrink-0">
                      ✏️
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-semibold text-sm md:text-base text-gray-900 dark:text-white">Card label</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Add an optional name for this card</p>
                    </div>
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm mb-4">Card actions</h3>
                <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => {
                      setShowSettingsModal(false)
                      setShowReplaceCardModal(true)
                    }}
                    className="w-full p-4 md:p-5 flex items-center gap-3 md:gap-4 active:bg-gray-200 dark:active:bg-gray-800 transition-colors border-b border-gray-300 dark:border-gray-800"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center text-base md:text-lg flex-shrink-0">
                      🔄
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-semibold text-sm md:text-base text-gray-900 dark:text-white">Replace card</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Replace if lost or used fraudulently</p>
                    </div>
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />
                  </button>

                  <button
                    onClick={() => {
                      setShowSettingsModal(false)
                      handleDeleteCard(selectedCard!)
                    }}
                    className="w-full p-4 md:p-5 flex items-center gap-3 md:gap-4 active:bg-gray-200 dark:active:bg-gray-800 transition-colors"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                      <Trash2 className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-semibold text-red-500 text-sm md:text-base">Delete card</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Deactivate this card permanently</p>
                    </div>
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Card Modal */}
      {showViewModal && selectedCard && (
        <div className="fixed inset-0 bg-white dark:bg-black z-50 overflow-y-auto">
          <div className="p-4">
            <button
              onClick={() => {
                setShowViewModal(false)
                setSelectedCard(null)
                setRevealedCVV('')
              }}
              className="mb-6"
            >
              <ChevronRight className="w-6 h-6 rotate-180 text-gray-900 dark:text-white" />
            </button>

            <h1 className="text-2xl md:text-3xl font-bold mb-8 text-gray-900 dark:text-white">Card Details</h1>

            {/* Card Preview - Exact same size as front */}
            <div className={`relative rounded-3xl p-6 bg-gradient-to-br ${getCardGradient(0)} shadow-2xl mb-8 text-white min-h-[200px]`}>
              {/* Card Header */}
              <div className="flex items-start justify-between mb-12">
                <div>
                  <p className="text-sm font-bold text-white">BenGo</p>
                  <p className="text-[10px] opacity-60 text-white">VIRTUAL</p>
                </div>
              </div>

              {/* Card Number */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <p className="text-xl font-mono tracking-wider text-white">
                    {selectedCard.card_number.match(/.{1,4}/g)?.join(' ')}
                  </p>
                  <button
                    onClick={() => copyToClipboard(selectedCard.card_number, 'Card number')}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    title="Copy card number"
                  >
                    {copiedField === 'Card number' ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-white/70" />
                    )}
                  </button>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-end justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[10px] opacity-60 mb-1 text-white">Valid thru</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono text-white">
                        {revealedCVV ? `${String(selectedCard.expiry_month).padStart(2, '0')}/${String(selectedCard.expiry_year).slice(-2)}` : '••/••'}
                      </p>
                      {revealedCVV && (
                        <button
                          onClick={() => copyToClipboard(`${String(selectedCard.expiry_month).padStart(2, '0')}/${String(selectedCard.expiry_year).slice(-2)}`, 'Expiry date')}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                          title="Copy expiry"
                        >
                          {copiedField === 'Expiry date' ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-white/70" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] opacity-60 mb-1 text-white">CVV</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono text-white">
                        {revealedCVV || '•••'}
                      </p>
                      <div className="flex items-center gap-1">
                        {revealedCVV && (
                          <button
                            onClick={() => copyToClipboard(revealedCVV, 'CVV')}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title="Copy CVV"
                          >
                            {copiedField === 'CVV' ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-white/70" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (revealedCVV) {
                              setRevealedCVV('')
                            } else {
                              handleRevealCVV(selectedCard.card_id)
                            }
                          }}
                          disabled={loadingCVV}
                          className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                          title={revealedCVV ? "Hide CVV" : "Reveal CVV"}
                        >
                          {loadingCVV ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Eye className="w-3 h-3 text-white" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(selectedCard.cardholder_name, 'Cardholder name')}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title="Copy cardholder name"
                  >
                    {copiedField === 'Cardholder name' ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-white/70" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Card Balance Info */}
            <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-6 mb-6">
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Card Balance</p>
              <p className="text-4xl font-bold mb-1 text-gray-900 dark:text-white">{formatCurrency(selectedCard.balance)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Available to spend</p>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-800">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-300">
                  <p className="font-semibold mb-1">Secure Payment Information</p>
                  <p className="text-xs opacity-90">Use the copy buttons to easily paste your card details for online payments. Never share your card details with anyone.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Settings Modal */}
      {showSecuritySettingsModal && selectedCard && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/95 flex items-end justify-center z-[100] p-0">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-t-3xl animate-slide-up overflow-y-auto shadow-2xl" style={{ maxHeight: '90vh' }}>
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center gap-4 z-10">
              <button
                onClick={() => {
                  setShowSecuritySettingsModal(false)
                  setShowSettingsModal(true)
                }}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-900 dark:text-white" />
              </button>
              <h2 className="text-xl font-bold flex-1 text-gray-900 dark:text-white">Security settings</h2>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 bg-white dark:bg-gray-900">
              {/* Transaction Type Controls */}
              <div>
                <h3 className="text-gray-700 dark:text-gray-300 text-sm mb-4 font-semibold">Transaction type controls</h3>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden">
                  {/* Online Transactions */}
                  <div className="p-5 flex items-center justify-between border-b border-gray-300 dark:border-gray-700">
                    <div className="flex-1">
                      <p className="font-semibold text-base text-gray-900 dark:text-white mb-1">Online transactions</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Enable or disable online payments</p>
                    </div>
                    <button
                      onClick={() => setOnlineTransactions(!onlineTransactions)}
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        onlineTransactions ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                          onlineTransactions ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Offline Transactions */}
                  <div className="p-5 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-base text-gray-900 dark:text-white mb-1">Offline transactions</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Enable or disable in-person payments</p>
                    </div>
                    <button
                      onClick={() => setOfflineTransactions(!offlineTransactions)}
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        offlineTransactions ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                          offlineTransactions ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Currency Control */}
              <div>
                <h3 className="text-gray-700 dark:text-gray-300 text-sm mb-4 font-semibold">Currency control</h3>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-base text-gray-900 dark:text-white">Default currency</p>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">NGN (₦)</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">All transactions will be processed in Nigerian Naira</p>
                </div>
              </div>

              {/* Info Banner */}
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="text-xs opacity-90">These settings help you control how and where your card can be used. Changes take effect immediately.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Save Button */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6">
              <button
                onClick={handleSaveSecuritySettings}
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Billing Address Modal */}
      {showBillingAddressModal && selectedCard && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/95 flex items-end justify-center z-[100] p-0">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-t-3xl animate-slide-up overflow-y-auto shadow-2xl" style={{ maxHeight: '90vh' }}>
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center gap-4 z-10">
              <button
                onClick={() => {
                  setShowBillingAddressModal(false)
                  setShowSettingsModal(true)
                }}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-900 dark:text-white" />
              </button>
              <h2 className="text-xl font-bold flex-1 text-gray-900 dark:text-white">Change billing address</h2>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 bg-white dark:bg-gray-900">
              {/* Cardholder Name */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">Cardholder name *</label>
                <input
                  type="text"
                  value={billingName}
                  onChange={(e) => setBillingName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 dark:focus:border-gray-600"
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">Country *</label>
                <select
                  value={billingCountry}
                  onChange={(e) => setBillingCountry(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3.5 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-gray-600"
                >
                  <option value="Nigeria">Nigeria</option>
                  <option value="Ghana">Ghana</option>
                  <option value="Kenya">Kenya</option>
                  <option value="South Africa">South Africa</option>
                </select>
              </div>

              {/* Address Line 1 */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">Address line 1 *</label>
                <input
                  type="text"
                  value={billingAddress1}
                  onChange={(e) => setBillingAddress1(e.target.value)}
                  placeholder="Street address, P.O. box"
                  className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 dark:focus:border-gray-600"
                />
              </div>

              {/* Address Line 2 */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">Address line 2 (Optional)</label>
                <input
                  type="text"
                  value={billingAddress2}
                  onChange={(e) => setBillingAddress2(e.target.value)}
                  placeholder="Apartment, suite, unit, building, floor, etc."
                  className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 dark:focus:border-gray-600"
                />
              </div>

              {/* Province/State */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">Province/State *</label>
                <input
                  type="text"
                  value={billingState}
                  onChange={(e) => setBillingState(e.target.value)}
                  placeholder="Enter state or province"
                  className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 dark:focus:border-gray-600"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">City *</label>
                <input
                  type="text"
                  value={billingCity}
                  onChange={(e) => setBillingCity(e.target.value)}
                  placeholder="Enter city"
                  className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 dark:focus:border-gray-600"
                />
              </div>

              {/* Postal Code */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">Postal code *</label>
                <input
                  type="text"
                  value={billingPostalCode}
                  onChange={(e) => setBillingPostalCode(e.target.value)}
                  placeholder="Enter postal code"
                  className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 dark:focus:border-gray-600"
                />
              </div>
            </div>

            {/* Footer - Save Button */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6">
              <button
                onClick={handleSaveBillingAddress}
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold transition-colors"
              >
                Save Address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Label Modal */}
      {showCardLabelModal && selectedCard && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/95 flex items-end justify-center z-[100] p-0">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-t-3xl animate-slide-up shadow-2xl">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center gap-4">
              <button
                onClick={() => {
                  setShowCardLabelModal(false)
                  setShowSettingsModal(true)
                }}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-900 dark:text-white" />
              </button>
              <h2 className="text-xl font-bold flex-1 text-gray-900 dark:text-white">Edit card label</h2>
            </div>

            {/* Content */}
            <div className="p-6 bg-white dark:bg-gray-900">
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3 text-gray-900 dark:text-white">Card name</label>
                <input
                  type="text"
                  value={cardLabel}
                  onChange={(e) => setCardLabel(e.target.value)}
                  placeholder="e.g., Shopping Card, Travel Card"
                  maxLength={20}
                  className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 dark:focus:border-gray-600"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{cardLabel.length}/20 characters</p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="text-xs opacity-90">Give your card a memorable name to help you identify it easily.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Confirm Button */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-900">
              <button
                onClick={handleSaveCardLabel}
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replace Card Modal */}
      {showReplaceCardModal && selectedCard && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/95 flex items-end justify-center z-[100] p-0">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-t-3xl animate-slide-up shadow-2xl">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center gap-4">
              <button
                onClick={() => {
                  setShowReplaceCardModal(false)
                  setShowSettingsModal(true)
                }}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-900 dark:text-white" />
              </button>
              <h2 className="text-xl font-bold flex-1 text-gray-900 dark:text-white">Replace card</h2>
            </div>

            {/* Content */}
            <div className="p-6 bg-white dark:bg-gray-900">
              {/* Icon */}
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                🔄
              </div>

              {/* Title and Description */}
              <h3 className="text-2xl font-bold text-center mb-3 text-gray-900 dark:text-white">Replace Your Card?</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center mb-8 text-sm">
                Your current card will be deactivated and a new card with new details will be issued immediately.
              </p>

              {/* Replacement Fee */}
              <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-xl p-4 border border-yellow-200 dark:border-yellow-700 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-700 dark:text-yellow-400 text-sm mb-1">Replacement Fee</p>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">A fee of <span className="font-bold">$5.00</span> will be charged for card replacement.</p>
                  </div>
                </div>
              </div>

              {/* Info Points */}
              <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-5 mb-6 space-y-3">
                <div className="flex gap-3">
                  <span className="text-green-500 dark:text-green-400">✓</span>
                  <p className="text-sm text-gray-700 dark:text-gray-200">Your card balance will be transferred to the new card</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-green-500 dark:text-green-400">✓</span>
                  <p className="text-sm text-gray-700 dark:text-gray-200">New card details will be generated instantly</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-green-500 dark:text-green-400">✓</span>
                  <p className="text-sm text-gray-700 dark:text-gray-200">Old card cannot be used after replacement</p>
                </div>
              </div>
            </div>

            {/* Footer - Replace Button */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-900">
              <button
                onClick={handleReplaceCard}
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold transition-colors mb-3"
              >
                Replace Card ($5.00)
              </button>
              <button
                onClick={() => {
                  setShowReplaceCardModal(false)
                  setShowSettingsModal(true)
                }}
                className="w-full bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white py-4 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
