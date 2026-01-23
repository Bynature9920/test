import { useState } from 'react'
import { Send, ArrowLeft, User, MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { walletService } from '@/services/api/walletService'
import { formatCurrency } from '@/utils/format'

export default function SendToUserPage() {
  const navigate = useNavigate()
  const [recipientUserId, setRecipientUserId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [processing, setProcessing] = useState(false)

  const handleSend = async () => {
    // Validation
    if (!recipientUserId.trim()) {
      toast.error('Please enter recipient User ID')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (parseFloat(amount) < 100) {
      toast.error('Minimum transfer amount is ₦100')
      return
    }

    setProcessing(true)
    try {
      await walletService.sendToUser({
        recipient_user_id: recipientUserId.trim(),
        amount: parseFloat(amount),
        description: description.trim() || undefined,
      })

      toast.success('Transfer completed successfully!')
      
      // Reset form
      setRecipientUserId('')
      setAmount('')
      setDescription('')
      
      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Failed to complete transfer'
      toast.error(message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </button>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Send to User</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Transfer funds to another user instantly</p>
        </div>
      </div>

      {/* Send Form Card */}
      <div className="card max-w-2xl">
        <div className="space-y-6">
          {/* Recipient User ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recipient User ID <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={recipientUserId}
                onChange={(e) => setRecipientUserId(e.target.value)}
                placeholder="Enter recipient's User ID"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              The unique User ID of the person you want to send money to
            </p>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount (NGN) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              min="100"
              step="0.01"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Minimum: ₦100.00
            </p>
          </div>

          {/* Description (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute top-3 left-0 pl-3 pointer-events-none">
                <MessageSquare className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a note for this transfer (optional)"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                rows={3}
                maxLength={200}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {description.length}/200 characters
            </p>
          </div>

          {/* Transfer Summary (if amount is entered) */}
          {amount && parseFloat(amount) > 0 && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
              <div className="flex items-start gap-2">
                <Send className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-1">Transfer Summary</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-purple-700 dark:text-purple-400">Amount:</span>
                      <span className="font-semibold text-purple-900 dark:text-purple-200">
                        {formatCurrency(parseFloat(amount))}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-purple-700 dark:text-purple-400">Fee:</span>
                      <span className="font-semibold text-purple-900 dark:text-purple-200">₦0.00</span>
                    </div>
                    <div className="border-t border-purple-300 dark:border-purple-600 pt-1 mt-1"></div>
                    <div className="flex justify-between text-xs">
                      <span className="text-purple-700 dark:text-purple-400 font-semibold">Total:</span>
                      <span className="font-bold text-purple-900 dark:text-purple-100">
                        {formatCurrency(parseFloat(amount))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Transfer Information</p>
                <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                  <li>• Transfers are instant and free of charge</li>
                  <li>• Make sure the recipient's User ID is correct</li>
                  <li>• Transfers cannot be reversed once completed</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={processing || !recipientUserId.trim() || !amount || parseFloat(amount) < 100}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Money
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
