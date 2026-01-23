import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

// Declare Google Identity Services types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          prompt: (callback?: (notification: any) => void) => void
        }
      }
    }
  }
}

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loginWithGoogle } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)
  const [emailError, setEmailError] = useState<string>('')
  const [passwordError, setPasswordError] = useState<string>('')

  // Initialize Google Identity Services on mount
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      console.error('❌ Google Client ID not configured. Set VITE_GOOGLE_CLIENT_ID in your .env file')
      console.error('Create a .env file in the web folder with: VITE_GOOGLE_CLIENT_ID=your-client-id-here')
      return
    }

    console.log('🔵 Initializing Google Sign-in...')
    console.log('Client ID:', clientId.substring(0, 30) + '...')
    
    const initGoogle = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: { credential: string }) => {
              try {
                setIsGoogleLoading(true)
                console.log('✅ Google ID token received, sending to backend...')
                await loginWithGoogle(response.credential)
                // Redirect silently without success toast
                setTimeout(() => {
                  navigate('/dashboard')
                }, 100)
              } catch (error: any) {
                console.error('❌ Google sign-in backend error:', error)
                const errorMessage = error?.response?.data?.detail || error?.response?.data?.error || error?.message || 'Google sign-in failed'
                toast.error(errorMessage)
                setIsGoogleLoading(false)
              }
            },
            ux_mode: 'popup',
            use_fedcm_for_prompt: false,
          })
          console.log('✅ Google Identity Services initialized')
          setGoogleReady(true)
        } catch (error) {
          console.error('❌ Error initializing Google:', error)
        }
      } else {
        console.log('⏳ Google script not ready, retrying...')
        setTimeout(initGoogle, 500)
      }
    }

    // Start initialization
    setTimeout(initGoogle, 100)
  }, [loginWithGoogle, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    // Clear previous errors
    setEmailError('')
    setPasswordError('')
    
    try {
      await login(data.email, data.password)
      // Redirect silently without success toast
      setTimeout(() => {
        navigate('/dashboard')
      }, 100)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.error || error?.message || 'Login failed. Please check your credentials.'
      
      // Set field-specific errors
      if (errorMessage === 'No existing account for this email') {
        setEmailError(errorMessage)
      } else if (errorMessage === 'Incorrect password') {
        setPasswordError(errorMessage)
      } else {
        // For other errors, use toast
        toast.error(errorMessage)
      }
      
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      toast.error('Google sign-in is not configured. Please contact support.')
      console.error('VITE_GOOGLE_CLIENT_ID environment variable is missing')
      return
    }

    // Check if Google is loaded
    if (!window.google?.accounts?.id) {
      toast.error('Google sign-in is not available. Please refresh the page.')
      console.error('Google Identity Services not loaded')
      return
    }

    setIsGoogleLoading(true)

    try {
      console.log('🔵 Triggering Google sign-in popup...')
      
      // Use the popup method directly
      window.google.accounts.id.prompt((notification: any) => {
        console.log('Prompt notification:', notification)
        
        if (notification.isNotDisplayed()) {
          console.error('❌ Google prompt not displayed:', notification.getNotDisplayedReason())
          toast.error('Google sign-in blocked. Please check your browser settings.')
          setIsGoogleLoading(false)
        } else if (notification.isSkippedMoment()) {
          console.warn('Prompt skipped:', notification.getSkippedReason())
          setIsGoogleLoading(false)
        } else if (notification.isDismissedMoment()) {
          console.warn('Prompt dismissed:', notification.getDismissedReason())
          setIsGoogleLoading(false)
        }
      })
    } catch (error: any) {
      console.error('❌ Google sign-in error:', error)
      toast.error('Failed to start Google sign-in. Please try again.')
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 dark:from-primary-600 dark:to-primary-900 px-4 relative">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-xl p-8 border border-gray-200 dark:border-gray-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">BenGo</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className="input-field"
              placeholder="Enter your email"
              onChange={(e) => {
                register('email').onChange(e)
                setEmailError('')
              }}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
            )}
            {emailError && !errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{emailError}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              {...register('password')}
              type="password"
              id="password"
              className="input-field"
              placeholder="Enter your password"
              onChange={(e) => {
                register('password').onChange(e)
                setPasswordError('')
              }}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
            )}
            {passwordError && !errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
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
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
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
                <span>Sign in with Google</span>
              </>
            )}
          </button>
          
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/forgot-password"
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-500 font-medium"
          >
            Forgot password?
          </Link>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-500 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

