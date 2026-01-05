import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { LogOut, Sun, Moon, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Header() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-white dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-slate-700/50 fixed top-0 left-0 right-0 z-50">
      <div className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-primary-500 dark:text-primary-400">BenGo</h1>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all cursor-pointer active:scale-95 shadow-sm"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-gray-700 dark:text-slate-300" />
            ) : (
              <Sun className="w-5 h-5 text-gray-700 dark:text-slate-300" />
            )}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Profile Settings"
          >
            <Settings className="w-4 h-4" />
            Profile
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

