import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Sun, Moon, Loader2 } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loginWithGoogle } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)

  // Initialize Google Identity Services on mount
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      console.warn('Google Client ID not configured')
      return
    }

    const checkGoogle = () => {
      if (typeof window !== 'undefined' && window.google && window.google.accounts) {
        try {
          console.log('Initializing Google Identity Services with Client ID:', clientId)
          console.log('Current origin:', window.location.origin)
          
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: { credential: string }) => {
              try {
                setIsGoogleLoading(true)
                console.log('✅ Google ID token received, sending to backend...')
                console.log('Token length:', response.credential.length)
                await loginWithGoogle(response.credential)
                toast.success('Login successful!')
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
            // Use popup mode but disable FedCM
            ux_mode: 'popup',
            use_fedcm_for_prompt: false,
          })
          console.log('Google Identity Services initialized successfully')
          setGoogleReady(true)
        } catch (error) {
          console.error('Error initializing Google Identity Services:', error)
          toast.error('Failed to initialize Google sign-in. Check console for details.')
        }
      } else {
        // Retry after a short delay
        setTimeout(checkGoogle, 100)
      }
    }

    // Start checking after a brief delay to allow script to load
    const timer = setTimeout(checkGoogle, 500)
    return () => clearTimeout(timer)
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
    try {
      // For demo credentials, login should never throw an error
      await login(data.email, data.password)
      toast.success('Login successful!')
      // Small delay to ensure state is updated
      setTimeout(() => {
        navigate('/dashboard')
      }, 100)
    } catch (error: any) {
      // Only show error if login actually failed (not for demo credentials)
      const errorMessage = error?.response?.data?.error || error?.message || 'Login failed. Please check your credentials.'
      toast.error(errorMessage)
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      toast.error('Google sign-in is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.')
      return
    }

    if (!googleReady) {
      toast.error('Google sign-in is still loading. Please wait a moment and try again.')
      return
    }

    setIsGoogleLoading(true)

    try {
      console.log('🔵 Triggering Google sign-in with One Tap...')
      console.log('Client ID:', clientId.substring(0, 30) + '...')
      console.log('Origin:', window.location.origin)
      
      // Disable FedCM and use traditional popup
      window.google!.accounts.id.prompt((notification: any) => {
        console.log('Prompt notification:', notification)
        
        if (notification.isNotDisplayed()) {
          const reasons = notification.getNotDisplayedReason()
          console.error('❌ Google prompt not displayed. Reason:', reasons)
          
          if (reasons === 'browser_not_supported' || reasons === 'invalid_client') {
            const setupUrl = 'https://console.cloud.google.com/apis/credentials'
            const errorMsg = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 GOOGLE OAUTH ERROR: "Cannot Continue"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your current URL is NOT authorized in Google Cloud Console.

📍 YOUR CURRENT URL: ${window.location.origin}

🔧 QUICK FIX (5 steps):

1. Open: ${setupUrl}
2. Find OAuth Client ID: ${clientId.substring(0, 30)}...
3. Click "Edit" (pencil icon)
4. In "Authorized JavaScript origins", click "+ ADD URI" and add:
   
   ${window.location.origin}
   
   Also add these:
   http://localhost:3000
   http://localhost:3001
   http://localhost:5173

5. Click "SAVE" and WAIT 5-10 MINUTES

⚠️ IMPORTANT:
- Use http:// (NOT https://)
- Use localhost (NOT 127.0.0.1)
- DO NOT add backend URL (http://localhost:8000)

After saving, close ALL browser windows, wait 5-10 minutes, and try again.

📄 See GOOGLE_OAUTH_QUICK_FIX.md for detailed step-by-step instructions.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            `
            console.error(errorMsg)
            toast.error('⚠️ Google OAuth not configured! Check console (F12) for fix.', { duration: 8000 })
            setIsGoogleLoading(false)
          } else {
            console.error('Other reason:', reasons)
            toast.error(`Google sign-in error: ${reasons}. Check console for details.`)
            setIsGoogleLoading(false)
          }
        } else if (notification.isSkippedMoment()) {
          const reasons = notification.getSkippedReason()
          console.warn('Prompt skipped:', reasons)
          // Try alternative method
          toast.info('Please select your Google account from the popup')
        } else if (notification.isDismissedMoment()) {
          const reasons = notification.getDismissedReason()
          console.warn('Prompt dismissed:', reasons)
          setIsGoogleLoading(false)
        } else {
          console.log('✅ Google prompt is showing')
        }
      })
    } catch (error: any) {
      console.error('❌ Google sign-in error:', error)
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        clientId: clientId?.substring(0, 20) + '...',
        origin: window.location.origin
      })
      toast.error('Failed to start Google sign-in. Check console (F12) for details.')
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 dark:from-primary-600 dark:to-primary-900 px-4 relative">
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
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
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
            disabled={isGoogleLoading || !googleReady}
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
          {!googleReady && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
              Loading Google sign-in...
            </p>
          )}
          
          {/* Google OAuth Setup Instructions - Always visible during development */}
          {googleReady && (
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-xs">
              <p className="text-yellow-900 dark:text-yellow-200 font-semibold mb-2">
                ⚠️ If popup shows "can't continue":
              </p>
              <div className="space-y-2 text-yellow-800 dark:text-yellow-300">
                <p><strong>✅ Step 1:</strong> Add this URL to Google Cloud Console:</p>
                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-yellow-300 dark:border-yellow-700 mb-2">
                  <code className="text-blue-600 dark:text-blue-400 font-mono font-bold">
                    {window.location.origin}
                  </code>
                </div>
                <p><strong>✅ Step 2:</strong> Configure OAuth Consent Screen:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Go to: <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-600">Consent Screen</a></li>
                  <li>If "Testing" mode: Add your email as test user</li>
                  <li>Fill in App name, support email, developer contact</li>
                  <li>Add scopes: email, profile, openid</li>
                </ul>
                <p><strong>✅ Step 3:</strong> Wait & Clear Cache:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Save changes & wait 10 minutes</li>
                  <li>Close ALL browser windows</li>
                  <li>Clear cache (Ctrl+Shift+Delete)</li>
                  <li>Try in incognito mode first</li>
                </ul>
                <p className="mt-2 text-yellow-700 dark:text-yellow-400 italic">
                  📄 See GOOGLE_OAUTH_IMMEDIATE_TROUBLESHOOTING.md for full guide
                </p>
              </div>
            </div>
          )}
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

        {/* Demo Login Info */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Demo Login:</p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Email: <span className="font-mono font-semibold">demo@fintech.com</span>
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Password: <span className="font-mono font-semibold">demo123</span>
          </p>
          <button
            type="button"
            onClick={() => {
              const emailInput = document.getElementById('email') as HTMLInputElement
              const passwordInput = document.getElementById('password') as HTMLInputElement
              if (emailInput) emailInput.value = 'demo@fintech.com'
              if (passwordInput) passwordInput.value = 'demo123'
            }}
            className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
          >
            Fill demo credentials
          </button>
        </div>
      </div>
    </div>
  )
}

