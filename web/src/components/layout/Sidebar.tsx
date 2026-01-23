import { NavLink } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Send,
  Coins,
  CreditCard,
  Banknote,
  Plane,
  Shield,
  X,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Payments', href: '/payments', icon: Send },
  { name: 'Crypto', href: '/crypto', icon: Coins },
  { name: 'Cards', href: '/cards', icon: CreditCard },
  { name: 'Loans', href: '/loans', icon: Banknote },
  { name: 'Travel', href: '/travel', icon: Plane },
]

export default function Sidebar() {
  const { user } = useAuth()
  const isAdmin = user?.email === 'admin@bengo.com' || user?.email === 'emzzygee000@gmail.com'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Listen for mobile menu toggle event
  useEffect(() => {
    const handleToggle = () => setIsMobileMenuOpen(prev => !prev)
    window.addEventListener('toggleMobileMenu', handleToggle)
    return () => window.removeEventListener('toggleMobileMenu', handleToggle)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [window.location.pathname])

  return (
    <>
      {/* Mobile menu backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-slate-900/80 backdrop-blur-md border-r border-gray-200 dark:border-slate-700/50 overflow-y-auto z-50 transition-transform duration-300 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 font-medium shadow-sm'
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                }`
              }
            >
              <Icon className="w-5 h-5 stroke-current" />
              <span className="text-inherit">{item.name}</span>
            </NavLink>
          )
        })}
        
        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="border-t border-gray-200 dark:border-slate-700 my-2"></div>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 font-medium shadow-sm'
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                }`
              }
            >
              <Shield className="w-5 h-5 stroke-current" />
              <span className="text-inherit">Admin Panel</span>
            </NavLink>
          </>
        )}
      </nav>
    </aside>
    </>
  )
}

