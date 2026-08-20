const server = import.meta.env.VITE_API_URL?.trim() || ''

function getConfigurationUrl(centerCode) {
  if (!server) {
    throw new Error('VITE_API_URL is not configured. Add the FastAPI server URL and restart Vite.')
  }

  if (!centerCode) {
    throw new Error('Authenticated admin center_code is required to load configuration data.')
  }

  return new URL(`/homework/configuration/by-center/${encodeURIComponent(centerCode)}`, `${server.replace(/\/$/, '')}/`).toString()
}

function getWeeksUrl(centerCode, termId) {
  const url = new URL(`/homework/configuration/weeks/${encodeURIComponent(centerCode)}`, `${server.replace(/\/$/, '')}/`)
  url.searchParams.set('term_id', termId)
  return url.toString()
}

function getHeaders(loggedInUser) {
  const headers = { 'Content-Type': 'application/json' }

  if (loggedInUser?.access_token) {
    headers.Authorization = `Bearer ${loggedInUser.access_token}`
  }

  return headers
}

async function readResponse(response) {
  let payload = null

  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const detail = payload?.detail || payload?.message || `Request failed (${response.status})`
    throw new Error(detail)
  }

  return payload
}

function normalizeConfiguration(payload) {
  const configuration = payload?.configuration || payload?.data?.configuration || payload?.data || payload

  if (!configuration || typeof configuration !== 'object') {
    return null
  }

  return {
    center_code: configuration.center_code || '',
    academic_terms: Array.isArray(configuration.academic_terms) ? configuration.academic_terms : [],
    selected_term: configuration.selected_term || null,
    available_weeks: Array.isArray(configuration.available_weeks) ? configuration.available_weeks : [],
    selected_sessions: Array.isArray(configuration.selected_sessions) ? configuration.selected_sessions : [],
    time_slots: Array.isArray(configuration.time_slots) ? configuration.time_slots : [],
    booking_cutoff: configuration.booking_cutoff || { day: '', time: '' },
  }
}

function normalizeWeeks(payload) {
  const weeks = payload?.weeks || payload?.data?.weeks || []
  return Array.isArray(weeks) ? weeks : []
}

export async function getHomeworkConfiguration(loggedInUser) {
  const response = await fetch(getConfigurationUrl(loggedInUser?.center_code), {
    method: 'GET',
    headers: getHeaders(loggedInUser),
  })

  return normalizeConfiguration(await readResponse(response))
}

export async function getHomeworkConfigurationWeeks(loggedInUser, termId) {
  if (!loggedInUser?.center_code) {
    throw new Error('Authenticated admin center_code is required to load Homework Support weeks.')
  }

  const response = await fetch(getWeeksUrl(loggedInUser.center_code, termId), {
    method: 'GET',
    headers: getHeaders(loggedInUser),
  })

  return normalizeWeeks(await readResponse(response))
}

export async function updateHomeworkConfiguration(loggedInUser, configuration) {
  const response = await fetch(getConfigurationUrl(loggedInUser?.center_code), {
    method: 'PUT',
    headers: getHeaders(loggedInUser),
    body: JSON.stringify({
      term_id: configuration.term_id,
      selected_weeks: configuration.selected_weeks,
      time_slots: configuration.time_slots,
      booking_cutoff: configuration.booking_cutoff,
    }),
  })

  return normalizeConfiguration(await readResponse(response))
}
