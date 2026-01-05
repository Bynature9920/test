import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Sun, Moon } from 'lucide-react'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').regex(/^[\d\s\+\-\(\)]+$/, 'Phone number contains invalid characters'),
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  country_code: z.string().default('NG'),
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerUser, loginWithGoogle } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      country_code: 'NG',
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      await registerUser(data)
      toast.success('Registration successful!')
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true)
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      if (!clientId) {
        toast.error('Google sign-up is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.')
        setIsGoogleLoading(false)
        return
      }

      // Load Google Identity Services if not already loaded
      if (typeof window === 'undefined' || !window.google) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://accounts.google.com/gsi/client'
          script.async = true
          script.defer = true
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
          document.head.appendChild(script)
        })
      }

      // Initialize Google Sign-In with ID token
      window.google!.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          try {
            await loginWithGoogle(response.credential)
            toast.success('Registration successful!')
            setTimeout(() => {
              navigate('/dashboard')
            }, 100)
          } catch (error: any) {
            toast.error(error?.message || 'Google sign-up failed')
            setIsGoogleLoading(false)
          }
        },
      })

      // Trigger the sign-in popup
      window.google!.accounts.id.prompt()
    } catch (error: any) {
      toast.error('Failed to initialize Google sign-up. Please use email/password for now.')
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 dark:from-primary-600 dark:to-primary-900 px-4 py-12 relative">
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 rounded-lg bg-white/20 dark:bg-gray-900/20 hover:bg-white/30 dark:hover:bg-gray-900/30 backdrop-blur-sm transition-colors cursor-pointer active:scale-95 z-50"
        title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5 text-white" />
        ) : (
          <Sun className="w-5 h-5 text-white" />
        )}
      </button>
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-xl p-8 border border-gray-200 dark:border-gray-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create Account</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Sign up for BenGo</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                First Name
              </label>
              <input
                {...register('first_name')}
                type="text"
                id="first_name"
                className="input-field"
                placeholder="John"
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.first_name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Last Name
              </label>
              <input
                {...register('last_name')}
                type="text"
                id="last_name"
                className="input-field"
                placeholder="Doe"
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className="input-field"
              placeholder="john@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Phone Number
            </label>
            <input
              {...register('phone')}
              type="tel"
              id="phone"
              className="input-field"
              placeholder="+2348012345678 or 08012345678"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              Nigerian phone number format: +2348012345678 or 08012345678
            </p>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Password
            </label>
            <input
              {...register('password')}
              type="password"
              id="password"
              className="input-field"
              placeholder="At least 6 characters"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading}
            className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isGoogleLoading ? 'Signing up...' : 'Sign up with Google'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-500 font-medium">
              Sign in
            </Link>
          </p>
        </div>
        
        {/* Demo Mode Info */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Demo Mode:</p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            You can sign up with any email and password. Your account will be stored locally for demo purposes.
          </p>
        </div>
      </div>
    </div>
  )
}

