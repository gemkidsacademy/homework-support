import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { adminLogin } from '../auth/authService'

function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [isInputActive, setIsInputActive] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const enteredStudentId = studentId.trim()

    if (!enteredStudentId || !password) {
      setError('Enter your Student ID and password to continue.')
      return
    }

    setIsSubmitting(true)
    try {
      const authenticatedUser = await adminLogin(enteredStudentId, password)
      signIn(authenticatedUser)
      navigate('/AdminPanel', { replace: true })
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-content">
        <img
          className="academy-logo"
          src="https://gemkidsacademy.com.au/wp-content/uploads/2024/10/cropped-logo-4-1.png"
          alt="Gem Kids Academy"
        />

        <section className="login-card" aria-labelledby="login-title">
          <h1 id="login-title">Login with ID</h1>
          <form onSubmit={handleSubmit} autoComplete="off" noValidate>
            <label className="sr-only" htmlFor="student-id">Student ID</label>
            <input
              id="student-id"
              name="studentId"
              type="text"
              placeholder="Student ID"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              onFocus={() => setIsInputActive(true)}
              autoComplete="new-password"
              readOnly={!isInputActive}
            />
            <label className="sr-only" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onFocus={() => setIsInputActive(true)}
              autoComplete="new-password"
              readOnly={!isInputActive}
            />
            {error && <p className="login-error" role="alert">{error}</p>}
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}

export default LoginPage
