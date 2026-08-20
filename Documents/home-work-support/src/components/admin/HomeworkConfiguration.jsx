import { useEffect, useState } from 'react'
import {
  getHomeworkConfiguration,
  getHomeworkConfigurationWeeks,
  updateHomeworkConfiguration,
} from '../../services/homeworkConfigurationService'
import {
  getDefaultSlotTimings,
  updateDefaultSlotTimings,
} from '../../services/homeworkDefaultSlotTimingService'

let localSlotId = 0

function createEmptyTimeSlot(weekNumber, timing = {}, defaultSlotIndex = null) {
  localSlotId += 1

  return {
    id: `new-${Date.now()}-${localSlotId}`,
    week_number: weekNumber,
    start_time: timing.start_time || '',
    end_time: timing.end_time || '',
    capacity: '',
    uses_default_timing: defaultSlotIndex !== null,
    default_slot_index: defaultSlotIndex,
  }
}

function createSlotsForWeek(weekNumber, defaultSlotTimings) {
  if (defaultSlotTimings.length === 0) return [createEmptyTimeSlot(weekNumber)]

  return defaultSlotTimings.map((timing, index) => createEmptyTimeSlot(weekNumber, timing, index))
}

function ensureInitialTimeSlots(selectedSessions, configuredSlots, defaultSlotTimings) {
  const selectedWeekNumbers = new Set(selectedSessions.map((session) => session.week_number))
  const validSlots = configuredSlots
    .filter((slot) => selectedWeekNumbers.has(slot.week_number))
    .map((slot) => {
      const weekSlots = configuredSlots.filter((currentSlot) => currentSlot.week_number === slot.week_number)
      const slotIndex = weekSlots.indexOf(slot)
      const defaultTiming = defaultSlotTimings[slotIndex]
      const matchesDefault = defaultTiming
        && (!slot.start_time || !slot.end_time
          || (slot.start_time === defaultTiming.start_time && slot.end_time === defaultTiming.end_time))

      return {
        ...slot,
        start_time: slot.start_time || defaultTiming?.start_time || '',
        end_time: slot.end_time || defaultTiming?.end_time || '',
        uses_default_timing: slot.uses_default_timing ?? Boolean(matchesDefault),
        default_slot_index: slot.default_slot_index ?? (matchesDefault ? slotIndex : null),
      }
    })
  const weeksWithSlots = new Set(validSlots.map((slot) => slot.week_number))
  const initialSlots = selectedSessions
    .filter((session) => !weeksWithSlots.has(session.week_number))
    .flatMap((session) => createSlotsForWeek(session.week_number, defaultSlotTimings))

  return [...validSlots, ...initialSlots]
}

function formatSessionDate(sessionDate) {
  if (!sessionDate) return 'Session date not available'

  const date = new Date(`${sessionDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return sessionDate

  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function formatTime(time) {
  if (!time) return ''
  const [hours, minutes] = time.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time

  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
}

function formatSlot(slot) {
  if (!slot.start_time || !slot.end_time) return 'Time slot not set'
  return `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`
}

function HomeworkConfiguration({ loggedInUser }) {
  const [academicTerms, setAcademicTerms] = useState([])
  const [selectedTermId, setSelectedTermId] = useState('')
  const [availableWeeks, setAvailableWeeks] = useState([])
  const [selectedWeek, setSelectedWeek] = useState('')
  const [sessions, setSessions] = useState([])
  const [slots, setSlots] = useState([])
  const [bookingCutoff, setBookingCutoff] = useState({ day: '', time: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingWeeks, setIsLoadingWeeks] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [weeksError, setWeeksError] = useState('')
  const [saved, setSaved] = useState(false)
  const [defaultSlotTimings, setDefaultSlotTimings] = useState([])
  const [isManagingDefaults, setIsManagingDefaults] = useState(false)
  const [isSavingDefaults, setIsSavingDefaults] = useState(false)
  const [defaultTimingError, setDefaultTimingError] = useState('')
  const [defaultTimingSaved, setDefaultTimingSaved] = useState(false)

  function applyConfiguration(configuration) {
    const selectedSessions = configuration.selected_sessions

    setAcademicTerms(configuration.academic_terms)
    setSelectedTermId(configuration.selected_term?.id?.toString() || '')
    setAvailableWeeks(configuration.available_weeks)
    setSessions(selectedSessions)
    setSlots(ensureInitialTimeSlots(selectedSessions, configuration.time_slots, defaultSlotTimings))
    setBookingCutoff({
      day: configuration.booking_cutoff?.day || '',
      time: configuration.booking_cutoff?.time || '',
    })
  }

  useEffect(() => {
    let isCurrent = true

    async function loadConfiguration() {
      setIsLoading(true)
      setError('')
      setSaved(false)

      try {
        const [configuration, loadedDefaultSlotTimings] = await Promise.all([
          getHomeworkConfiguration(loggedInUser),
          getDefaultSlotTimings(loggedInUser),
        ])
        if (isCurrent) {
          setDefaultSlotTimings(loadedDefaultSlotTimings)
          if (configuration) {
            const selectedSessions = configuration.selected_sessions
            setAcademicTerms(configuration.academic_terms)
            setSelectedTermId(configuration.selected_term?.id?.toString() || '')
            setAvailableWeeks(configuration.available_weeks)
            setSessions(selectedSessions)
            setSlots(ensureInitialTimeSlots(selectedSessions, configuration.time_slots, loadedDefaultSlotTimings))
            setBookingCutoff({
              day: configuration.booking_cutoff?.day || '',
              time: configuration.booking_cutoff?.time || '',
            })
          }
        }
      } catch (loadError) {
        if (isCurrent) setError(loadError.message)
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    loadConfiguration()

    return () => {
      isCurrent = false
    }
  }, [loggedInUser])

  function removeSession(sessionId) {
    setSessions((currentSessions) => currentSessions.filter((session) => session.week_number !== sessionId))
    setSlots((currentSlots) => currentSlots.filter((slot) => slot.week_number !== sessionId))
    setSaved(false)
  }

  function addSession() {
    const week = availableWeeks.find((currentWeek) => currentWeek.week_number.toString() === selectedWeek)
    if (!week || sessions.some((session) => session.week_number === week.week_number)) return
    const initialSlots = createSlotsForWeek(week.week_number, defaultSlotTimings)

    setSessions((currentSessions) => [
      ...currentSessions,
      week,
    ])
    setSlots((currentSlots) => [
      ...currentSlots,
      ...initialSlots,
    ])
    setSelectedWeek('')
    setSaved(false)
  }

  function editTimeSlot(slotId) {
    const slot = slots.find((currentSlot) => currentSlot.id === slotId)
    const startTime = window.prompt('Start time (HH:MM)', slot.start_time)
    if (startTime === null) return
    const endTime = window.prompt('End time (HH:MM)', slot.end_time)
    if (endTime === null) return

    setSlots((currentSlots) => currentSlots.map((currentSlot) => (
      currentSlot.id === slotId
        ? {
          ...currentSlot,
          start_time: startTime.trim(),
          end_time: endTime.trim(),
          uses_default_timing: false,
          default_slot_index: null,
        }
        : currentSlot
    )))
    setSaved(false)
  }

  function addTimeSlotForWeek(weekNumber) {
    const newSlot = createEmptyTimeSlot(weekNumber)

    setSlots((currentSlots) => [
      ...currentSlots,
      newSlot,
    ])
    setSaved(false)
  }

  function removeTimeSlot(slotId) {
    setSlots((currentSlots) => currentSlots.filter((slot) => slot.id !== slotId))
    setSaved(false)
  }

  function updateCapacity(slotId, capacity) {
    setSlots((currentSlots) => currentSlots.map((slot) => (
      slot.id === slotId ? { ...slot, capacity } : slot
    )))
    setSaved(false)
  }

  function updateDefaultTiming(index, field, value) {
    setDefaultSlotTimings((currentTimings) => {
      const currentTiming = currentTimings[0] || { start_time: '', end_time: '', slot_order: 1 }
      return [{ ...currentTiming, [field]: value, slot_order: 1 }]
    })
    setDefaultTimingError('')
    setDefaultTimingSaved(false)
  }

  async function saveDefaultTimings() {
    const hasIncompleteTiming = defaultSlotTimings.some((timing) => (
      !timing.start_time?.trim() || !timing.end_time?.trim()
    ))

    if (hasIncompleteTiming) {
      setDefaultTimingError('Please complete all default slot timing fields before saving.')
      return
    }

    setIsSavingDefaults(true)
    setDefaultTimingError('')
    setDefaultTimingSaved(false)

    try {
      const savedTimings = await updateDefaultSlotTimings(loggedInUser, defaultSlotTimings)
      setDefaultSlotTimings(savedTimings)
      setDefaultTimingSaved(true)
      setIsManagingDefaults(false)
      setSlots((currentSlots) => currentSlots.map((slot) => {
        if (!slot.uses_default_timing || slot.default_slot_index === null) return slot
        const timing = savedTimings[slot.default_slot_index]
        return timing
          ? { ...slot, start_time: timing.start_time, end_time: timing.end_time }
          : slot
      }))
    } catch (saveError) {
      setDefaultTimingError(saveError.message)
    } finally {
      setIsSavingDefaults(false)
    }
  }

  async function changeAcademicTerm(event) {
    const termId = event.target.value
    setSelectedTermId(termId)
    setSelectedWeek('')
    setSessions([])
    setSlots([])
    setWeeksError('')
    setSaved(false)

    if (!termId) {
      setAvailableWeeks([])
      return
    }

    setIsLoadingWeeks(true)

    try {
      const weeks = await getHomeworkConfigurationWeeks(loggedInUser, termId)
      setAvailableWeeks(weeks)
    } catch (loadError) {
      setAvailableWeeks([])
      setWeeksError(loadError.message)
    } finally {
      setIsLoadingWeeks(false)
    }
  }

  async function saveConfiguration(event) {
    event.preventDefault()
    setIsSaving(true)
    setSaved(false)
    setError('')

    const hasIncompleteSlot = slots.some((slot) => (
      !slot.week_number
      || !slot.start_time?.trim()
      || !slot.end_time?.trim()
      || !Number.isFinite(Number(slot.capacity))
      || Number(slot.capacity) < 1
    ))

    if (hasIncompleteSlot) {
      setError('Please complete all time slot fields before saving.')
      setIsSaving(false)
      return
    }

    try {
      const configuration = await updateHomeworkConfiguration(loggedInUser, {
        term_id: Number(selectedTermId),
        selected_weeks: sessions.map((session) => ({ week_number: session.week_number })),
        time_slots: slots.map((slot) => ({
          week_number: slot.week_number,
          start_time: slot.start_time,
          end_time: slot.end_time,
          capacity: Number(slot.capacity) || 0,
        })),
        booking_cutoff: bookingCutoff,
      })
      if (configuration) applyConfiguration(configuration)
      setSaved(true)
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <section className="homework-configuration" role="status">Loading configuration...</section>
  }

  if (error && academicTerms.length === 0) {
    return <section className="homework-configuration"><p className="homework-notice" role="alert">Unable to load configuration. {error}</p></section>
  }

  return (
    <form className="homework-configuration" onSubmit={saveConfiguration}>
      <div className="homework-form-grid">
        <label>
          <span>Academic Term</span>
          <select value={selectedTermId} onChange={changeAcademicTerm} disabled={isLoadingWeeks}>
            <option value="">Select an academic term</option>
            {academicTerms.map((term) => (
              <option value={term.id} key={term.id}>{term.term_name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Select Homework Support Week</span>
          <select value={selectedWeek} onChange={(event) => setSelectedWeek(event.target.value)} disabled={!selectedTermId || isLoadingWeeks}>
            <option value="">Select a week</option>
            {availableWeeks.map((week) => (
              <option value={week.week_number} key={week.week_number}>{week.week_label}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="homework-helper">Select the existing academic weeks that will have Homework Support.</p>
      {weeksError && <p className="homework-notice" role="alert">Unable to load Homework Support weeks. {weeksError}</p>}
      {!weeksError && isLoadingWeeks && <p className="homework-notice" role="status">Loading Homework Support weeks...</p>}
      <button className="homework-secondary-button" type="button" onClick={addSession} disabled={!selectedWeek || isLoadingWeeks}>Add Selected Week</button>

      <section className="homework-card" aria-labelledby="selected-sessions-title">
        <h3 id="selected-sessions-title">Selected Homework Support Sessions</h3>
        <div className="session-list">
          {sessions.map((session) => (
            <article className="session-row" key={session.week_number}>
              <div>
                <strong>{session.week_label}</strong>
                <span>{session.session_day} Session</span>
                <small>{formatSessionDate(session.session_date)}</small>
              </div>
              <button type="button" className="homework-danger-button" onClick={() => removeSession(session.week_number)}>Remove</button>
            </article>
          ))}
          {sessions.length === 0 && <p className="homework-empty">No Homework Support sessions selected.</p>}
        </div>
      </section>

      <section className="homework-card" aria-labelledby="slots-title">
        <div className="homework-card-header">
          <div>
            <h3 id="slots-title">Time Slots and Capacity</h3>
            <p>Configure slots independently for each selected Homework Support week.</p>
          </div>
          <button className="homework-primary-button" type="button" onClick={() => { setIsManagingDefaults((currentValue) => !currentValue); setDefaultTimingError(''); setDefaultTimingSaved(false) }}>
            Manage Default Slot Timing
          </button>
        </div>
        {isManagingDefaults && (
          <section className="homework-card" aria-labelledby="default-slot-timing-title">
            <div className="homework-card-header">
              <div>
                <h3 id="default-slot-timing-title">Default Slot Timing</h3>
                <p>Configure the default timing used by Homework Support weeks.</p>
              </div>
            </div>
            <div className="slot-grid">
              <article className="slot-card">
                <label>
                  <span>Start Time</span>
                  <input type="time" value={defaultSlotTimings[0]?.start_time || ''} onChange={(event) => updateDefaultTiming(0, 'start_time', event.target.value)} />
                </label>
                <label>
                  <span>End Time</span>
                  <input type="time" value={defaultSlotTimings[0]?.end_time || ''} onChange={(event) => updateDefaultTiming(0, 'end_time', event.target.value)} />
                </label>
              </article>
            </div>
            {defaultSlotTimings.length === 0 && <p className="homework-empty">No default slot timing configured yet. Enter a start and end time to create one.</p>}
            {defaultTimingError && <p className="homework-notice" role="alert">{defaultTimingError}</p>}
            <div className="configuration-footer">
              <button className="homework-primary-button" type="button" onClick={saveDefaultTimings} disabled={isSavingDefaults}>{isSavingDefaults ? 'Saving default timing...' : 'Save Default Timing'}</button>
              {defaultTimingSaved && <span role="status">Default slot timing saved successfully.</span>}
            </div>
          </section>
        )}
        {sessions.length === 0 && <p className="homework-empty">No Homework Support weeks selected.</p>}
        {sessions.map((session) => {
          const weekSlots = slots.filter((slot) => slot.week_number === session.week_number)

          return (
            <section className="homework-card" aria-labelledby={`week-slots-${session.week_number}`} key={session.week_number}>
              <div className="homework-card-header">
                <div>
                  <h3 id={`week-slots-${session.week_number}`}>{session.week_label}</h3>
                  <p>{session.session_day} Session: {formatSessionDate(session.session_date)}</p>
                </div>
                <button className="homework-secondary-button" type="button" onClick={() => addTimeSlotForWeek(session.week_number)}>+ Add Time Slot</button>
              </div>
              <div className="slot-grid">
                {weekSlots.map((slot) => (
                  <article className="slot-card" key={slot.id}>
                    <strong>{formatSlot(slot)}</strong>
                    <small>{slot.uses_default_timing ? 'Default slot timing' : 'Custom slot timing'}</small>
                    <label>
                      <span>Maximum capacity</span>
                      <input type="number" min="0" value={slot.capacity} onChange={(event) => updateCapacity(slot.id, event.target.value)} />
                    </label>
                    <div className="slot-actions">
                      <button type="button" className="homework-secondary-button" onClick={() => editTimeSlot(slot.id)}>Edit Time Slot</button>
                      <button type="button" className="homework-danger-button" onClick={() => removeTimeSlot(slot.id)}>Remove Time Slot</button>
                    </div>
                  </article>
                ))}
                {weekSlots.length === 0 && <p className="homework-empty">No time slots configured.</p>}
              </div>
            </section>
          )
        })}
      </section>

      <div className="booking-cutoff homework-form-grid">
        <label>
          <span>Booking Cut-off</span>
          <select value={bookingCutoff.day} onChange={(event) => { setBookingCutoff((currentCutoff) => ({ ...currentCutoff, day: event.target.value })); setSaved(false) }}>
            <option value="">Select cut-off day</option>
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
          </select>
        </label>
        <label>
          <span>Cut-off time</span>
          <select value={bookingCutoff.time} onChange={(event) => { setBookingCutoff((currentCutoff) => ({ ...currentCutoff, time: event.target.value })); setSaved(false) }}>
            <option value="">Select cut-off time</option>
            <option value="09:00">9:00 AM</option>
            <option value="12:00">12:00 PM</option>
            <option value="15:00">3:00 PM</option>
            <option value="18:00">6:00 PM</option>
          </select>
        </label>
        <p className="homework-helper">This cut-off applies to all selected Homework Support weeks.</p>
      </div>
      <div className="configuration-footer">
        <button className="homework-primary-button" type="submit" disabled={isSaving || !selectedTermId}>{isSaving ? 'Saving configuration...' : 'Save Configuration'}</button>
        {saved && <span role="status">Configuration saved successfully.</span>}
        {defaultTimingSaved && <span role="status">Default slot timing saved successfully.</span>}
        {error && <span className="login-error" role="alert">Unable to save configuration. {error}</span>}
      </div>
    </form>
  )
}

export default HomeworkConfiguration
