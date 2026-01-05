import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Sun, Moon, ArrowLeft } from 'lucide-react'
import { authService } from '@/services/api/authService'

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { theme, toggleTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [passwordReset, setPasswordReset] = useState(false)

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      toast.error('Invalid reset link. Please request a new one.')
      navigate('/forgot-password')
    } else {
      setToken(tokenParam)
    }
  }, [searchParams, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error('Invalid reset token')
      return
    }

    setIsLoading(true)
    try {
      await authService.resetPassword(token, data.password)
      setPasswordReset(true)
      toast.success('Password reset successfully!')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to reset password'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return null
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">BenGo - Reset Password</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Enter your new password below.
          </p>
        </div>

        {passwordReset ? (
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
              Password Reset Successful
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your password has been reset successfully. You can now log in with your new password.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Redirecting to login page...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password
              </label>
              <input
                {...register('password')}
                type="password"
                id="password"
                className="input-field"
                placeholder="Enter new password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                {...register('confirmPassword')}
                type="password"
                id="confirmPassword"
                className="input-field"
                placeholder="Confirm new password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

