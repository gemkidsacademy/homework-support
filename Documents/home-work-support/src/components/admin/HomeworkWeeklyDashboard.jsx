import { useEffect, useState } from 'react'

function HomeworkWeeklyDashboard({ loggedInUser }) {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [studentFilter, setStudentFilter] = useState('ALL')

  const centerCode = loggedInUser?.center_code

  useEffect(() => {
    let isCurrent = true

    async function loadDashboard() {
      if (!centerCode) {
        setLoading(false)
        setError('Unable to load the weekly dashboard because no center is configured.')
        return
      }

      setLoading(true)
      setError('')

      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL?.trim() || ''

        const response = await fetch(
          `${API_BASE_URL}/homework-support/admin/responses?center_code=${encodeURIComponent(centerCode)}`
        )
        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            typeof data?.detail === 'string'
              ? data.detail
              : 'Unable to load the weekly dashboard.'
          )
        }

        if (isCurrent) {
          setDashboardData(data)
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(loadError.message || 'Unable to load the weekly dashboard.')
        }
      } finally {
        if (isCurrent) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      isCurrent = false
    }
  }, [centerCode])

  if (loading) {
    return <p className="weekly-notice" role="status">Loading weekly dashboard...</p>
  }

  if (error) {
    return <p className="weekly-notice weekly-error" role="alert">{error}</p>
  }

  const students = dashboardData?.students || []
  const visibleStudents = studentFilter === 'ALL'
    ? students
    : students.filter((student) => student.response === studentFilter)
  const slots = dashboardData?.slots || []
  const summaryData = dashboardData?.summary || {}
  const summary = [
    ['Total Students', summaryData.total_students, 'Registered for this week', 'total'],
    ['Attending', summaryData.attending, 'Confirmed attendance', 'attending'],
    ['Not Attending', summaryData.not_attending, 'Declined attendance', 'declined'],
    ['No Response', summaryData.no_response, 'Awaiting response', 'pending'],
  ]

  function formatResponse(response) {
    return response
      .toLowerCase()
      .replace('_', ' ')
      .replace(/\b\w/g, (character) => character.toUpperCase())
  }

  function showNotice(message) {
    setNotice(message)
  }

  function markNotAttending(studentId) {
    setStudents((currentStudents) => currentStudents.map((student) => (
      student.id === studentId ? { ...student, status: 'Not Attending', slot: '-' } : student
    )))
    showNotice('Student marked as not attending.')
  }

  function removeStudent(studentId) {
    setStudents((currentStudents) => currentStudents.filter((student) => student.id !== studentId))
    showNotice('Student removed from this week.')
  }

  return (
    <section className="weekly-dashboard" aria-labelledby="weekly-dashboard-title">
      <div className="weekly-summary-grid" aria-label="Weekly attendance summary">
        {summary.map(([label, value, description, tone]) => (
          <article className={`weekly-summary-card ${tone}`} key={label}>
            <p>{label}</p>
            <strong>{value}</strong>
            <span>{description}</span>
          </article>
        ))}
      </div>

      <section className="weekly-panel" aria-labelledby="capacity-title">
        <div className="weekly-panel-heading">
          <div>
            <h3 id="capacity-title">Slot Capacity Status</h3>
            <p>{dashboardData.session_date}</p>
          </div>
        </div>
        <div className="capacity-list">
          {slots.map((slot) => {
            const progress = slot.capacity
              ? Math.min((slot.booked / slot.capacity) * 100, 100)
              : 0

            return (
              <div className="capacity-row" key={slot.id}>
                <strong>{slot.start_time} - {slot.end_time}</strong>
                <span>{slot.booked} / {slot.capacity} booked</span>
                <div className={`capacity-track${slot.is_full ? ' full' : ''}`}>
                  <i style={{ width: `${progress}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="weekly-panel" aria-labelledby="responses-title">
        <div className="weekly-panel-heading">
          <div>
            <h3 id="responses-title">Student Responses</h3>
            <p>Parent attendance responses for this week</p>
          </div>
          <div className="response-heading-actions">
            <label className="sr-only" htmlFor="student-response-filter">Filter students by response</label>
            <select
              id="student-response-filter"
              className="response-filter"
              value={studentFilter}
              onChange={(event) => setStudentFilter(event.target.value)}
            >
              <option value="ALL">All Students</option>
              <option value="ATTENDING">Attending</option>
              <option value="NOT_ATTENDING">Not Attending</option>
              <option value="NO_RESPONSE">No Response</option>
            </select>
            
          </div>
        </div>
        <div className="response-table-wrap">
          <table className="response-table">
            <thead><tr><th>Student</th><th>Response</th><th>Time Slot</th></tr></thead>
            <tbody>
              {visibleStudents.map((student) => (
                <tr key={student.student_id}>
                  <td><strong>{student.student_name}</strong></td>
                  <td><span className={`response-status ${student.response.toLowerCase().replace('_', '-')}`}>{formatResponse(student.response)}</span></td>
                  <td>{student.time_slot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {notice && <p className="weekly-notice" role="status">{notice}</p>}
    </section>
  )
}

export default HomeworkWeeklyDashboard
