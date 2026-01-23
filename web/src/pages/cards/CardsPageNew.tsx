import { useEffect, useState } from 'react'
import { cardService, Card } from '@/services/api/cardService'
import { walletService } from '@/services/api/walletService'
import { formatCurrency } from '@/utils/format'
import { 
  Eye, Plus, Snowflake, Trash2, Settings, DollarSign, TrendingUp,
  X, AlertCircle, Unlock, ChevronRight, Menu
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showFundModal, setShowFundModal] = useState(false)
  const [showLimitsModal, setShowLimitsModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [fundAmount, setFundAmount] = useState('')
  const [spendLimit, setSpendLimit] = useState('')
  const [walletBalance, setWalletBalance] = useState<string>('0.00')
  const [cardholderName, setCardholderName] = useState('')
  const [creating, setCreating] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [cardsData, balanceData] = await Promise.all([
        cardService.getCards(),
        walletService.getBalance()
      ])
      setCards(cardsData.cards)
      setWalletBalance(balanceData.available_balance)
    } catch (error) {
      console.error('Failed to load cards:', error)
      toast.error('Failed to load cards')
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
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-gray-900">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-3xl font-bold">Cards</h1>
          <div className="flex items-center gap-3">
            <button className="p-2">
              <Menu className="w-6 h-6" />
            </button>
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
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-400 mb-6">No cards yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-white text-black font-semibold px-8 py-3 rounded-full"
          >
            Create Card
          </button>
        </div>
      ) : (
        <div className="space-y-0">
          {cards.map((card, index) => (
            <div key={card.card_id} className="p-4 space-y-6">
              {/* Card */}
              <div className={`relative rounded-3xl p-6 bg-gradient-to-br ${getCardGradient(index)} shadow-2xl`}>
                {/* Card Header */}
                <div className="flex items-start justify-between mb-12">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center">
                      <span className="text-xl font-bold">B</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold">BenGo</p>
                      <p className="text-[10px] opacity-60">VIRTUAL</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold uppercase">{card.cardholder_name.split(' ')[0]}</p>
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full"></div>
                  </div>
                </div>

                {/* Card Number */}
                <div className="mb-4">
                  <p className="text-2xl font-light tracking-wider">
                    {formatCardNumber(card.card_number)}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-[10px] opacity-60 mb-1">Valid thru</p>
                      <p className="text-sm font-mono">•••</p>
                    </div>
                    <div>
                      <p className="text-[10px] opacity-60 mb-1">CVV</p>
                      <p className="text-sm font-mono">•••</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold uppercase">{card.cardholder_name}</p>
                  </div>
                </div>

                {/* VISA Logo */}
                <div className="absolute bottom-6 right-6">
                  <svg width="50" height="16" viewBox="0 0 50 16" fill="white" opacity="0.9">
                    <text x="0" y="14" fontFamily="Arial" fontWeight="bold" fontSize="18">VISA</text>
                  </svg>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-4 gap-3">
                <button
                  onClick={() => {
                    setSelectedCard(card)
                    // Navigate to view details (for now just show info)
                    toast('View card details')
                  }}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-900 rounded-2xl active:scale-95 transition-transform"
                >
                  <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
                    <Eye className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium">View</span>
                </button>

                <button
                  onClick={() => handleFreezeCard(card)}
                  disabled={processing}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-900 rounded-2xl active:scale-95 transition-transform disabled:opacity-50"
                >
                  <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
                    {card.status === 'ACTIVE' ? <Snowflake className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                  </div>
                  <span className="text-xs font-medium">{card.status === 'ACTIVE' ? 'Freeze' : 'Unfreeze'}</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedCard(card)
                    setShowLimitsModal(true)
                  }}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-900 rounded-2xl active:scale-95 transition-transform"
                >
                  <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium">Limit</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedCard(card)
                    setShowSettingsModal(true)
                  }}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-900 rounded-2xl active:scale-95 transition-transform"
                >
                  <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
                    <Settings className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium">Settings</span>
                </button>
              </div>

              {/* Add to Wallet Button */}
              <button
                onClick={() => {
                  setSelectedCard(card)
                  setShowFundModal(true)
                }}
                disabled={card.status !== 'ACTIVE'}
                className="w-full bg-gray-900 rounded-2xl p-4 flex items-center justify-center gap-3 active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                <DollarSign className="w-5 h-5" />
                <span className="font-semibold">Add Funds to Card</span>
              </button>

              {/* Transactions Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Transactions</h3>
                  <div className="flex items-center gap-2">
                    <button className="p-2">
                      <TrendingUp className="w-5 h-5" />
                    </button>
                    <button className="p-2">
                      <Menu className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Sample Transaction */}
                <div className="bg-gray-900 rounded-2xl p-4">
                  <p className="text-gray-500 text-sm mb-3">Card Balance</p>
                  <p className="text-3xl font-bold mb-1">{formatCurrency(card.balance)}</p>
                  <p className="text-xs text-gray-500">Available to spend</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Card Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-gray-900 rounded-t-3xl p-6 pb-8 space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Create Card</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Cardholder Name (Optional)
              </label>
              <input
                type="text"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="Leave empty to use your name"
                className="w-full bg-gray-800 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>

            <button
              onClick={handleCreateCard}
              disabled={creating}
              className="w-full bg-white text-black font-bold py-4 rounded-full disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Card'}
            </button>
          </div>
        </div>
      )}

      {/* Fund Card Modal */}
      {showFundModal && selectedCard && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-gray-900 rounded-t-3xl p-6 pb-8 space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Add Funds</h2>
              <button
                onClick={() => {
                  setShowFundModal(false)
                  setFundAmount('')
                  setSelectedCard(null)
                }}
                className="p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Card Balance</span>
                  <span className="font-semibold">{formatCurrency(selectedCard.balance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Wallet Balance</span>
                  <span className="font-semibold">{formatCurrency(walletBalance)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₦</span>
                  <input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-800 rounded-xl p-4 pl-8 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[1000, 5000, 10000, 20000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setFundAmount(amount.toString())}
                    className="bg-gray-800 rounded-lg py-2 text-sm font-medium active:scale-95 transition-transform"
                  >
                    ₦{amount / 1000}k
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleFundCard}
              disabled={processing || !fundAmount || parseFloat(fundAmount) <= 0}
              className="w-full bg-white text-black font-bold py-4 rounded-full disabled:opacity-50"
            >
              {processing ? 'Processing...' : 'Add Funds'}
            </button>
          </div>
        </div>
      )}

      {/* Limits Modal */}
      {showLimitsModal && selectedCard && (
        <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
          <div className="p-4">
            <button
              onClick={() => {
                setShowLimitsModal(false)
                setSelectedCard(null)
              }}
              className="mb-6"
            >
              <ChevronRight className="w-6 h-6 rotate-180" />
            </button>

            <h1 className="text-3xl font-bold mb-2">Card limits</h1>
            <p className="text-gray-400 mb-8">Single transaction and daily limits for this card</p>

            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-gray-900 rounded-xl">
                <div className="w-16 h-10 bg-gray-800 rounded flex items-center justify-center text-xs">
                  VISA
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{card.cardholder_name.toUpperCase()}</p>
                  <p className="text-sm text-gray-400">{formatCardNumber(selectedCard.card_number)}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>

              <div className="bg-gray-900 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Per transaction limit</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">100,000.00 NGN</span>
                    <button className="p-1">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Daily limit</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">1,000,000.00 NGN</span>
                    <button className="p-1">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-gray-400">↻</div>
                  <div className="flex-1">
                    <p className="text-sm mb-1">Resets on: <span className="font-semibold">00:00(UTC)</span></p>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-white w-0"></div>
                    </div>
                  </div>
                </div>
                <p className="text-sm">Available limit: <span className="font-semibold">1,000,000.00</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && selectedCard && (
        <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
          <div className="p-4">
            <button
              onClick={() => {
                setShowSettingsModal(false)
                setSelectedCard(null)
              }}
              className="mb-6"
            >
              <ChevronRight className="w-6 h-6 rotate-180" />
            </button>

            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            <div className="space-y-8">
              <div className="flex items-center gap-4 p-4 bg-gray-900 rounded-xl">
                <div className="w-16 h-10 bg-gray-800 rounded flex items-center justify-center text-xs">
                  VISA
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{selectedCard.cardholder_name.toUpperCase()}</p>
                  <p className="text-sm text-gray-400">{formatCardNumber(selectedCard.card_number)}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>

              <div>
                <h3 className="text-gray-400 text-sm mb-4">Manage card</h3>
                <div className="bg-gray-900 rounded-2xl overflow-hidden">
                  <button className="w-full p-5 flex items-center gap-4 active:bg-gray-800 transition-colors border-b border-gray-800">
                    <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold">Security settings</p>
                      <p className="text-xs text-gray-400">Control which transaction types and currencies are allowed</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  <button className="w-full p-5 flex items-center gap-4 active:bg-gray-800 transition-colors border-b border-gray-800">
                    <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                      📍
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold">Change billing address</p>
                      <p className="text-xs text-gray-400">Nigeria igando</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  <button className="w-full p-5 flex items-center gap-4 active:bg-gray-800 transition-colors">
                    <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                      ✏️
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold">Card label</p>
                      <p className="text-xs text-gray-400">Add an optional name for this card</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-gray-400 text-sm mb-4">Card actions</h3>
                <div className="bg-gray-900 rounded-2xl overflow-hidden">
                  <button className="w-full p-5 flex items-center gap-4 active:bg-gray-800 transition-colors border-b border-gray-800">
                    <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                      🔄
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold">Replace card</p>
                      <p className="text-xs text-gray-400">Replace if lost or used fraudulently</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>

                  <button
                    onClick={() => {
                      setShowSettingsModal(false)
                      handleDeleteCard(selectedCard)
                    }}
                    className="w-full p-5 flex items-center gap-4 active:bg-gray-800 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-red-500">Delete card</p>
                      <p className="text-xs text-gray-400">Deactivate this card permanently</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
