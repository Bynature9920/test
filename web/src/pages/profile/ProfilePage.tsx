import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { 
  User, Lock, Phone, Mail, Camera, Shield, Edit2, Save, X, 
  HelpCircle, Info, MessageCircle, MessageSquare, LogOut, ChevronDown, ChevronUp
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
  const navigate = useNavigate()
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

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
      verified: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', text: 'Verified' },
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', text: 'Pending' },
      rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', text: 'Rejected' },
      not_started: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', text: 'Not Started' },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_started
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Shield className="w-4 h-4 mr-2" />
        {config.text}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profile Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your account information and security
        </p>
      </div>

      {/* Profile Picture Section */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Camera className="w-5 h-5 mr-2" />
          Profile Picture
        </h2>
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{user?.first_name?.[0]}{user?.last_name?.[0]}</span>
              )}
            </div>
            {isLoadingImage && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </div>
          <div>
            <label className="btn-primary cursor-pointer inline-flex items-center">
              <Camera className="w-4 h-4 mr-2" />
              Upload Photo
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="hidden"
                disabled={isLoadingImage}
              />
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              JPG, PNG or GIF. Max size 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Personal Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={user?.first_name || ''}
              disabled
              className="input-field bg-gray-50 dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={user?.last_name || ''}
              disabled
              className="input-field bg-gray-50 dark:bg-gray-800"
            />
          </div>
        </div>
      </div>

      {/* Email Section */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Mail className="w-5 h-5 mr-2" />
          Email Address
        </h2>
        {!isEditingEmail ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900 dark:text-gray-100">{user?.email}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Your email is used for login and notifications
              </p>
            </div>
            <button
              onClick={() => setIsEditingEmail(true)}
              className="btn-secondary flex items-center"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Change
            </button>
          </div>
        ) : (
          <form onSubmit={emailForm.handleSubmit(handleUpdateEmail)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Email
              </label>
              <input
                {...emailForm.register('email')}
                type="email"
                className="input-field"
                placeholder="new@example.com"
              />
              {emailForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                {...emailForm.register('password')}
                type="password"
                className="input-field"
                placeholder="Enter your password"
              />
              {emailForm.formState.errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {emailForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex items-center">
                <Save className="w-4 h-4 mr-2" />
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingEmail(false)
                  emailForm.reset({ email: user?.email })
                }}
                className="btn-secondary flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Phone Section */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Phone className="w-5 h-5 mr-2" />
          Phone Number
        </h2>
        {!isEditingPhone ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900 dark:text-gray-100">{user?.phone}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Your phone number for account verification
              </p>
            </div>
            <button
              onClick={() => setIsEditingPhone(true)}
              className="btn-secondary flex items-center"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Change
            </button>
          </div>
        ) : (
          <form onSubmit={phoneForm.handleSubmit(handleUpdatePhone)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Phone Number
              </label>
              <input
                {...phoneForm.register('phone')}
                type="tel"
                className="input-field"
                placeholder="+2348012345678"
              />
              {phoneForm.formState.errors.phone && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {phoneForm.formState.errors.phone.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                {...phoneForm.register('password')}
                type="password"
                className="input-field"
                placeholder="Enter your password"
              />
              {phoneForm.formState.errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {phoneForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex items-center">
                <Save className="w-4 h-4 mr-2" />
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingPhone(false)
                  phoneForm.reset({ phone: user?.phone })
                }}
                className="btn-secondary flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Verification Status Section */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Account Verification
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-700 dark:text-gray-300 mb-2">Verification Status</p>
            {getKycStatusBadge(user?.kyc_status || 'not_started')}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              {user?.kyc_status === 'verified' && 'Your account is fully verified'}
              {user?.kyc_status === 'pending' && 'Your verification is being reviewed'}
              {user?.kyc_status === 'rejected' && 'Verification was rejected. Please resubmit'}
              {(!user?.kyc_status || user?.kyc_status === 'not_started') && 'Complete verification to unlock all features'}
            </p>
          </div>
          {user?.kyc_status !== 'verified' && (
            <button 
              onClick={() => navigate('/verification')}
              className="btn-primary"
            >
              {user?.kyc_status === 'pending' ? 'View Status' : 'Start Verification'}
            </button>
          )}
        </div>
      </div>

      {/* Change Password Section */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Lock className="w-5 h-5 mr-2" />
          Change Password
        </h2>
        {!isChangingPassword ? (
          <div className="flex items-center justify-between">
            <p className="text-gray-700 dark:text-gray-300">
              Update your password to keep your account secure
            </p>
            <button
              onClick={() => setIsChangingPassword(true)}
              className="btn-secondary flex items-center"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Change Password
            </button>
          </div>
        ) : (
          <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Password
              </label>
              <input
                {...passwordForm.register('currentPassword')}
                type="password"
                className="input-field"
                placeholder="Enter current password"
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <input
                {...passwordForm.register('newPassword')}
                type="password"
                className="input-field"
                placeholder="Enter new password"
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm New Password
              </label>
              <input
                {...passwordForm.register('confirmPassword')}
                type="password"
                className="input-field"
                placeholder="Confirm new password"
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex items-center">
                <Save className="w-4 h-4 mr-2" />
                Update Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(false)
                  passwordForm.reset()
                }}
                className="btn-secondary flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* FAQ Section */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <HelpCircle className="w-5 h-5 mr-2" />
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqData.map((faq, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="font-medium text-gray-900 dark:text-gray-100 text-left">{faq.question}</span>
                {expandedFaq === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                )}
              </button>
              {expandedFaq === index && (
                <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-gray-700 dark:text-gray-300">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* About Us Section */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Info className="w-5 h-5 mr-2" />
          About Us
        </h2>
        <div className="text-gray-700 dark:text-gray-300 space-y-4">
          <p className="font-semibold text-gray-900 dark:text-gray-100">
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
          <p>
            At BenGo, we're building more than a financial app. We're building a trusted companion for modern life.
          </p>
          <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 italic pt-2 border-t border-gray-200 dark:border-gray-700">
            BenGo, Built for life on the go
          </p>
        </div>
      </div>

      {/* Contact Us Section */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <MessageCircle className="w-5 h-5 mr-2" />
          Contact Us
        </h2>
        <div className="space-y-3 text-gray-700 dark:text-gray-300">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Email</p>
              <p className="text-sm">support@bengo.com</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Phone</p>
              <p className="text-sm">+234 800 123 4567</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Business Hours</p>
              <p className="text-sm">Monday - Friday: 9:00 AM - 6:00 PM WAT</p>
              <p className="text-sm">Saturday: 10:00 AM - 4:00 PM WAT</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Chat Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Chat with Live Agent
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get instant support or connect with a live agent
            </p>
          </div>
          <button
            onClick={() => navigate('/chat')}
            className="btn-primary flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Start Chat
          </button>
        </div>
      </div>

      {/* Logout Section - Last */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center">
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sign out of your account
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="btn-primary flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

