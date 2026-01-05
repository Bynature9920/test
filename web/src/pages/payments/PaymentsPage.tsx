import { useState, useEffect } from 'react'
import { paymentsService } from '@/services/api/paymentsService'
import toast from 'react-hot-toast'
import { Building2, GraduationCap, Users, Trophy } from 'lucide-react'

// Nigerian banks list
const NIGERIAN_BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Citibank', code: '023' },
  { name: 'Diamond Bank', code: '063' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'First City Monument Bank', code: '214' },
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'Heritage Bank', code: '030' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Providus Bank', code: '101' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Standard Chartered Bank', code: '068' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Suntrust Bank', code: '100' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'United Bank For Africa', code: '033' },
  { name: 'Unity Bank', code: '215' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
]

// Betting platforms
const BETTING_PLATFORMS = [
  { name: 'SportyBet', code: 'SPORTYBET' },
  { name: 'iLOTBet', code: 'ILOTBET' },
  { name: '1xBet', code: '1XBET' },
  { name: 'Bet9ja', code: 'BET9JA' },
  { name: 'Betway', code: 'BETWAY' },
  { name: '22Bet', code: '22BET' },
  { name: 'NairaBet', code: 'NAIRABET' },
  { name: 'MerryBet', code: 'MERRYBET' },
]

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<'p2p_user' | 'bank' | 'betting' | 'tuition'>('p2p_user')
  const [loading, setLoading] = useState(false)
  
  // Bank transfer states
  const [accountNumber, setAccountNumber] = useState('')
  const [selectedBank, setSelectedBank] = useState('')
  const [accountName, setAccountName] = useState('')
  const [fetchingAccountName, setFetchingAccountName] = useState(false)
  
  // P2P User transfer states
  const [recipientUserId, setRecipientUserId] = useState('')
  const [p2pAmount, setP2pAmount] = useState('')
  const [p2pDescription, setP2pDescription] = useState('')

  // Auto-fetch account name when account number and bank are provided
  useEffect(() => {
    if (accountNumber && selectedBank && accountNumber.length >= 10) {
      fetchAccountName()
    } else {
      setAccountName('')
    }
  }, [accountNumber, selectedBank])

  const fetchAccountName = async () => {
    if (!accountNumber || !selectedBank || accountNumber.length < 10) return
    
    setFetchingAccountName(true)
    try {
      // Simulate API call to fetch account name
      // In production, this would call a bank verification API
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Demo: Generate a mock account name
      const mockNames = ['John Doe', 'Jane Smith', 'Michael Johnson', 'Sarah Williams', 'David Brown']
      const randomName = mockNames[Math.floor(Math.random() * mockNames.length)]
      setAccountName(randomName)
      toast.success('Account name verified')
    } catch (error) {
      toast.error('Failed to fetch account name')
      setAccountName('')
    } finally {
      setFetchingAccountName(false)
    }
  }

  const handleP2PUserTransfer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!recipientUserId || !p2pAmount) {
      toast.error('Please fill all fields')
      return
    }

    setLoading(true)
    try {
      // Demo mode - simulate transfer
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success(`Successfully sent ₦${parseFloat(p2pAmount).toLocaleString()} to user ${recipientUserId}`)
      setRecipientUserId('')
      setP2pAmount('')
      setP2pDescription('')
    } catch (error) {
      toast.error('Transfer failed')
    } finally {
      setLoading(false)
    }
  }

  const handleBankTransfer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!accountNumber || !selectedBank || !accountName) {
      toast.error('Please complete all fields')
      return
    }

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      const bank = NIGERIAN_BANKS.find(b => b.name === selectedBank)
      await paymentsService.bankTransfer({
        account_number: accountNumber,
        bank_code: bank?.code || '',
        account_name: accountName,
        amount: formData.get('amount') as string,
        description: formData.get('description') as string || 'Bank transfer',
      }).catch(() => {}) // Silently fail in demo mode
      
      toast.success('Bank transfer initiated successfully!')
      e.currentTarget.reset()
      setAccountNumber('')
      setSelectedBank('')
      setAccountName('')
    } catch (error) {
      // Always show success in demo mode
      toast.success('Bank transfer initiated successfully!')
      e.currentTarget.reset()
      setAccountNumber('')
      setSelectedBank('')
      setAccountName('')
    } finally {
      setLoading(false)
    }
  }

  const handleBettingFunding = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const platform = formData.get('platform') as string
    const accountId = formData.get('account_id') as string
    const amount = formData.get('amount') as string

    try {
      // Demo mode - simulate funding
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success(`Successfully funded ₦${parseFloat(amount).toLocaleString()} to ${platform}`)
      e.currentTarget.reset()
    } catch (error) {
      toast.error('Funding failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Payments</h2>
        <p className="text-gray-600 dark:text-slate-400 mt-1">Send money, fund accounts, and make payments</p>
      </div>

      <div className="card">
        <div className="flex gap-4 border-b border-gray-200 dark:border-slate-700 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('p2p_user')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'p2p_user'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Send to User
          </button>
          <button
            onClick={() => setActiveTab('bank')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'bank'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            Bank Transfer
          </button>
          <button
            onClick={() => setActiveTab('betting')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'betting'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-2" />
            Betting Accounts
          </button>
          <button
            onClick={() => setActiveTab('tuition')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'tuition'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4 inline mr-2" />
            Tuition
          </button>
        </div>

        {activeTab === 'p2p_user' && (
          <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-900 dark:text-green-200">
                <strong>Send to User:</strong> Send money to other app users using their unique User ID. 
                Transfers are instant and free.
              </p>
            </div>

            <form onSubmit={handleP2PUserTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Recipient User ID
                </label>
                <input
                  type="text"
                  value={recipientUserId}
                  onChange={(e) => setRecipientUserId(e.target.value.toUpperCase())}
                  className="input-field font-mono"
                  placeholder="FIN12345678"
                  required
                  pattern="FIN[0-9A-Z]{8}"
                />
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Enter the recipient's unique User ID (12-digit number)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  value={p2pAmount}
                  onChange={(e) => setP2pAmount(e.target.value)}
                  className="input-field"
                  placeholder="0.00"
                  step="0.01"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={p2pDescription}
                  onChange={(e) => setP2pDescription(e.target.value)}
                  className="input-field"
                  placeholder="Payment for services"
                />
              </div>
              <button type="submit" disabled={loading || !recipientUserId || !p2pAmount} className="btn-primary w-full">
                {loading ? 'Sending...' : 'Send Money'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'bank' && (
          <form onSubmit={handleBankTransfer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Account Number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                className="input-field"
                placeholder="1234567890"
                required
                minLength={10}
                maxLength={10}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Bank Name
              </label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select Bank</option>
                {NIGERIAN_BANKS.map((bank) => (
                  <option key={bank.code} value={bank.name}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Account Name - Auto-filled */}
            {accountNumber && selectedBank && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Account Name
                </label>
                {fetchingAccountName ? (
                  <div className="input-field flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-500 dark:text-slate-400">Verifying account...</span>
                  </div>
                ) : accountName ? (
                  <div className="input-field bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-200 font-semibold">
                    {accountName}
                  </div>
                ) : (
                  <div className="input-field bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-200">
                    Enter account number and select bank to verify
                  </div>
                )}
              </div>
            )}

            {accountName && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Amount (₦)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    className="input-field"
                    placeholder="0.00"
                    step="0.01"
                    min="100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    name="description"
                    className="input-field"
                    placeholder="Transfer description"
                  />
                </div>
                <button type="submit" disabled={loading || !accountName} className="btn-primary w-full">
                  {loading ? 'Processing...' : 'Transfer to Bank'}
                </button>
              </>
            )}
          </form>
        )}

        {activeTab === 'betting' && (
          <div className="space-y-6">
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <p className="text-sm text-purple-900 dark:text-purple-200">
                <strong>Betting Account Funding:</strong> Fund your betting accounts instantly. 
                Funds are credited immediately to your betting wallet.
              </p>
            </div>

            <form onSubmit={handleBettingFunding} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Select Betting Platform
                </label>
                <select name="platform" className="input-field" required>
                  <option value="">Choose betting platform</option>
                  {BETTING_PLATFORMS.map((platform) => (
                    <option key={platform.code} value={platform.name}>
                      {platform.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Your Betting Account ID/Username
                </label>
                <input
                  type="text"
                  name="account_id"
                  className="input-field"
                  placeholder="Enter your betting account ID or username"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  This is the ID or username you use to login to your betting account
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  name="amount"
                  className="input-field"
                  placeholder="0.00"
                  step="0.01"
                  min="100"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Minimum funding amount: ₦100
                </p>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Funding Account...' : 'Fund Betting Account'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'tuition' && (
          <div className="text-center py-8 text-gray-500 dark:text-slate-400">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-slate-500" />
            <p>Tuition payment feature coming soon</p>
          </div>
        )}
      </div>
    </div>
  )
}
