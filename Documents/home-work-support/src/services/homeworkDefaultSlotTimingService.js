const server = import.meta.env.VITE_API_URL?.trim() || ''

function getDefaultSlotTimingUrl(centerCode) {
  if (!server) {
    throw new Error('VITE_API_URL is not configured. Add the FastAPI server URL and restart Vite.')
  }

  if (!centerCode) {
    throw new Error('Authenticated admin center_code is required to load default slot timing.')
  }

  return new URL(`/homework/configuration/default-slot-timings/by-center/${encodeURIComponent(centerCode)}`, `${server.replace(/\/$/, '')}/`).toString()
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

function normalizeDefaultSlotTimings(payload) {
  const timings = payload?.default_slot_timings || payload?.data?.default_slot_timings || payload?.data || payload
  return Array.isArray(timings)
    ? timings
      .slice()
      .sort((firstTiming, secondTiming) => (firstTiming.slot_order || 0) - (secondTiming.slot_order || 0))
      .map((timing, index) => ({
        ...timing,
        slot_order: timing.slot_order || index + 1,
      }))
    : []
}

export async function getDefaultSlotTimings(loggedInUser) {
  const response = await fetch(getDefaultSlotTimingUrl(loggedInUser?.center_code), {
    method: 'GET',
    headers: getHeaders(loggedInUser),
  })

  return normalizeDefaultSlotTimings(await readResponse(response))
}

export async function updateDefaultSlotTimings(loggedInUser, defaultSlotTimings) {
  const response = await fetch(getDefaultSlotTimingUrl(loggedInUser?.center_code), {
    method: 'PUT',
    headers: getHeaders(loggedInUser),
    body: JSON.stringify({
      default_slot_timings: defaultSlotTimings.map((timing) => ({
        start_time: timing.start_time,
        end_time: timing.end_time,
        slot_order: timing.slot_order || 1,
      })),
    }),
  })

  return normalizeDefaultSlotTimings(await readResponse(response))
}
