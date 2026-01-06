import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import WalletPage from '@/pages/wallet/WalletPage'
import PaymentsPage from '@/pages/payments/PaymentsPage'
import CryptoPage from '@/pages/crypto/CryptoPage'
import CardsPage from '@/pages/cards/CardsPage'
import LoansPage from '@/pages/loans/LoansPage'
import TravelPage from '@/pages/travel/TravelPage'
import ProfilePage from '@/pages/profile/ProfilePage'
import VerificationPage from '@/pages/verification/VerificationPage'
import ChatPage from '@/pages/chat/ChatPage'
import AdminPage from '@/pages/admin/AdminPage'
import Layout from '@/components/layout/Layout'

function AppRouter() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />}
      />
      <Route
        path="/forgot-password"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <ForgotPasswordPage />}
      />
      <Route
        path="/reset-password"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <ResetPasswordPage />}
      />

      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/crypto" element={<CryptoPage />} />
                <Route path="/cards" element={<CardsPage />} />
                <Route path="/loans" element={<LoansPage />} />
                <Route path="/travel" element={<TravelPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/verification" element={<VerificationPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/" element={<Navigate to="/dashboard" />} />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  )
}

export default AppRouter

