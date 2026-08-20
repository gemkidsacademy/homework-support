import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { useAuth } from './auth/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import AdminPanel from './pages/AdminPanel'
import LoginPage from './pages/LoginPage'
import './App.css'

function AdminPanelRoute() {
  const { user } = useAuth()

  return <AdminPanel loggedInUser={user} />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/AdminPanel" element={<AdminPanelRoute />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
