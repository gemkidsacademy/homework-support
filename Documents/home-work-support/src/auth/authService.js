const server = import.meta.env.VITE_API_URL?.trim() || ''
const endpoint = import.meta.env.VITE_ADMIN_LOGIN_ENDPOINT?.trim() || '/student-login'

function getLoginUrl() {
  if (!server) {
    throw new Error('VITE_API_URL is not configured. Add the FastAPI server URL and restart Vite.')
  }

  return new URL(endpoint, `${server.replace(/\/$/, '')}/`).toString()
}

function normalizeAdminUser(payload) {
  const data = payload?.data || payload

  if (data?.user_type === 'student') {
    throw new Error('This login is for administrators only.')
  }

  if (data?.user_type !== 'admin' || !data?.admin) {
    throw new Error(`Unexpected login response: ${JSON.stringify(payload)}`)
  }

  const admin = data.admin

  return {
    user_type: 'admin',
    id: admin.id,
    username: admin.username,
    role: admin.role,
    center_code: admin.center_code,
    access_token: data.access_token || data.accessToken,
  }
}

export async function adminLogin(studentId, password) {
  const loginUrl = getLoginUrl()
  const requestPayload = { student_id: studentId }

  console.log('BACKEND SERVER:', server)
  console.log('ADMIN LOGIN ENDPOINT:', endpoint)
  console.log('FINAL LOGIN URL:', loginUrl)
  console.log('LOGIN REQUEST PAYLOAD:', requestPayload)

  const response = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      student_id: studentId,
      password,
    }),
  })

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const responseDetails = payload ? JSON.stringify(payload) : 'No response body'
    throw new Error(`Login failed (${response.status} ${response.statusText}): ${responseDetails}`)
  }

  return normalizeAdminUser(payload)
}
