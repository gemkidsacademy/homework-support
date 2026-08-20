const server = import.meta.env.VITE_API_URL?.trim() || ''
function getAutomationUrl(centerCode) {
  if (!server) {
    throw new Error('VITE_API_URL is not configured. Add the FastAPI server URL and restart Vite.')
  }

  if (!centerCode) {
    throw new Error('Authenticated admin center_code is required to load automation data.')
  }

  return new URL(`/homework/automation/by-center/${encodeURIComponent(centerCode)}`, `${server.replace(/\/$/, '')}/`).toString()
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

function normalizeAutomation(payload) {
  const automation = payload?.automation || payload?.data?.automation || payload?.data

  if (!automation || typeof automation !== 'object') {
    return null
  }

  return {
    enabled: Boolean(automation.enabled),
    invitation_day: automation.invitation_day || '',
    invitation_time: automation.invitation_time || '',
    term: automation.term || '',
    schedules: Array.isArray(automation.schedules) ? automation.schedules : [],
  }
}

export async function getHomeworkAutomation(loggedInUser) {
  const response = await fetch(getAutomationUrl(loggedInUser?.center_code), {
    method: 'GET',
    headers: getHeaders(loggedInUser),
  })

  return normalizeAutomation(await readResponse(response))
}

export async function updateHomeworkAutomation(loggedInUser, automation) {
  const response = await fetch(getAutomationUrl(loggedInUser?.center_code), {
    method: 'PUT',
    headers: getHeaders(loggedInUser),
    body: JSON.stringify({
      enabled: automation.enabled,
      invitation_day: automation.invitation_day,
      invitation_time: automation.invitation_time,
    }),
  })

  return normalizeAutomation(await readResponse(response))
}
