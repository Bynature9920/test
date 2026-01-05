import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Header />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-6 ml-64 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  )
}

