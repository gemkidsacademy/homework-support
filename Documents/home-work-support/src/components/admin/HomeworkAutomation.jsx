import { useEffect, useState } from 'react'
import { getHomeworkAutomation, updateHomeworkAutomation } from '../../services/homeworkAutomationService'

function getAutomationSettings(automation) {
  return {
    enabled: automation.enabled,
    invitation_day: automation.invitation_day,
    invitation_time: automation.invitation_time,
  }
}

function HomeworkAutomation({ loggedInUser }) {
  const [automation, setAutomation] = useState(null)
  const [savedSettings, setSavedSettings] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let isCurrent = true

    async function loadAutomation() {
      setIsLoading(true)
      setError('')

      try {
        const loadedAutomation = await getHomeworkAutomation(loggedInUser)
        if (isCurrent) {
          setAutomation(loadedAutomation)
          setSavedSettings(loadedAutomation ? getAutomationSettings(loadedAutomation) : null)
        }
      } catch (loadError) {
        if (isCurrent) setError(loadError.message)
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    loadAutomation()

    return () => {
      isCurrent = false
    }
  }, [loggedInUser])

  function updateField(field, value) {
    setAutomation((currentAutomation) => ({ ...currentAutomation, [field]: value }))
    setSaved(false)
  }

  async function saveAutomation(event) {
    event.preventDefault()
    setIsSaving(true)
    setSaved(false)
    setError('')

    try {
      const savedAutomation = await updateHomeworkAutomation(loggedInUser, automation)
      setAutomation(savedAutomation)
      setSavedSettings(getAutomationSettings(savedAutomation))
      setSaved(true)
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <section className="homework-automation" role="status">Loading automation data...</section>
  }

  if (error && !automation) {
    return <section className="homework-automation"><p className="homework-notice" role="alert">Unable to load automation data: {error}</p></section>
  }

  if (!automation) {
    return <section className="homework-automation"><p className="homework-notice">No automation configuration found.</p></section>
  }

  const hasUnsavedChanges = JSON.stringify(getAutomationSettings(automation)) !== JSON.stringify(savedSettings)

  return (
    <form className="homework-automation" onSubmit={saveAutomation}>
      <section className="automation-card" aria-labelledby="invitations-title">
        <h3 id="invitations-title">Automatic Parent Invitations</h3>
        <label className="automation-toggle">
          <input type="checkbox" checked={automation.enabled} onChange={(event) => updateField('enabled', event.target.checked)} />
          <span>Enable automatic invitations</span>
          <strong>{automation.enabled ? 'ON' : 'OFF'}</strong>
        </label>
        <div className="automation-form-grid">
          <label>
            <span>Invitation day</span>
            <select value={automation.invitation_day} onChange={(event) => updateField('invitation_day', event.target.value)}>
              <option>Monday</option>
              <option>Tuesday</option>
              <option>Wednesday</option>
              <option>Thursday</option>
              <option>Friday</option>
              <option>Sunday</option>
              <option>Saturday</option>
            </select>
          </label>
          <label>
            <span>Invitation time</span>
            <input
              type="time"
              value={automation.invitation_time}
              onChange={(event) =>
                updateField('invitation_time', event.target.value)
              }
            />
          </label>
        </div>
        <p className="homework-notice">Invitation day and time are configurable by the administrator.</p>
      </section>

      <section className="automation-card" aria-labelledby="schedule-title">
        <h3 id="schedule-title">Homework Support Email Schedule</h3>
        <p className="automation-description">These are the Homework Support weeks selected in Configuration.</p>
        <p className="automation-term">{automation.term}</p>
        <div className="automation-schedule">
          {automation.schedules.map((row) => (
            <article className="automation-row" key={row.week}>
              <strong>{row.week}</strong>

              <span>{row.session}</span>

              <span>
                Invitation: {row.invitation}
              </span>

              <span
                className={`automation-status ${row.status
                  .toLowerCase()
                  .replace(' ', '-')}`}
              >
                Email status: <b>{row.status}</b>
              </span>
            </article>
          ))}

          {automation.schedules.length === 0 && (
            <p className="homework-empty">
              No weeks selected in configuration currently.
            </p>
          )}
        </div>
      </section>

      

      <div className="configuration-footer">
        <button className="homework-primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Saving Automation...' : 'Save Automation'}</button>
        {saved && <span role="status">Automation saved.</span>}
        {hasUnsavedChanges && <span role="status">Changes will take effect after you click Save Automation.</span>}
        {error && <span className="login-error" role="alert">Unable to save automation: {error}</span>}
      </div>
    </form>
  )
}

export default HomeworkAutomation
