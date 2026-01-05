import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Wallet,
  Send,
  Coins,
  CreditCard,
  Banknote,
  Plane,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Wallet', href: '/wallet', icon: Wallet },
  { name: 'Payments', href: '/payments', icon: Send },
  { name: 'Crypto', href: '/crypto', icon: Coins },
  { name: 'Cards', href: '/cards', icon: CreditCard },
  { name: 'Loans', href: '/loans', icon: Banknote },
  { name: 'Travel', href: '/travel', icon: Plane },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-slate-900/80 backdrop-blur-md border-r border-gray-200 dark:border-slate-700/50 overflow-y-auto z-40">
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
      </nav>
    </aside>
  )
}

