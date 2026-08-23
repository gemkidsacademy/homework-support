import { useLocation } from 'react-router-dom'
import './HomeworkSupportConfirmation.css'

function HomeworkSupportConfirmation() {
  const { state } = useLocation()

  const studentName = state?.student_name || ''
  const weekNumber = state?.week_number || ''
  const sessionDate = state?.session_date || ''
  const selectedSlot = state?.selected_time_slot

  return (
    <div className="homework-confirmation-page">
      <div className="homework-confirmation-card">

        <h1>Booking Confirmed</h1>

        <p className="homework-confirmation-thank-you">
          Thank you. Your Homework Support booking has been confirmed.
        </p>

        <div className="homework-confirmation-details">

          <strong>
            Homework Support — Week {weekNumber}
          </strong>

          <span>
            {sessionDate}
          </span>

          <span>
            Student: {studentName}
          </span>

          {selectedSlot && (
            <span>
              Time: {selectedSlot.start_time} - {selectedSlot.end_time}
            </span>
          )}

        </div>

        <p className="homework-confirmation-message">
          We look forward to seeing {studentName} at Homework Support.
        </p>

      </div>
    </div>
  )
}

export default HomeworkSupportConfirmation