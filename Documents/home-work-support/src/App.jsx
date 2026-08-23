import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { useAuth } from './auth/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import AdminPanel from './pages/AdminPanel'
import HomeworkSupportPage from './pages/HomeworkSupportPage'
import LoginPage from './pages/LoginPage'
import './App.css'
import HomeworkSupportTimeSelection from './pages/HomeworkSupportTimeSelection'
import HomeworkSupportInvitation from './pages/HomeworkSupportInvitation'
import HomeworkSupportConfirmation from './pages/HomeworkSupportConfirmation'
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

          {/* Public Homework Support Parent Form */}
          <Route
            path="/homework-support"
            element={<HomeworkSupportPage />}
          />

          {/* Protected Admin Area */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/AdminPanel"
              element={<AdminPanelRoute />}
            />
          </Route>
          <Route
            path="/homework-support/invitation"
            element={<HomeworkSupportInvitation />}
          />
          <Route
            path="/homework-support/time-selection"
            element={<HomeworkSupportTimeSelection />}
          />
          <Route
          path="/homework-support/confirmation"
          element={<HomeworkSupportConfirmation />}
        />
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App