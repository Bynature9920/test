import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Header() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const toggleMobileMenu = () => {
    window.dispatchEvent(new CustomEvent('toggleMobileMenu'))
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U'
    const firstInitial = user.first_name?.[0] || ''
    const lastInitial = user.last_name?.[0] || ''
    return (firstInitial + lastInitial).toUpperCase() || 'U'
  }

  return (
    <header className="bg-white dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-slate-700/50 fixed top-0 left-0 right-0 z-50">
      <div className="px-4 sm:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMobileMenu}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 text-gray-700 dark:text-slate-300" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-primary-500 dark:text-primary-400">BenGo</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Profile Avatar */}
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold text-sm transition-all active:scale-95 shadow-md hover:shadow-lg"
            title="Profile Settings"
            aria-label="Open profile settings"
          >
            {getUserInitials()}
          </button>
        </div>
      </div>
    </header>
  )
}
