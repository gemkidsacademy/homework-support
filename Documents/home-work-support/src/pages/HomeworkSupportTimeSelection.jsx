import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './HomeworkSupportTimeSelection.css'

function HomeworkSupportTimeSelection() {
  const { state } = useLocation()
  const navigate = useNavigate()

  const studentName = state?.student_name || ''
  const weekNumber = state?.week_number || ''
  const sessionDate = state?.session_date || ''
  const parentEmail = state?.parent_email || ''

  const slots = state?.time_slots || []

  const [selectedSlotId, setSelectedSlotId] = useState(null)
  const [submissionState, setSubmissionState] = useState('idle')
  const [submissionError, setSubmissionError] = useState('')

  const handleSlotSelect = (slot) => {
    if (slot.available_places <= 0) {
      return
    }

    setSelectedSlotId(slot.id)
    setSubmissionError('')
  }

  const handleConfirmBooking = async () => {
    if (!selectedSlotId) {
      return
    }

    setSubmissionState('submitting')
    setSubmissionError('')

    try {
      const apiResponse = await fetch(
        'http://localhost:8000/homework-support/parent/response',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            parent_email: parentEmail,
            response: 'ATTENDING',
            selected_time_slot_id: selectedSlotId,
          }),
        }
      )

      const data = await apiResponse.json()

      if (!apiResponse.ok) {
        console.error(
          'Homework Support booking API error:',
          {
            status: apiResponse.status,
            response: data,
          }
        )

        throw new Error(
          typeof data?.detail === 'string'
            ? data.detail
            : JSON.stringify(data?.detail) ||
              'Unable to confirm your booking.'
        )
      }

      setSubmissionState('success')

      const selectedSlot = slots.find(
        (slot) => slot.id === selectedSlotId
      )

      navigate('/homework-support/confirmation', {
        state: {
          ...state,
          student_name: studentName,
          week_number: weekNumber,
          session_date: sessionDate,
          parent_email: parentEmail,
          selected_time_slot: selectedSlot,
        },
      })

    } catch (error) {
      setSubmissionState('error')
      setSubmissionError(
        error.message ||
        'Unable to confirm your booking.'
      )
    }
  }

  return (
    <div className="homework-time-page">
      <div className="homework-time-card">

        <h1>Select a time</h1>

        <p className="homework-time-instruction">
          Please select a Homework Support time.
        </p>

        <div className="homework-time-date">
          <strong>Saturday:</strong>

          <span>
            {sessionDate}
          </span>
        </div>

        <div className="homework-time-slots">

          {slots.length === 0 ? (
            <p className="homework-no-slots">
              No Homework Support times are currently available.
            </p>
          ) : (
            slots.map((slot) => {
              const isFull = slot.available_places <= 0
              const isSelected = selectedSlotId === slot.id

              return (
                <button
                  key={slot.id}
                  type="button"
                  className={`homework-time-slot ${
                    isSelected
                      ? 'selected'
                      : ''
                  } ${
                    isFull
                      ? 'full'
                      : ''
                  }`}
                  disabled={
                    isFull ||
                    submissionState === 'submitting'
                  }
                  onClick={() => handleSlotSelect(slot)}
                >
                  <span className="homework-slot-time">
                    {slot.start_time} - {slot.end_time}
                  </span>

                  <span
                    className={`homework-slot-capacity ${
                      isFull
                        ? 'full-text'
                        : ''
                    }`}
                  >
                    {isFull
                      ? 'FULL'
                      : `${slot.available_places} ${
                          slot.available_places === 1
                            ? 'place'
                            : 'places'
                        } available`}
                  </span>
                </button>
              )
            })
          )}

        </div>

        {submissionState === 'error' && (
          <p
            className="homework-response-error"
            role="alert"
          >
            {submissionError}
          </p>
        )}

        <button
          type="button"
          className="homework-confirm-button"
          disabled={
            !selectedSlotId ||
            submissionState === 'submitting'
          }
          onClick={handleConfirmBooking}
        >
          {submissionState === 'submitting'
            ? 'Confirming...'
            : 'Confirm Booking'}
        </button>

      </div>
    </div>
  )
}

export default HomeworkSupportTimeSelection