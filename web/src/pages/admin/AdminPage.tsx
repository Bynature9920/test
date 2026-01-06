import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Users, Shield, CheckCircle, XCircle, Clock, Search, 
  Activity, DollarSign, Wallet, TrendingUp, AlertTriangle,
  FileText, CreditCard, Plane, Ban, Eye, UserCheck, Lock,
  Unlock, RefreshCw, Download, Filter
} from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  country_code: string
  kyc_status: string
  is_active: boolean
  is_verified: boolean
  created_at: string
  oauth_provider: string
}

interface AdminStats {
  total_users: number
  active_users: number
  pending_kyc: number
  total_transactions: number
  total_volume: number
  pending_transactions: number
  failed_transactions: number
  platform_revenue: number
}

interface KYCDocument {
  document_id: string
  user_id: string
  user_name: string
  user_email: string
  document_type: string
  document_side: string
  file_url: string
  country: string
  submitted_at: string
  status: string
}

interface WalletInfo {
  wallet_id: string
  user_id: string
  user_name: string
  user_email: string
  currency: string
  balance: string
  status: string
  is_locked: boolean
  created_at: string
}

interface TransactionInfo {
  transaction_id: string
  sender_id: string | null
  sender_name: string | null
  recipient_id: string | null
  recipient_name: string | null
  amount: string
  currency: string
  fee: string
  type: string
  status: string
  reference: string
  created_at: string
}

interface AuditLog {
  log_id: string
  admin_id: string
  admin_email: string
  action: string
  target_type: string | null
  target_id: string | null
  details: string | null
  timestamp: string
}

type AdminTab = 'overview' | 'users' | 'kyc' | 'wallets' | 'transactions' | 'crypto' | 'cards' | 'loans' | 'risk' | 'logs'

export default function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // State
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  
  // New state for Phase 2
  const [kycDocuments, setKycDocuments] = useState<KYCDocument[]>([])
  const [wallets, setWallets] = useState<WalletInfo[]>([])
  const [transactions, setTransactions] = useState<TransactionInfo[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [selectedDocument, setSelectedDocument] = useState<KYCDocument | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  // Admin check
  const isAdmin = user?.email === 'admin@bengo.com' || user?.email === 'emzzygee000@gmail.com'

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Access denied. Admin only.')
      navigate('/dashboard')
      return
    }
    loadData()
  }, [isAdmin, activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'users' || activeTab === 'overview') {
        await loadUsers()
      }
      if (activeTab === 'overview') {
        await loadStats()
      }
      if (activeTab === 'kyc') {
        await loadKYCDocuments()
      }
      if (activeTab === 'wallets') {
        await loadWallets()
      }
      if (activeTab === 'transactions') {
        await loadTransactions()
      }
      if (activeTab === 'logs') {
        await loadAuditLogs()
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) throw new Error('Failed to load users')
      
      const data = await response.json()
      setUsers(data.users)
    } catch (error) {
      console.error('Failed to load users:', error)
      toast.error('Failed to load users')
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) throw new Error('Failed to load stats')
      
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
      // Fallback to calculating from users data
      setStats({
        total_users: users.length,
        active_users: users.filter(u => u.is_active).length,
        pending_kyc: users.filter(u => u.kyc_status === 'PENDING' || u.kyc_status === 'IN_PROGRESS').length,
        total_transactions: 0,
        total_volume: 0,
        pending_transactions: 0,
        failed_transactions: 0,
        platform_revenue: 0,
      })
    }
  }

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'freeze' | 'unfreeze') => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/admin/users/${userId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) throw new Error(`Failed to ${action} user`)
      
      toast.success(`User ${action}d successfully`)
      loadUsers()
    } catch (error) {
      console.error(`Failed to ${action} user:`, error)
      toast.error(`Failed to ${action} user`)
    }
  }

  const loadKYCDocuments = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/admin/kyc/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) throw new Error('Failed to load KYC documents')
      
      const data = await response.json()
      setKycDocuments(data.pending_verifications)
    } catch (error) {
      console.error('Failed to load KYC documents:', error)
      toast.error('Failed to load KYC documents')
    }
  }

  const loadWallets = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/admin/wallets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) throw new Error('Failed to load wallets')
      
      const data = await response.json()
      setWallets(data.wallets)
    } catch (error) {
      console.error('Failed to load wallets:', error)
      toast.error('Failed to load wallets')
    }
  }

  const loadTransactions = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/admin/transactions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) throw new Error('Failed to load transactions')
      
      const data = await response.json()
      setTransactions(data.transactions)
    } catch (error) {
      console.error('Failed to load transactions:', error)
      toast.error('Failed to load transactions')
    }
  }

  const handleApproveKYC = async (documentId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/admin/kyc/${documentId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) throw new Error('Failed to approve KYC')
      
      toast.success('KYC document approved successfully')
      loadKYCDocuments()
      loadStats() // Refresh stats
    } catch (error) {
      console.error('Failed to approve KYC:', error)
      toast.error('Failed to approve KYC document')
    }
  }

  const handleRejectKYC = async () => {
    if (!selectedDocument || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    try {
      const response = await fetch(`http://localhost:8000/api/v1/admin/kyc/${selectedDocument.document_id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectReason }),
      })
      
      if (!response.ok) throw new Error('Failed to reject KYC')
      
      toast.success('KYC document rejected')
      setShowRejectModal(false)
      setRejectReason('')
      setSelectedDocument(null)
      loadKYCDocuments()
      loadStats() // Refresh stats
    } catch (error) {
      console.error('Failed to reject KYC:', error)
      toast.error('Failed to reject KYC document')
    }
  }

  const loadAuditLogs = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/admin/audit-logs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) throw new Error('Failed to load audit logs')
      
      const data = await response.json()
      setAuditLogs(data.logs)
    } catch (error) {
      console.error('Failed to load audit logs:', error)
      toast.error('Failed to load audit logs')
    }
  }

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error('No data to export')
      return
    }

    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => Object.values(row).join(','))
    const csv = [headers, ...rows].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    toast.success(`Exported ${data.length} records`)
  }

  const getKycStatusBadge = (status: string) => {
    const config = {
      VERIFIED: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
      PENDING: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
      REJECTED: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
      IN_PROGRESS: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock },
    }
    
    const statusConfig = config[status as keyof typeof config] || config.PENDING
    const Icon = statusConfig.icon
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    )
  }

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id.includes(searchTerm)
  )

  if (!isAdmin) return null

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Activity },
    { id: 'users', name: 'User Management', icon: Users },
    { id: 'kyc', name: 'KYC Review', icon: UserCheck },
    { id: 'wallets', name: 'Wallets', icon: Wallet },
    { id: 'transactions', name: 'Transactions', icon: FileText },
    { id: 'crypto', name: 'Crypto', icon: TrendingUp },
    { id: 'cards', name: 'Cards', icon: CreditCard },
    { id: 'loans', name: 'Loans', icon: DollarSign },
    { id: 'risk', name: 'Risk & Fraud', icon: AlertTriangle },
    { id: 'logs', name: 'Audit Logs', icon: FileText },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
          BenGo Admin Panel
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Comprehensive platform administration and monitoring
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-x-auto">
        <div className="flex space-x-1 p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading...</p>
        </div>
      ) : (
        <>
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">{stats?.total_users || 0}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">{stats?.active_users || 0}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Pending KYC</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">{stats?.pending_kyc || 0}</p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg">
                      <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Platform Revenue</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">₦{stats?.platform_revenue.toLocaleString() || '0'}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg">
                      <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Signups</h3>
                  <div className="space-y-3">
                    {users.slice(0, 5).map((user) => (
                      <div key={user.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">System Alerts</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {stats?.pending_kyc || 0} KYC verifications pending
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Review pending documents
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          All systems operational
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          No critical issues detected
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="card">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by email, name, or ID..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <button className="btn-primary flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filters
                  </button>
                  <button className="btn-outline flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="card">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchTerm ? 'No users found matching your search.' : 'No users yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">ID</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Name</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Email</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Phone</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">KYC</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Registered</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100 font-mono">{user.id}</td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                              {user.first_name} {user.last_name}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{user.phone || 'N/A'}</td>
                            <td className="py-3 px-4">{getKycStatusBadge(user.kyc_status)}</td>
                            <td className="py-3 px-4">
                              {user.is_active ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                  Suspended
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setShowUserModal(true)
                                  }}
                                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {user.is_active ? (
                                  <button
                                    onClick={() => handleUserAction(user.id, 'suspend')}
                                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                    title="Suspend User"
                                  >
                                    <Ban className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleUserAction(user.id, 'activate')}
                                    className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                                    title="Activate User"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* KYC REVIEW TAB */}
          {activeTab === 'kyc' && (
            <div className="space-y-6">
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Pending KYC Verifications ({kycDocuments.length})
                  </h2>
                  <button 
                    onClick={loadKYCDocuments}
                    className="btn-outline flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>

                {kycDocuments.length === 0 ? (
                  <div className="text-center py-12">
                    <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No pending KYC verifications
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {kycDocuments.map((doc) => (
                      <div key={doc.document_id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="mb-4">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{doc.user_name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{doc.user_email}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">ID: {doc.user_id}</p>
                        </div>

                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Document:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{doc.document_type}</span>
                          </div>
                          {doc.document_side && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Side:</span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">{doc.document_side}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Country:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{doc.country}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Submitted:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {new Date(doc.submitted_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Document Preview:</p>
                          <div className="bg-gray-100 dark:bg-gray-800 rounded p-2 text-center text-xs text-gray-500">
                            {doc.file_url ? '📄 Document uploaded' : 'No file'}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveKYC(doc.document_id)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDocument(doc)
                              setShowRejectModal(true)
                            }}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* WALLETS TAB */}
          {activeTab === 'wallets' && (
            <div className="space-y-6">
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      All Wallets ({wallets.length})
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Read-only view. Balances cannot be edited by admins.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={loadWallets}
                      className="btn-outline flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </button>
                    <button
                      onClick={() => exportToCSV(wallets, 'wallets')}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  </div>
                </div>

                {wallets.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No wallets found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Wallet ID</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">User</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Email</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Currency</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Balance</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wallets.map((wallet) => (
                          <tr key={wallet.wallet_id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100 font-mono">{wallet.wallet_id}</td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">{wallet.user_name}</td>
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{wallet.user_email}</td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100 font-medium">{wallet.currency}</td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100 font-mono text-right">
                              {wallet.currency === 'NGN' ? '₦' : ''}{parseFloat(wallet.balance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  wallet.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                                }`}>
                                  {wallet.status}
                                </span>
                                {wallet.is_locked && (
                                  <Lock className="w-4 h-4 text-red-600 dark:text-red-400" title="Locked" />
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                              {new Date(wallet.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TRANSACTIONS TAB */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Recent Transactions ({transactions.length})
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Showing last 100 transactions
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={loadTransactions}
                      className="btn-outline flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </button>
                    <button
                      onClick={() => exportToCSV(transactions, 'transactions')}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  </div>
                </div>

                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No transactions found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">ID</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">From</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">To</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Amount</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Fee</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Type</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((txn) => (
                          <tr key={txn.transaction_id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                            <td className="py-3 px-4 text-xs text-gray-900 dark:text-gray-100 font-mono">
                              {txn.transaction_id.slice(0, 8)}...
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                              {txn.sender_name || 'N/A'}
                              {txn.sender_id && <p className="text-xs text-gray-500">{txn.sender_id}</p>}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                              {txn.recipient_name || 'N/A'}
                              {txn.recipient_id && <p className="text-xs text-gray-500">{txn.recipient_id}</p>}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100 font-mono text-right">
                              {txn.currency === 'NGN' ? '₦' : ''}{parseFloat(txn.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 font-mono text-right">
                              {txn.currency === 'NGN' ? '₦' : ''}{parseFloat(txn.fee).toLocaleString(undefined, {minimumFractionDigits: 2})}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">{txn.type}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                txn.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                txn.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                txn.status === 'FAILED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                              }`}>
                                {txn.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                              {new Date(txn.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'crypto' && (
            <div className="card text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Crypto Operations</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Monitor crypto deposits, conversions, and balances
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Coming soon...</p>
            </div>
          )}

          {activeTab === 'cards' && (
            <div className="card text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Virtual Cards Management</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                View and manage all issued virtual cards
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Coming soon...</p>
            </div>
          )}

          {activeTab === 'loans' && (
            <div className="card text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Loans Management</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Approve/reject loan applications and track repayments
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Coming soon...</p>
            </div>
          )}

          {activeTab === 'risk' && (
            <div className="card text-center py-12">
              <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Risk & Fraud Monitoring</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Detect and respond to suspicious activities
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Coming soon...</p>
            </div>
          )}

          {/* AUDIT LOGS TAB */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Admin Audit Logs ({auditLogs.length})
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      All admin actions are logged for compliance and security
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={loadAuditLogs}
                      className="btn-outline flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </button>
                    <button
                      onClick={() => exportToCSV(auditLogs, 'audit_logs')}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  </div>
                </div>

                {auditLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No audit logs yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Timestamp</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Admin</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Action</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Target</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log) => (
                          <tr key={log.log_id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                              {log.admin_email}
                              <p className="text-xs text-gray-500">{log.admin_id}</p>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                log.action.includes('APPROVE') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                log.action.includes('REJECT') || log.action.includes('SUSPEND') ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                log.action.includes('ACTIVATE') ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                              }`}>
                                {log.action.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                              {log.target_type && (
                                <>
                                  <span className="font-medium">{log.target_type}</span>
                                  {log.target_id && <p className="text-xs text-gray-500 font-mono">{log.target_id}</p>}
                                </>
                              )}
                              {!log.target_type && 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                              {log.details || 'No details'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Details</h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">User ID</p>
                    <p className="font-mono text-gray-900 dark:text-gray-100">{selectedUser.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <p className="text-gray-900 dark:text-gray-100">
                      {selectedUser.is_active ? '🟢 Active' : '🔴 Suspended'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Full Name</p>
                    <p className="text-gray-900 dark:text-gray-100">
                      {selectedUser.first_name} {selectedUser.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="text-gray-900 dark:text-gray-100">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                    <p className="text-gray-900 dark:text-gray-100">{selectedUser.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">KYC Status</p>
                    <div className="mt-1">{getKycStatusBadge(selectedUser.kyc_status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Signup Method</p>
                    <p className="text-gray-900 dark:text-gray-100">
                      {selectedUser.oauth_provider ? `${selectedUser.oauth_provider} OAuth` : 'Email/Password'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Registration Date</p>
                    <p className="text-gray-900 dark:text-gray-100">
                      {new Date(selectedUser.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Admin Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.is_active ? (
                      <button
                        onClick={() => {
                          handleUserAction(selectedUser.id, 'suspend')
                          setShowUserModal(false)
                        }}
                        className="btn-outline text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <Ban className="w-4 h-4" />
                        Suspend Account
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          handleUserAction(selectedUser.id, 'activate')
                          setShowUserModal(false)
                        }}
                        className="btn-outline text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Activate Account
                      </button>
                    )}
                    <button className="btn-outline flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Freeze Wallet
                    </button>
                    <button className="btn-outline flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      View Transactions
                    </button>
                    <button className="btn-outline flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      View Wallets
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject KYC Modal */}
      {showRejectModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Reject KYC Document</h2>
                <button
                  onClick={() => {
                    setShowRejectModal(false)
                    setRejectReason('')
                    setSelectedDocument(null)
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">User:</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{selectedDocument.user_name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">{selectedDocument.user_email}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Document Type:</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{selectedDocument.document_type}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rejection Reason <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Provide a clear reason for rejection..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowRejectModal(false)
                      setRejectReason('')
                      setSelectedDocument(null)
                    }}
                    className="flex-1 btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectKYC}
                    disabled={!rejectReason.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 rounded-lg font-medium transition-colors"
                  >
                    Reject Document
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
