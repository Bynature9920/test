import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Sun, Moon, ArrowLeft } from 'lucide-react'
import { authService } from '@/services/api/authService'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    try {
      await authService.forgotPassword(data.email)
      setEmailSent(true)
      toast.success('Password reset email sent! Check your inbox.')
    } catch (error: any) {
      // Always show success message for security (don't reveal if email exists)
      setEmailSent(true)
      toast.success('If the email exists, a password reset link has been sent.')
    } finally {
      setIsLoading(false)
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
        <Link
          to="/login"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to login
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">BenGo - Forgot Password</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {emailSent ? (
          <div className="text-center">
            <div className="mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30">
                <svg
                  className="h-6 w-6 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Check your email
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We've sent a password reset link to your email address. Please check your inbox and
              follow the instructions to reset your password.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              The link will expire in 1 hour.
            </p>
            <Link
              to="/login"
              className="inline-block text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-500 font-medium"
            >
              Back to login
            </Link>
          </div>
        ) : (
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

