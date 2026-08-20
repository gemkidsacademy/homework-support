# Codex Project Context

## 1. Project

- Project name: `home-work-support`
- React + Vite frontend
- The project uses React, React Router, and Vite.
- The frontend source is under `src/`.

## 2. Current Authentication

- The login page is implemented at `/`.
- This frontend is admin-only.
- The login form still labels the first field `Student ID`, but it is used for the shared backend authentication flow.
- Authentication uses the shared backend endpoint:

  `/student-login`

- Backend server:

  `https://web-production-481a5.up.railway.app`

- The complete runtime login URL is:

  `https://web-production-481a5.up.railway.app/student-login`

- `/student-login` can return either an admin or a student.
- This frontend accepts only admin authentication.
- If `user_type === "admin"`, the frontend stores the admin data and navigates to `/AdminPanel`.
- If `user_type === "student"`, the frontend rejects the login with an administrator-only message and does not navigate to a student or quiz route.
- The request body uses:

  ```json
  {
    "student_id": "entered student ID",
    "password": "entered password"
  }
  ```

- Passwords are not logged. Temporary authentication diagnostics log the backend server, endpoint, final URL, and a password-free request payload.

## 3. Admin User Data

The backend admin response is expected to provide data under `data.admin` when `data.user_type === "admin"`.

The normalized authenticated user object preserves:

```js
{
  user_type: "admin",
  id: data.admin.id,
  username: data.admin.username,
  role: data.admin.role,
  center_code: data.admin.center_code
}
```

`center_code` is intentionally preserved because future dashboard functionality will be center-specific.

## 4. Current Routes

Routes are defined in `src/App.jsx`:

- `/` renders `LoginPage`.
- `/AdminPanel` renders `AdminPanel` behind `ProtectedRoute`.
- Any unknown route redirects to `/`.

No other application routes currently exist.

## 5. Auth Architecture

- `src/auth/AuthContext.jsx`
  - Defines `AuthProvider`.
  - Owns the authenticated user React state.
  - `signIn(authenticatedUser)` updates state and persists the user.
  - `signOut()` clears state and removes the persisted user.

- `src/auth/contextValue.js`
  - Defines and exports `AuthContext`.

- `src/auth/useAuth.js`
  - Exports `useAuth()` for reading the centralized auth context.

- `src/auth/authService.js`
  - Exports `adminLogin(studentId, password)`.
  - Reads `VITE_API_BASE_URL` and `VITE_ADMIN_LOGIN_ENDPOINT` from Vite environment variables.
  - Builds the absolute backend URL.
  - Sends the shared `/student-login` request.
  - Rejects student responses.
  - Normalizes and returns admin data, including `center_code`.

- `src/components/ProtectedRoute.jsx`
  - Reads the authenticated user from `useAuth()`.
  - Redirects unauthenticated users to `/`.
  - Renders protected child routes through `Outlet` when a user exists.

Authenticated user state is stored in React state and persisted in browser `localStorage` under:

`gem-kids-admin-user`

Logout behavior is implemented by the auth context's `signOut()` function. The current AdminPanel header/logout control was removed during the UI iteration, so a visible logout control is not currently rendered in AdminPanel. The auth context logout capability remains available and should be reconnected when the dashboard shell is finalized.

## 6. Current AdminPanel

- File: `src/pages/AdminPanel.jsx`
- The protected `/AdminPanel` route renders a full-height dashboard shell.
- It uses the Gem Kids Academy SVG logo:

  `https://gemkidsacademy.com.au/wp-content/uploads/2024/11/Frame-1707478212.svg`

- The current sidebar has exactly three functional tab buttons:
  - `Home Work Configuration`
  - `Weekly Dashboard`
  - `Automation`
- `Home Work Configuration` is selected by default.
- The active tab is held in local React state.
- The current top search/user/logout header was removed. The sidebar still displays signed-in username and center code in its footer when available.
- AdminPanel delegates tab content to the three components under `src/components/admin/`.

## 7. Current Dashboard Design

The AdminPanel has been styled as a Gem Kids Academy SaaS administration dashboard inspired by the supplied NURP reference screenshot.

Current design characteristics:

- Dark navy left sidebar
- Blue active navigation pill
- Light gray/light main content area
- Gem Kids Academy branding in the sidebar
- Rounded cards
- Light borders and subtle shadows
- Responsive layout
- Main content can scroll vertically
- Mobile layout changes the sidebar into a horizontally scrollable tab/navigation area

The NURP screenshot is only a visual reference. NURP branding is not used; the product branding remains Gem Kids Academy.

The previously planned welcome dashboard, summary cards, quick actions, and top header were implemented during earlier iterations, but the shared top header and welcome content were later removed at the user's request. The current AdminPanel primarily presents the three Homework Support tab views.

## 8. Current Sidebar Navigation

Originally planned navigation items were:

- Dashboard
- Academic Terms
- Class Configuration
- Session Topics
- Quiz Scheduler
- Leaderboard

Those six items are not currently implemented in the live sidebar. They were replaced with the three requested Homework Support tabs:

- Home Work Configuration
- Weekly Dashboard
- Automation

Only those three tabs are currently functional in AdminPanel.

## 9. Important Existing Components

Actual files under `src/components/admin/`:

- `src/components/admin/HomeworkConfiguration.jsx`
  - Frontend-only Homework Support configuration form.
  - Academic term selector.
  - Homework Support week selector.
  - Selected session list with remove controls.
  - Add selected week control.
  - Time slots and capacity controls.
  - Add, edit, and remove time slots.
  - Booking cutoff field.
  - Save action currently reports a local demo save state.
  - No Homework Support backend endpoint is called yet.

- `src/components/admin/HomeworkWeeklyDashboard.jsx`
  - Frontend-only weekly attendance dashboard.
  - Summary cards for total students, attending, not attending, and no response.
  - Slot capacity status rows with close/reopen demo actions.
  - Student Responses table.
  - Demo actions for add student, change slot, mark not attending, resend email, and cancel booking.
  - Uses local React state and does not call a Homework Support backend endpoint.

- `src/components/admin/HomeworkAutomation.jsx`
  - Frontend-only automation configuration.
  - Automatic parent invitation toggle.
  - Invitation day and time selectors.
  - Homework Support email schedule cards with Scheduled, Sent, and Not Sent statuses.
  - Parent response deadline date and time fields.
  - Save action currently reports a local demo save state.
  - No Homework Support backend endpoint is called yet.

There are no existing backend modules for these Homework Support components in this React project.

## 10. Environment

Root environment file:

- `.env.local`

Current values:

```env
VITE_API_BASE_URL=https://web-production-481a5.up.railway.app
VITE_ADMIN_LOGIN_ENDPOINT=/student-login
```

Vite exposes these variables to frontend code because they use the `VITE_` prefix.

The Vite development server must be restarted after changing `.env.local`.

No passwords, API keys, access tokens, or private credentials are documented here.

## 11. Current Progress

Completed:

- Login page UI and Gem Kids Academy branding.
- Admin-only shared authentication flow through `/student-login`.
- Admin response normalization and preservation of `center_code`.
- Centralized auth context and localStorage persistence.
- Protected `/AdminPanel` route.
- Initial AdminPanel shell with Gem Kids Academy navy-sidebar styling.
- Three sidebar tabs: Home Work Configuration, Weekly Dashboard, and Automation.
- Frontend-only Configuration component.
- Frontend-only Weekly Dashboard component.
- Frontend-only Automation component.
- Browser title and favicon updated to Gem Kids Academy.
- Lint and Vite builds have passed throughout the recent UI work.

Not completed:

- No Homework Support backend endpoints exist in this frontend project.
- Configuration, Weekly Dashboard, and Automation currently use local demo state.
- No real backend loading, saving, attendance, capacity, invitation, or scheduling operations are connected.
- The visible AdminPanel logout control was removed during the latest UI cleanup and should be restored or relocated before production use.
- The six broader admin module navigation items are planned but are not currently rendered.

## 12. Next Step

Continue building the Admin Dashboard UI and then add the actual admin modules one by one without breaking authentication.

Before connecting Homework Support functionality, define and confirm the backend API contracts for configuration, weekly dashboard data/actions, and automation settings. Keep those API calls isolated from the presentation components, consistent with the existing `authService.js` pattern.
