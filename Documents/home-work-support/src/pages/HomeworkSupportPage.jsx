import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './HomeworkSupportPage.css'

const API_BASE_URL = import.meta.env.VITE_API_URL?.trim() || ''

function HomeworkSupportPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!email.trim()) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `${API_BASE_URL}/homework-support/parent/invitation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            parent_email: email.trim(),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.detail ||
          'Unable to find Homework Support information.'
        )
      }

      navigate('/homework-support/invitation', {
        state: {
          ...data,
          parent_email: email.trim(),
        },
      })
    } catch (error) {
      setError(
        error.message ||
        'Unable to load Homework Support information.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="homework-support-page">
      <div className="homework-support-card">

        <img
          className="homework-support-logo"
          src="https://gemkidsacademy.com.au/wp-content/uploads/2024/10/cropped-logo-4-1.png"
          alt="Gem Kids Academy"
        />

        <div className="homework-support-header">
          <h1>Homework Support</h1>

          <p>
            Please enter your email address to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="parent-email">
            Parent Email
          </label>

          <input
            id="parent-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email address"
            required
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Checking...' : 'Continue'}
          </button>
        </form>

        {error && (
          <div className="homework-support-error">
            {error}
          </div>
        )}

      </div>
    </div>
  )
}

export default HomeworkSupportPage