import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { 
  User, Lock, Phone, Mail, Camera, Shield, Edit2, Save, X, 
  HelpCircle, Info, MessageCircle, MessageSquare, LogOut, ChevronDown, ChevronUp,
  Sun, Moon, Monitor, Wallet, Copy, Check, ChevronRight, Bell, Eye, EyeOff,
  FileText, CreditCard, Globe, Smartphone, AlertCircle, Settings
} from 'lucide-react'
import { profileService } from '@/services/api/profileService'
import { authService } from '@/services/api/authService'

// Schemas for different update forms
const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Password must be at least 6 characters'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

const updateEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password required for verification'),
})

const updatePhoneSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password required for verification'),
})

type ChangePasswordData = z.infer<typeof changePasswordSchema>
type UpdateEmailData = z.infer<typeof updateEmailSchema>
type UpdatePhoneData = z.infer<typeof updatePhoneSchema>

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [walletIdCopied, setWalletIdCopied] = useState(false)

  // User's wallet ID (using user ID as wallet ID)
  const walletId = user?.id?.toString() || '000000000000'

  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // Account activity data
  const recentActivity = [
    { action: 'Password changed', date: '2 days ago', device: 'Chrome on Windows' },
    { action: 'Logged in', date: '1 week ago', device: 'Safari on iPhone' },
    { action: 'Email updated', date: '2 weeks ago', device: 'Chrome on Windows' },
  ]

  // Password form
  const passwordForm = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
  })

  // Email form
  const emailForm = useForm<UpdateEmailData>({
    resolver: zodResolver(updateEmailSchema),
    defaultValues: { email: user?.email },
  })

  // Phone form
  const phoneForm = useForm<UpdatePhoneData>({
    resolver: zodResolver(updatePhoneSchema),
    defaultValues: { phone: user?.phone },
  })

  const handleChangePassword = async (data: ChangePasswordData) => {
    try {
      await profileService.changePassword(data.currentPassword, data.newPassword)
      toast.success('Password changed successfully!')
      passwordForm.reset()
      setIsChangingPassword(false)
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Failed to change password'
      toast.error(message)
    }
  }

  const handleUpdateEmail = async (data: UpdateEmailData) => {
    try {
      await profileService.updateEmail(data.email, data.password)
      toast.success('Email updated successfully! Please re-login.')
      setIsEditingEmail(false)
      // Refresh user data
      await authService.getCurrentUser()
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Failed to update email'
      toast.error(message)
    }
  }

  const handleUpdatePhone = async (data: UpdatePhoneData) => {
    try {
      await profileService.updatePhone(data.phone, data.password)
      toast.success('Phone number updated successfully!')
      setIsEditingPhone(false)
      // Refresh user data
      await authService.getCurrentUser()
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Failed to update phone number'
      toast.error(message)
    }
  }

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    setIsLoadingImage(true)
    try {
      // Convert to base64 for preview
      const reader = new FileReader()
      reader.onloadend = async () => {
        setProfileImage(reader.result as string)
        
        try {
          // Upload to server
          await profileService.uploadProfilePicture(file)
          toast.success('Profile picture updated!')
        } catch (error: any) {
          const message = error?.response?.data?.detail || 'Failed to upload profile picture'
          toast.error(message)
          setProfileImage(null) // Reset on error
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast.error('Failed to process image')
    } finally {
      setIsLoadingImage(false)
    }
  }

  const faqData = [
    { question: 'How do I verify my account?', answer: 'Go to Profile → Verification and follow the steps to upload your documents.' },
    { question: 'How long does verification take?', answer: 'Verification typically takes 1-3 business days. You\'ll receive a notification once completed.' },
    { question: 'How do I deposit crypto?', answer: 'Navigate to the Crypto section, select your currency, and get your unique deposit address.' },
    { question: 'What are the transaction fees?', answer: 'Transaction fees vary by payment method. Check our Payments page for current rates.' },
    { question: 'How do I reset my password?', answer: 'Use the "Forgot Password" link on the login page or change it here in Profile Settings.' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getKycStatusBadge = (status: string) => {
    const statusConfig = {
      verified: { 
        color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800', 
        icon: '✓',
        text: 'Verified' 
      },
      pending: { 
        color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800', 
        icon: '⏳',
        text: 'Pending Review' 
      },
      rejected: { 
        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800', 
        icon: '✗',
        text: 'Rejected' 
      },
      not_started: { 
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700', 
        icon: '○',
        text: 'Not Verified' 
      },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_started
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${config.color}`}>
        <span className="text-sm">{config.icon}</span>
        {config.text}
      </span>
    )
  }

  const copyWalletId = async () => {
    try {
      await navigator.clipboard.writeText(walletId)
      setWalletIdCopied(true)
      toast.success('Wallet ID copied!')
      setTimeout(() => setWalletIdCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-900 dark:to-primary-950 text-white p-6 md:p-8 rounded-b-3xl shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile Image */}
            <div className="relative group">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold overflow-hidden ring-4 ring-white/30 shadow-xl">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white">{user?.first_name?.[0]}{user?.last_name?.[0]}</span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-10 h-10 bg-white text-primary-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
                <Camera className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  className="hidden"
                  disabled={isLoadingImage}
                />
              </label>
              {isLoadingImage && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {user?.first_name} {user?.last_name}
              </h1>
              <p className="text-white/80 mb-4">{user?.email}</p>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                  <span className="text-sm font-medium">
                    {getKycStatusBadge(user?.kyc_status || 'not_started')}
                  </span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  <span className="text-sm font-medium">ID: {walletId}</span>
                  <button onClick={copyWalletId} className="ml-1">
                    {walletIdCopied ? (
                      <Check className="w-4 h-4 text-green-300" />
                    ) : (
                      <Copy className="w-4 h-4 hover:text-green-300 transition-colors" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8">
        <div className="space-y-4">

          {/* Account Information Section */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Information
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Manage your personal details</p>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {/* Personal Information */}
              <div className="p-4 md:p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">First Name</label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <User className="w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={user?.first_name || ''}
                        disabled
                        className="flex-1 bg-transparent text-gray-900 dark:text-white font-medium outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Last Name</label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <User className="w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={user?.last_name || ''}
                        disabled
                        className="flex-1 bg-transparent text-gray-900 dark:text-white font-medium outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Section */}
              <div className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Email Address</h3>
                  {!isEditingEmail && (
                    <button
                      onClick={() => setIsEditingEmail(true)}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium flex items-center gap-1"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                </div>
                {!isEditingEmail ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="flex-1 text-gray-900 dark:text-white font-medium">{user?.email}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 pl-1">Used for login and notifications</p>
                  </div>
                ) : (
                  <form onSubmit={emailForm.handleSubmit(handleUpdateEmail)} className="space-y-3">
                    <div>
                      <input
                        {...emailForm.register('email')}
                        type="email"
                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                        placeholder="new@example.com"
                      />
                      {emailForm.formState.errors.email && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {emailForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <input
                        {...emailForm.register('password')}
                        type="password"
                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                        placeholder="Confirm password"
                      />
                      {emailForm.formState.errors.password && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {emailForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingEmail(false)
                          emailForm.reset({ email: user?.email })
                        }}
                        className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Phone Section */}
              <div className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Phone Number</h3>
                  {!isEditingPhone && (
                    <button
                      onClick={() => setIsEditingPhone(true)}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium flex items-center gap-1"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                </div>
                {!isEditingPhone ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="flex-1 text-gray-900 dark:text-white font-medium">{user?.phone}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 pl-1">Used for account verification</p>
                  </div>
                ) : (
                  <form onSubmit={phoneForm.handleSubmit(handleUpdatePhone)} className="space-y-3">
                    <div>
                      <input
                        {...phoneForm.register('phone')}
                        type="tel"
                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                        placeholder="+2348012345678"
                      />
                      {phoneForm.formState.errors.phone && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {phoneForm.formState.errors.phone.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <input
                        {...phoneForm.register('password')}
                        type="password"
                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                        placeholder="Confirm password"
                      />
                      {phoneForm.formState.errors.password && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {phoneForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingPhone(false)
                          phoneForm.reset({ phone: user?.phone })
                        }}
                        className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Verification Status */}
              <div className="p-4 md:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Verification Status</h3>
                    </div>
                    <div className="mb-3">
                      {getKycStatusBadge(user?.kyc_status || 'not_started')}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {user?.kyc_status === 'verified' && 'Your account is fully verified'}
                      {user?.kyc_status === 'pending' && 'Your verification is being reviewed'}
                      {user?.kyc_status === 'rejected' && 'Verification was rejected. Please resubmit'}
                      {(!user?.kyc_status || user?.kyc_status === 'not_started') && 'Complete verification to unlock all features'}
                    </p>
                  </div>
                  {user?.kyc_status !== 'verified' && (
                    <button
                      onClick={() => navigate('/verification')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
                    >
                      {user?.kyc_status === 'pending' ? 'View' : 'Verify'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Security & Privacy Section */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Security & Privacy
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Keep your account secure</p>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {/* Password */}
              <div className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Password</h3>
                  {!isChangingPassword && (
                    <button
                      onClick={() => setIsChangingPassword(true)}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium flex items-center gap-1"
                    >
                      <Edit2 className="w-4 h-4" />
                      Change
                    </button>
                  )}
                </div>
                {!isChangingPassword ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <Lock className="w-4 h-4 text-gray-400" />
                      <span className="flex-1 text-gray-900 dark:text-white font-medium">••••••••</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 pl-1">Last changed: Never</p>
                  </div>
                ) : (
                  <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Current Password</label>
                      <div className="relative">
                        <input
                          {...passwordForm.register('currentPassword')}
                          type={showPassword.current ? 'text' : 'password'}
                          className="w-full p-3 pr-10 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({...showPassword, current: !showPassword.current})}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {passwordForm.formState.errors.currentPassword.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">New Password</label>
                      <div className="relative">
                        <input
                          {...passwordForm.register('newPassword')}
                          type={showPassword.new ? 'text' : 'password'}
                          className="w-full p-3 pr-10 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordForm.formState.errors.newPassword && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {passwordForm.formState.errors.newPassword.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Confirm Password</label>
                      <div className="relative">
                        <input
                          {...passwordForm.register('confirmPassword')}
                          type={showPassword.confirm ? 'text' : 'password'}
                          className="w-full p-3 pr-10 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {passwordForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button type="submit" className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsChangingPassword(false)
                          passwordForm.reset()
                        }}
                        className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Account Activity */}
              <div className="p-4 md:p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <Shield className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{activity.device}</p>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{activity.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Preferences
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Customize your experience</p>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {/* Theme Settings */}
              <div className="p-4 md:p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">App Appearance</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      theme === 'light'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        theme === 'light' ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        <Sun className="w-6 h-6" />
                      </div>
                      <span className={`text-sm font-medium ${theme === 'light' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        Light
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      theme === 'dark'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        theme === 'dark' ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        <Moon className="w-6 h-6" />
                      </div>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        Dark
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Notifications */}
              <div className="p-4 md:p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Push Notifications</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Receive in-app notifications</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        notificationsEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        notificationsEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Receive updates via email</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        emailNotifications ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        emailNotifications ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">SMS Notifications</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Receive SMS alerts</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSmsNotifications(!smsNotifications)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        smsNotifications ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        smsNotifications ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Support & Help Section */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Support & Help
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Get assistance when you need it</p>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {/* FAQ */}
              <div className="p-4 md:p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h3>
                <div className="space-y-2">
                  {faqData.map((faq, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                      >
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{faq.question}</span>
                        {expandedFaq === index ? (
                          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                      {expandedFaq === index && (
                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-300">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Chat */}
              <div className="p-4 md:p-6">
                <button
                  onClick={() => navigate('/chat')}
                  className="w-full p-4 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-950 dark:to-blue-950 border border-primary-200 dark:border-primary-800 rounded-xl hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Chat with Support</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Get instant help from our team</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>

              {/* Contact Information */}
              <div className="p-4 md:p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">support@bengo.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Phone</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">+234 800 123 4567</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Business Hours</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Mon-Fri: 9:00 AM - 6:00 PM</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Sat: 10:00 AM - 4:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* About BenGo Section */}
          <div className="bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-950/50 dark:to-blue-950/50 rounded-2xl shadow-sm border border-primary-200 dark:border-primary-900 p-6 md:p-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Info className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">About BenGo</h2>
                <p className="text-sm text-primary-700 dark:text-primary-300 font-semibold italic">Built for life on the go</p>
              </div>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-3 leading-relaxed">
              <p className="font-medium text-gray-900 dark:text-white">
                BenGo is built for people who are always moving forward.
              </p>
              <p>
                We created BenGo to help students, freelancers, and travelers manage their money without stress. 
                From sending money to family, funding accounts with crypto, paying tuition, booking travel, or making 
                everyday payments, BenGo brings everything into one simple and secure platform.
              </p>
              <p>
                Money should be easy, flexible, and available when you need it. BenGo is designed to give you control, 
                speed, and peace of mind, whether you're studying, working online, traveling, or supporting the people you care about.
              </p>
            </div>
          </div>

          {/* Logout Section */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-red-200 dark:border-red-900 overflow-hidden">
            <button
              onClick={handleLogout}
              className="w-full p-6 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <LogOut className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-left">
                  <p className="text-base font-bold text-red-600 dark:text-red-400">Logout</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sign out of your account</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-red-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
