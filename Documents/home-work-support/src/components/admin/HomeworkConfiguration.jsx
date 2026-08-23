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
  // For new weeks with no configuration, don't create any pre-filled slots
  // The admin will add defaults or custom slots as needed via the buttons
  return []
}

function ensureInitialTimeSlots(selectedSessions, configuredSlots, defaultSlotTimings) {
  const selectedWeekNumbers = new Set(selectedSessions.map((session) => session.week_number))
  const validSlots = configuredSlots
    .filter((slot) => selectedWeekNumbers.has(slot.week_number))
    .map((slot) => {
      // Only fill in missing times if the slot explicitly uses a default
      let filledSlot = { ...slot }
      if (slot.uses_default_timing && slot.default_slot_index !== null && slot.default_slot_index !== undefined) {
        const defaultTiming = defaultSlotTimings[slot.default_slot_index]
        if (defaultTiming) {
          filledSlot.start_time = slot.start_time || defaultTiming.start_time || ''
          filledSlot.end_time = slot.end_time || defaultTiming.end_time || ''
        }
      }
      return filledSlot
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
  const [isSessionsExpanded, setIsSessionsExpanded] = useState(true)
  const [expandedWeeks, setExpandedWeeks] = useState({})

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

  useEffect(() => {
    // Initialize expanded weeks: first week expanded, others collapsed
    if (sessions.length > 0) {
      const newExpandedWeeks = {}
      sessions.forEach((session, index) => {
        newExpandedWeeks[session.week_number] = index === 0
      })
      setExpandedWeeks(newExpandedWeeks)
    } else {
      setExpandedWeeks({})
    }
  }, [sessions])

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

  function addAllSessions() {
    const selectedWeekNumbers = new Set(sessions.map((session) => session.week_number))
    const weeksToAdd = availableWeeks.filter((week) => !selectedWeekNumbers.has(week.week_number))

    if (weeksToAdd.length === 0) return

    const newSlots = weeksToAdd.flatMap((week) => createSlotsForWeek(week.week_number, defaultSlotTimings))

    setSessions((currentSessions) => [
      ...currentSessions,
      ...weeksToAdd,
    ])
    setSlots((currentSlots) => [
      ...currentSlots,
      ...newSlots,
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

  function addDefaultSlotToWeek(weekNumber, defaultSlotIndex) {
    const defaultTiming = defaultSlotTimings[defaultSlotIndex]
    if (!defaultTiming) return

    const newSlot = {
      id: `new-${Date.now()}-${++localSlotId}`,
      week_number: weekNumber,
      start_time: defaultTiming.start_time,
      end_time: defaultTiming.end_time,
      capacity: '',
      uses_default_timing: true,
      default_slot_index: defaultSlotIndex,
    }

    setSlots((currentSlots) => [
      ...currentSlots,
      newSlot,
    ])
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
      const updated = [...currentTimings]
      if (!updated[index]) {
        updated[index] = { start_time: '', end_time: '', slot_order: index + 1 }
      }
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
    setDefaultTimingError('')
    setDefaultTimingSaved(false)
  }

  function addDefaultSlot() {
    setDefaultSlotTimings((currentTimings) => {
      const maxSlotOrder = currentTimings.length > 0
        ? Math.max(...currentTimings.map((t) => t.slot_order || 0))
        : 0
      return [
        ...currentTimings,
        {
          start_time: '',
          end_time: '',
          slot_order: maxSlotOrder + 1,
        },
      ]
    })
    setDefaultTimingError('')
    setDefaultTimingSaved(false)
  }

  function removeDefaultSlot(index) {
    setDefaultSlotTimings((currentTimings) => currentTimings.filter((_, i) => i !== index))
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

    const hasInvalidEndTime = defaultSlotTimings.some((timing) => {
      if (!timing.start_time || !timing.end_time) return false
      const [startH, startM] = timing.start_time.split(':').map(Number)
      const [endH, endM] = timing.end_time.split(':').map(Number)
      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM
      return endMinutes <= startMinutes
    })

    if (hasInvalidEndTime) {
      setDefaultTimingError('End time must be later than start time for all default slots.')
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
          uses_default_timing: slot.uses_default_timing || false,
          default_slot_index: slot.default_slot_index ?? null,
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
            {academicTerms
            .filter((term) => term.is_active)
            .map((term) => (
              <option value={term.id} key={term.id}>
                {term.term_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Select Homework Support Week</span>
          <select value={selectedWeek} onChange={(event) => {
            const value = event.target.value
            if (value === 'SELECT_ALL') {
              addAllSessions()
            } else {
              setSelectedWeek(value)
            }
          }} disabled={!selectedTermId || isLoadingWeeks}>
            <option value="">Select a week</option>
            <option value="SELECT_ALL">Select All Weeks</option>
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
        <div className="homework-card-header collapsible-header" onClick={() => setIsSessionsExpanded((current) => !current)}>
          <h3 id="selected-sessions-title">Selected Homework Support Sessions</h3>
          <span className="collapse-indicator">{isSessionsExpanded ? '▲' : '▼'}</span>
        </div>
        {isSessionsExpanded && (
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
        )}
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
              {defaultSlotTimings.map((timing, index) => (
                <article className="slot-card" key={index}>
                  <h4>Default Slot {timing.slot_order || index + 1}</h4>
                  <label>
                    <span>Start Time</span>
                    <input type="time" value={timing.start_time || ''} onChange={(event) => updateDefaultTiming(index, 'start_time', event.target.value)} />
                  </label>
                  <label>
                    <span>End Time</span>
                    <input type="time" value={timing.end_time || ''} onChange={(event) => updateDefaultTiming(index, 'end_time', event.target.value)} />
                  </label>
                  <div className="slot-actions">
                    <button
                      type="button"
                      className="homework-danger-button"
                      onClick={() => removeDefaultSlot(index)}
                    >
                      Remove Default Slot
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {defaultSlotTimings.length === 0 && <p className="homework-empty">No default slot timing configured yet. Click "+ Add Default Slot" to create one.</p>}
            <div className="configuration-footer">
              <button className="homework-secondary-button" type="button" onClick={addDefaultSlot}>+ Add Default Slot</button>
            </div>
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
          const isWeekExpanded = expandedWeeks[session.week_number] ?? true

          return (
            <section className="homework-card" aria-labelledby={`week-slots-${session.week_number}`} key={session.week_number}>
              <div className="homework-card-header collapsible-week-header" onClick={() => setExpandedWeeks((current) => ({ ...current, [session.week_number]: !current[session.week_number] }))}>
                <div>
                  <h3 id={`week-slots-${session.week_number}`}>{session.week_label}</h3>
                  <p>{session.session_day} Session: {formatSessionDate(session.session_date)}</p>
                </div>
                <span className="collapse-indicator">{isWeekExpanded ? '▲' : '▼'}</span>
              </div>

              {isWeekExpanded && (
                <>
                  {defaultSlotTimings.length > 0 && (
                    <div className="slot-grid">
                      {defaultSlotTimings.map((defaultSlot, defaultSlotIndex) => {
                        const isAdded = weekSlots.some((slot) => slot.uses_default_timing && slot.default_slot_index === defaultSlotIndex)
                        return !isAdded ? (
                          <article key={`available-${defaultSlotIndex}`} className="available-default-slot">
                            <div>
                              <strong>Default Slot {defaultSlot.slot_order || defaultSlotIndex + 1}</strong>
                              <span>{formatTime(defaultSlot.start_time)} - {formatTime(defaultSlot.end_time)}</span>
                              <span className="status-text">Not added to this week</span>
                            </div>
                            <button
                              type="button"
                              className="homework-secondary-button"
                              onClick={() => addDefaultSlotToWeek(session.week_number, defaultSlotIndex)}
                            >
                              + Add
                            </button>
                          </article>
                        ) : null
                      })}
                    </div>
                  )}

                  <div className="slot-grid">
                    {weekSlots.map((slot) => (
                      <article className="slot-card" key={slot.id}>
                        <strong>{formatSlot(slot)}</strong>
                        <small>{slot.uses_default_timing ? `Default slot ${defaultSlotTimings[slot.default_slot_index]?.slot_order || slot.default_slot_index + 1}` : 'Custom slot timing'}</small>
                        <label>
                          <span>Maximum capacity</span>
                          <input type="number" min="0" value={slot.capacity} onChange={(event) => updateCapacity(slot.id, event.target.value)} />
                        </label>
                        <div className="slot-actions">
                          <button type="button" className="homework-secondary-button" onClick={() => editTimeSlot(slot.id)}>Edit Time Slot</button>
                          <button
                            type="button"
                            className="homework-danger-button"
                            disabled={slot.booking_count > 0}
                            onClick={() => {
                              if (slot.booking_count > 0) return
                              removeTimeSlot(slot.id)
                            }}
                          >
                            Remove Time Slot
                          </button>
                          {slot.booking_count > 0 && <p>Cannot remove this slot because a parent booking already exists.</p>}
                        </div>
                      </article>
                    ))}
                    {weekSlots.length === 0 && <p className="homework-empty">No time slots configured.</p>}
                  </div>

                  <div className="configuration-footer">
                    <button className="homework-secondary-button" type="button" onClick={() => addTimeSlotForWeek(session.week_number)}>+ Add Time Slot</button>
                  </div>
                </>
              )}
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
