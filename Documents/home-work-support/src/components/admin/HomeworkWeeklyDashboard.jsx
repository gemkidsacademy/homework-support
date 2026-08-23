import { useEffect, useRef, useState } from 'react'

function HomeworkWeeklyDashboard({ loggedInUser }) {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [studentFilter, setStudentFilter] = useState('ALL')
  const [weeks, setWeeks] = useState([])
  const [selectedWeek, setSelectedWeek] = useState(null)
  const weeksLoaded = useRef(false)

  const centerCode = loggedInUser?.center_code

  // Load available weeks
  useEffect(() => {
    let isCurrent = true

    async function loadWeeks() {
      if (!centerCode) {
        setError('Unable to load the weekly dashboard because no center is configured.')
        setLoading(false)
        return
      }

      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL?.trim() || ''

        const response = await fetch(
          `${API_BASE_URL}/homework-support/admin/weeks?center_code=${encodeURIComponent(centerCode)}`
        )
        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            typeof data?.detail === 'string'
              ? data.detail
              : 'Unable to load available weeks.'
          )
        }

        if (isCurrent) {
          setWeeks(data.weeks || [])
          setSelectedWeek(data.current_week_number)
          weeksLoaded.current = true
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(loadError.message || 'Unable to load available weeks.')
          setLoading(false)
        }
      }
    }

    loadWeeks()

    return () => {
      isCurrent = false
    }
  }, [centerCode])

  // Load dashboard data based on selected week
  useEffect(() => {
    let isCurrent = true

    async function loadDashboard() {
      if (!centerCode || selectedWeek === null) {
        return
      }

      setLoading(true)
      setError('')

      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL?.trim() || ''

        const params = new URLSearchParams({
          center_code: centerCode,
          week_number: String(selectedWeek),
        })

        const response = await fetch(
          `${API_BASE_URL}/homework-support/admin/responses?${params.toString()}`
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
  }, [centerCode, selectedWeek])

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
    ['Total Students', summaryData.total_students, `Registered for Week ${dashboardData?.week_number}`, 'total'],
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
      <div className="weekly-week-selector">
        <label htmlFor="weekly-dashboard-week">
          Week
        </label>
        <select
          id="weekly-dashboard-week"
          value={selectedWeek || ''}
          onChange={(event) => {
            setSelectedWeek(Number(event.target.value))
            setStudentFilter('ALL')
          }}
          disabled={weeks.length === 0}
        >
          {weeks.map((week) => (
            <option
              key={week.week_number}
              value={week.week_number}
            >
              {week.week_label}
              {week.is_current ? ' - Current' : ''}
            </option>
          ))}
        </select>
      </div>

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
            <p>
              Parent attendance responses for Week {dashboardData?.week_number}
            </p>
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
