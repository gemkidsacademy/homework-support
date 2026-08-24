import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './HomeworkSupportInvitation.css'

const API_BASE_URL = import.meta.env.VITE_API_URL?.trim() || ''

function HomeworkSupportInvitation() {
  const { state } = useLocation()
  const navigate = useNavigate()

  const studentName = state?.student_name || ''
  const weekNumber = state?.week_number || ''
  const sessionDate = state?.session_date || ''
  const parentEmail = state?.parent_email || ''

  const [response, setResponse] = useState(null)
  const [submissionState, setSubmissionState] = useState('idle')
  const [submissionError, setSubmissionError] = useState('')

  const handleResponse = (willAttend) => {
    setResponse(willAttend)
    setSubmissionError('')
  }

  const handleYesResponse = async () => {
    setSubmissionState('submitting')
    setSubmissionError('')

    try {
      const apiResponse = await fetch(
        `${API_BASE_URL}/homework-support/parent/time-slots`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            parent_email: parentEmail,
          }),
        }
      )

      const data = await apiResponse.json()

      if (!apiResponse.ok) {
        console.error('Homework Support time-slots API error:', {
          status: apiResponse.status,
          response: data,
        })

        throw new Error(
          typeof data?.detail === 'string'
            ? data.detail
            : JSON.stringify(data?.detail) ||
              'Unable to load available time slots.'
        )
      }

      navigate('/homework-support/time-selection', {
        state: data,
      })

    } catch (error) {
      setSubmissionState('error')
      setSubmissionError(
        error.message ||
        'Unable to load available time slots.'
      )
    }
  }

  const handleSubmitResponse = async () => {
    setSubmissionState('submitting')
    setSubmissionError('')

    try {
      const apiResponse = await fetch(
        `${API_BASE_URL}/homework-support/parent/response`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            parent_email: parentEmail,
            response: 'NOT_ATTENDING',
          }),
        }
      )

      const data = await apiResponse.json()

      if (!apiResponse.ok) {
        console.error('Homework Support API error:', {
          status: apiResponse.status,
          response: data,
        })

        throw new Error(
          typeof data?.detail === 'string'
            ? data.detail
            : JSON.stringify(data?.detail) ||
              'Unable to submit your response. Please try again.'
        )
      }

      setSubmissionState('success')

    } catch (error) {
      setSubmissionState('error')
      setSubmissionError(
        error.message ||
        'Unable to submit your response. Please try again.'
      )
    }
  }

  if (response === false) {
    return (
      <div className="homework-invitation-page">
        <div className="homework-invitation-card">

          <h1>Not Attending</h1>

          <div className="homework-not-attending-message">
            <p>
              Thank you for letting us know.
            </p>

            <p>
              You have indicated that {studentName} will not
              attend Homework Support this week.
            </p>
          </div>

          <button
            type="button"
            className="homework-submit-response-button"
            onClick={handleSubmitResponse}
            disabled={submissionState === 'submitting'}
          >
            {submissionState === 'submitting'
              ? 'Submitting...'
              : 'Submit Response'}
          </button>

          {submissionState === 'error' && (
            <p className="homework-response-error" role="alert">
              {submissionError}
            </p>
          )}

          {submissionState === 'success' && (
            <p className="homework-response-success" role="status">
              Your response was submitted successfully.
            </p>
          )}

        </div>
      </div>
    )
  }

  return (
    <div className="homework-invitation-page">
      <div className="homework-invitation-card">

        <h1>Homework Support</h1>

        <div className="homework-invitation-details">
          <strong>
            Homework Support — Week {weekNumber}
          </strong>

          {sessionDate && (
            <span>
              {sessionDate}
            </span>
          )}

          <span>
            Student: {studentName}
          </span>
        </div>

        <h2>
          Will {studentName} be attending Homework Support?
        </h2>

        <div className="homework-response-buttons">

          <button
            type="button"
            className="homework-attend-button"
            onClick={handleYesResponse}
            disabled={submissionState === 'submitting'}
          >
            {submissionState === 'submitting'
              ? 'Loading...'
              : 'Yes, my child will attend'}
          </button>

          <button
            type="button"
            className="homework-not-attend-button"
            onClick={() => handleResponse(false)}
            disabled={submissionState === 'submitting'}
          >
            No, my child will not attend
          </button>

        </div>

        {submissionState === 'error' && (
          <p className="homework-response-error" role="alert">
            {submissionError}
          </p>
        )}

        <button
          type="button"
          className="homework-change-response"
        >
          Already responded? View or change response
        </button>

      </div>
    </div>
  )
}

export default HomeworkSupportInvitation