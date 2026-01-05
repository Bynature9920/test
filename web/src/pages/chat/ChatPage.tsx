import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Send, ArrowLeft, X } from 'lucide-react'

type Message = {
  text: string
  sender: 'user' | 'bot' | 'agent'
}

const commonIssues = [
  { id: 'verify', title: '🔐 Account Verification', guide: 'To verify your account:\n\n1. Go to Profile → Verification\n2. Select your country\n3. Upload required documents (Passport, Driver\'s License, etc.)\n4. Submit for review\n\nVerification typically takes 1-3 business days. You\'ll receive an email notification once completed. If rejected, you can resubmit with corrected documents.' },
  { id: 'deposit', title: '💰 How to Deposit Funds', guide: 'You have multiple ways to deposit:\n\n**Via Crypto:**\n1. Go to Crypto section\n2. Select your currency (BTC, ETH, USDT)\n3. Copy your unique deposit address\n4. Send crypto from your wallet\n5. Wait for confirmations (usually 10-30 mins)\n\n**Via Bank Transfer:**\n1. Go to Wallet section\n2. Select "Add Money"\n3. Follow bank transfer instructions\n4. Funds typically arrive within 1-2 hours' },
  { id: 'withdraw', title: '🏦 How to Withdraw', guide: 'To withdraw funds:\n\n1. Ensure your account is verified\n2. Go to Wallet → Withdraw\n3. Enter amount and select method\n4. For crypto: Enter your wallet address (double-check!)\n5. For bank: Provide your account details\n6. Confirm transaction\n\nProcessing times:\n• Crypto: 10-60 minutes\n• Bank transfer: 1-2 business days\n\nMinimum withdrawal: ₦5,000' },
  { id: 'fees', title: '💳 Transaction Fees', guide: 'Our fee structure:\n\n**Deposits:**\n• Crypto: Network fees only (0.5-2%)\n• Bank transfer: Free\n\n**Withdrawals:**\n• Crypto: 1% + network fee\n• Bank transfer: ₦100 flat fee\n\n**Trading:**\n• P2P trades: 0.5% per transaction\n• Crypto-to-Naira: 1.5%\n\n**Cards:**\n• Virtual card creation: ₦500\n• Card funding: Free\n• International transactions: 2%' },
  { id: 'password', title: '🔑 Reset Password', guide: 'To reset your password:\n\n**If logged out:**\n1. Click "Forgot Password" on login page\n2. Enter your email\n3. Check email for reset link\n4. Click link and set new password\n\n**If logged in:**\n1. Go to Profile → Change Password\n2. Enter current password\n3. Enter new password (min 6 characters)\n4. Confirm new password\n5. Click "Update Password"\n\nPassword tips:\n• Use mix of letters, numbers, symbols\n• Minimum 6 characters\n• Don\'t share with anyone' },
  { id: 'payment', title: '📱 Payment Issues', guide: 'If your payment failed:\n\n**Check these first:**\n1. Sufficient balance in your account\n2. Account is verified\n3. Correct recipient details\n4. Not exceeding transaction limits\n\n**For stuck transactions:**\n• Wait 10-15 minutes\n• Check transaction history\n• Note transaction ID\n\n**Still having issues?**\nType "agent" to connect with a live agent who can investigate your specific transaction.' },
  { id: 'security', title: '🛡️ Account Security', guide: 'Keep your account secure:\n\n**Best Practices:**\n• Use strong unique password\n• Never share your password\n• Verify URLs before logging in\n• Log out on shared devices\n• Enable 2FA when available\n\n**If your account is compromised:**\n1. Change password immediately\n2. Review recent transactions\n3. Contact support: support@bengo.com\n4. Type "agent" for immediate assistance\n\n**Official contacts only:**\n• Email: support@bengo.com\n• Website: bengo.com\n• We never ask for passwords via email!' },
  { id: 'limits', title: '📊 Transaction Limits', guide: 'Your transaction limits depend on verification:\n\n**Unverified Accounts:**\n• Daily deposit: ₦50,000\n• Daily withdrawal: ₦20,000\n• Per transaction: ₦10,000\n\n**Verified Accounts:**\n• Daily deposit: ₦5,000,000\n• Daily withdrawal: ₦2,000,000\n• Per transaction: ₦1,000,000\n\n**To increase limits:**\n1. Complete account verification\n2. Maintain good transaction history\n3. Contact support for enterprise limits\n\nGet verified now: Profile → Verification' },
]

export default function ChatPage() {
  const navigate = useNavigate()
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { text: 'Hello! I\'m your BenGo assistant. 👋\n\nPlease select an issue below, or type your question:', sender: 'bot' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [isWaitingForAgent, setIsWaitingForAgent] = useState(false)
  const [showIssueMenu, setShowIssueMenu] = useState(true)

  const handleIssueClick = (issue: typeof commonIssues[0]) => {
    // Add user selection
    setChatMessages(prev => [...prev, { text: issue.title, sender: 'user' }])
    setShowIssueMenu(false)
    
    // Bot responds with guide
    setTimeout(() => {
      setChatMessages(prev => [...prev, { text: issue.guide, sender: 'bot' }])
    }, 500)
  }

  const handleChatMessage = (message: string) => {
    if (!message.trim()) return
    
    // Add user message
    setChatMessages(prev => [...prev, { text: message, sender: 'user' }])
    setChatInput('')
    setShowIssueMenu(false)
    
    // Simple bot logic
    setTimeout(() => {
      const lowerMsg = message.toLowerCase()
      let botResponse = ''
      
      if (lowerMsg.includes('agent') || lowerMsg.includes('human') || lowerMsg.includes('person')) {
        botResponse = 'Let me connect you with a live agent for personalized assistance...'
        setIsWaitingForAgent(true)
        setTimeout(() => {
          setChatMessages(prev => [...prev, 
            { text: 'A live agent will be with you shortly. Current wait time: 2-3 minutes.', sender: 'bot' }
          ])
        }, 1500)
        return
      } else {
        botResponse = 'I\'m not sure I understand. Please select an issue from the menu, or type "agent" to speak with a live support agent.'
      }
      
      setChatMessages(prev => [...prev, { text: botResponse, sender: 'bot' }])
    }, 800)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <MessageSquare className="w-6 h-6" />
              Chat with Support
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Get instant help or connect with a live agent
            </p>
          </div>
        </div>
      </div>

      <div className="card p-6 lg:p-8">
        {/* Common Issues Menu */}
        {showIssueMenu && (
          <div className="mb-6 p-6 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Select an issue:
              </h2>
              <button
                onClick={() => setShowIssueMenu(false)}
                className="p-1 hover:bg-white/50 dark:hover:bg-black/20 rounded transition-colors"
                title="Close menu"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {commonIssues.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => handleIssueClick(issue)}
                  className="text-left px-4 py-3 bg-white dark:bg-slate-900 hover:bg-primary-100 dark:hover:bg-primary-900/40 border border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600 rounded-lg transition-all shadow-sm hover:shadow-md text-sm font-medium"
                >
                  {issue.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 lg:p-6 h-[500px] overflow-y-auto space-y-4 bg-gray-50 dark:bg-slate-900/50 mb-4">
          {chatMessages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-3 shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-primary-500 text-white'
                    : msg.sender === 'agent'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-gray-900 dark:text-gray-100 border border-blue-200 dark:border-blue-800'
                    : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <p className="text-sm whitespace-pre-line leading-relaxed">{msg.text}</p>
                {msg.sender === 'agent' && (
                  <p className="text-xs mt-2 opacity-75 font-semibold">✓ Live Agent</p>
                )}
              </div>
            </div>
          ))}
          {isWaitingForAgent && (
            <div className="flex justify-center">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-lg px-4 py-3 text-sm shadow-sm border border-yellow-200 dark:border-yellow-800">
                <span className="inline-block animate-pulse">⏳</span> Connecting to live agent...
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="flex gap-3">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleChatMessage(chatInput)}
            placeholder="Type your message or 'agent' for live help..."
            className="flex-1 input-field"
          />
          <button
            onClick={() => handleChatMessage(chatInput)}
            className="btn-primary px-6 flex items-center gap-2"
            disabled={!chatInput.trim()}
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>

        {!showIssueMenu && (
          <button
            onClick={() => setShowIssueMenu(true)}
            className="mt-4 text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Show issue menu
          </button>
        )}
      </div>
    </div>
  )
}

