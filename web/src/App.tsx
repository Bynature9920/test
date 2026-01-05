import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AppRouter from './routes/AppRouter'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
          <Toaster position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

