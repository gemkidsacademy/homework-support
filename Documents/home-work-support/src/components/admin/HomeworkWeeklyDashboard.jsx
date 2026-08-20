import { useState } from 'react'

const initialStudents = [
  { id: 1, name: 'Ava Johnson', status: 'Attending', slot: '9:00 AM - 9:30 AM' },
  { id: 2, name: 'Noah Williams', status: 'Not Attending', slot: '-' },
  { id: 3, name: 'Mia Brown', status: 'No Response', slot: '-' },
]

function HomeworkWeeklyDashboard() {
  const [students, setStudents] = useState(initialStudents)
  const [notice, setNotice] = useState('')

  const summary = [
    ['Total Students', students.length, 'Registered for this week', 'total'],
    ['Attending', students.filter((student) => student.status === 'Attending').length, 'Confirmed attendance', 'attending'],
    ['Not Attending', students.filter((student) => student.status === 'Not Attending').length, 'Declined attendance', 'declined'],
    ['No Response', students.filter((student) => student.status === 'No Response').length, 'Awaiting response', 'pending'],
  ]

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
            <p>Saturday, August 29, 2026</p>
          </div>
          <button className="homework-secondary-button" type="button" onClick={() => showNotice('Capacity editor is ready for backend integration.')}>Edit Capacity</button>
        </div>
        <div className="capacity-list">
          <div className="capacity-row"><strong>9:00 AM - 9:30 AM</strong><span>8 / 12 booked</span><div className="capacity-track"><i style={{ width: '67%' }} /></div><button className="homework-secondary-button" type="button" onClick={() => showNotice('Slot closed for this demo.')}>Close Slot</button></div>
          <div className="capacity-row"><strong>9:30 AM - 10:00 AM</strong><span>12 / 12 booked</span><div className="capacity-track full"><i style={{ width: '100%' }} /></div><button className="homework-secondary-button" type="button" onClick={() => showNotice('Slot reopened for this demo.')}>Reopen Slot</button></div>
          <div className="capacity-row"><strong>10:00 AM - 10:30 AM</strong><span>4 / 12 booked</span><div className="capacity-track"><i style={{ width: '34%' }} /></div><button className="homework-secondary-button" type="button" onClick={() => showNotice('Slot closed for this demo.')}>Close Slot</button></div>
        </div>
      </section>

      <section className="weekly-panel" aria-labelledby="responses-title">
        <div className="weekly-panel-heading">
          <div>
            <h3 id="responses-title">Student Responses</h3>
            <p>Parent attendance responses for this week</p>
          </div>
          <button className="homework-primary-button" type="button" onClick={() => showNotice('Add Student form is ready for backend integration.')}>Add Student</button>
        </div>
        <div className="response-table-wrap">
          <table className="response-table">
            <thead><tr><th>Student</th><th>Response</th><th>Time Slot</th><th>Actions</th></tr></thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td><strong>{student.name}</strong></td>
                  <td><span className={`response-status ${student.status.toLowerCase().replace(' ', '-')}`}>{student.status}</span></td>
                  <td>{student.slot}</td>
                  <td>
                    <div className="response-actions">
                      <button type="button" onClick={() => showNotice('Slot change is ready for backend integration.')}>Change Slot</button>
                      <button type="button" onClick={() => markNotAttending(student.id)}>Mark Not Attending</button>
                      <button type="button" onClick={() => showNotice('Email resent for this demo.')}>Resend Email</button>
                      <button type="button" onClick={() => removeStudent(student.id)}>Cancel Booking</button>
                    </div>
                  </td>
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
