# Homework Support Progress Checkpoint

## 1. Project Goal

This project is building a Homework Support booking system for the Gem Kids Academy administration portal.

The eventual workflow is:

```text
Academic Term
     |
     v
Admin selects Homework Support weeks
     |
     v
Admin configures time slots for each week
     |
     v
Admin configures booking cut-off
     |
     v
Admin configures automatic parent invitations
     |
     v
Scheduler checks automation configuration
     |
     v
Identify relevant Homework Support week
     |
     v
Identify eligible students
     |
     v
Send parent invitation emails
     |
     v
Parents book available time slots
```

This workspace contains the React/Vite frontend. The FastAPI backend and database source are maintained outside this repository.

## 2. What Has Been Completed

The Homework Support Configuration UI has been converted from mock data to backend-driven data.

The Configuration UI currently supports:

- Selecting an existing Academic Term.
- Loading academic weeks calculated by the backend from the Academic Term `start_date` and `end_date`.
- Selecting Homework Support weeks.
- Saving selected Homework Support weeks.
- Configuring multiple time slots for each Homework Support week.
- Configuring capacity for each time slot.
- Removing individual time slots.
- Editing individual time slots.
- A center-scoped default slot timing configuration.
- Custom slot timing overriding default timing for a particular slot.
- A global booking cut-off for the selected academic term.

Important design decision:

**One Homework Support week can have multiple time slots.**

Example:

```text
Week 1
  7:15 PM - 7:30 PM
  7:30 PM - 7:45 PM
  7:45 PM - 8:00 PM

Week 2
  7:15 PM - 7:30 PM
  7:30 PM - 7:45 PM
```

## 3. Existing Database Models

The following backend model and table details are supplied project facts. The backend source is not present in this frontend workspace, so model file locations cannot be verified here.

### AcademicTerm

```text
academic_terms
```

Important fields:

```text
id
center_code
term_name
start_date
end_date
number_of_weeks
is_active
```

Academic weeks are calculated by the backend from the term's start and end dates. They are not stored as separate academic-week records.

### HomeworkSupportWeek

```text
homework_support_weeks
```

Important fields:

```text
id
center_code
academic_term_id
week_number
```

There is a unique constraint on:

```text
center_code + academic_term_id + week_number
```

### HomeworkSupportTimeSlot

```text
homework_support_time_slots
```

Important fields:

```text
id
center_code
homework_support_week_id
start_time
end_time
capacity
```

Important architectural decision:

There is intentionally **no uniqueness constraint on `homework_support_week_id`**, because one week can have multiple time slots.

### HomeworkSupportBookingCutoff

```text
homework_support_booking_cutoffs
```

Important fields:

```text
id
center_code
academic_term_id
cutoff_day
cutoff_time
```

There is a unique constraint on:

```text
center_code + academic_term_id
```

Booking cutoff is **global for all selected Homework Support weeks in that academic term**. It is not associated with an individual week.

### HomeworkSupportDefaultSlotTiming

```text
homework_support_default_slot_timings
```

Important fields:

```text
id
center_code
start_time
end_time
slot_order
```

Current product decision: there should be one default slot-timing configuration for a centre at a given time. The frontend has one default timing editor and does not provide an `Add Default Slot` control for multiple independent defaults.

## 4. Existing Automation Table

```text
homework_automation_configurations
```

The current saved example for centre `MP001` was:

```text
center_code      = MP001
enabled          = true
invitation_day   = Monday
invitation_time  = 9:00 AM
```

This table controls whether automatic parent invitations are enabled and when the scheduler should run.

The backend model and source location are not present in this frontend repository.

## 5. Working Backend Endpoints

The following endpoints are used by the current frontend. Backend implementation source is external to this workspace.

### Configuration

```text
GET /homework/configuration/by-center/{center_code}
```

Loads the center-scoped configuration, academic terms, selected sessions, available weeks, time slots, and global term booking cutoff.

Frontend caller:

```text
src/services/homeworkConfigurationService.js
```

Used by:

```text
src/components/admin/HomeworkConfiguration.jsx
```

```text
GET /homework/configuration/weeks/{center_code}?term_id={term_id}
```

Loads the academic weeks for the selected term. The backend calculates these from the term dates.

Frontend caller:

```text
src/services/homeworkConfigurationService.js
```

```text
PUT /homework/configuration/by-center/{center_code}
```

Saves the complete configuration for the selected center and academic term, including selected weeks, all time slots, and the global booking cutoff.

The frontend sends this shape:

```json
{
  "term_id": 8,
  "selected_weeks": [
    { "week_number": 1 }
  ],
  "time_slots": [
    {
      "week_number": 1,
      "start_time": "19:15",
      "end_time": "19:30",
      "capacity": 10
    }
  ],
  "booking_cutoff": {
    "day": "Monday",
    "time": "09:00"
  }
}
```

### Default Slot Timing

```text
GET /homework/configuration/default-slot-timings/by-center/{center_code}
```

Loads the center-specific default slot timing.

```text
PUT /homework/configuration/default-slot-timings/by-center/{center_code}
```

Persists the center-specific default slot timing. The frontend sends an ordered `default_slot_timings` list with `slot_order`; the current UI restricts this to one timing record.

Frontend caller for both endpoints:

```text
src/services/homeworkDefaultSlotTimingService.js
```

Used by:

```text
src/components/admin/HomeworkConfiguration.jsx
```

### Automation

```text
GET /homework/automation/by-center/{center_code}
```

Loads the automation configuration, including enabled state, invitation day/time, term display, and schedule rows.

```text
PUT /homework/automation/by-center/{center_code}
```

Saves the enabled state, invitation day, and invitation time for the center.

Frontend caller for both endpoints:

```text
src/services/homeworkAutomationService.js
```

Used by:

```text
src/components/admin/HomeworkAutomation.jsx
```

All frontend service requests derive the center path segment from `loggedInUser.center_code`. The backend must verify that the requested center belongs to the authenticated admin and must not trust a client-supplied center code by itself.

## 6. Important Tested Result

The following result was tested against the external FastAPI backend:

```text
PUT /homework/configuration/by-center/MP001
```

Response:

```text
200 OK
```

The frontend sent:

```text
CENTER CODE: MP001
TERM ID: 8
SELECTED WEEKS:
  week_number = 1
TIME SLOTS RECEIVED:
  count = 1
  Slot 1: week=1, start=19:15, end=19:30, capacity=10
BOOKING CUTOFF: day='Monday' time='09:00'
```

PostgreSQL confirmed that the time slot was persisted.

Multiple slots per week were then tested. PostgreSQL showed four rows, two slots for each of two Homework Support weeks.

Example result:

```text
homework_support_week_id | start_time | end_time | capacity
----------------------------------------------------------
6                        | 02:00      | 02:30    | 10
6                        | 19:15      | 19:30    | 10
7                        | 02:00      | 02:30    | 10
7                        | 19:15      | 19:30    | 10
```

Therefore the multiple-slot architecture has been verified end-to-end. These database and backend tests were reported for the external backend; the backend code and model locations are not available in this frontend repository.

## 7. Current Frontend Behavior

`src/components/admin/HomeworkConfiguration.jsx` is backend-driven.

It receives `loggedInUser` from `src/pages/AdminPanel.jsx` and uses:

```text
loggedInUser.center_code
```

for center scoping.

The protected route wrapper is in:

```text
src/App.jsx
```

It reads the authenticated user through the existing auth context and passes it as `loggedInUser` to `AdminPanel`.

The configuration component supports multiple time-slot cards per week. Each selected week is rendered as its own visual section with its own:

```text
+ Add Time Slot
```

action. Additional slots created by that action carry the same `week_number` as the containing week. Removing a selected week removes all frontend slots belonging to that week.

The frontend validates that every saved slot has:

```text
week_number
start_time
end_time
capacity >= 1
```

before calling the configuration PUT endpoint.

The configuration service is:

```text
src/services/homeworkConfigurationService.js
```

The service uses:

```javascript
import.meta.env.VITE_API_URL
```

The local development value is configured in:

```text
.env.local
```

with:

```text
VITE_API_URL=http://localhost:8000
```

## 8. Default Slot Timing Design

Default timing is used when a newly selected Homework Support week receives its initial slot or slots. It is not the same thing as the actual booking slots.

An admin can edit a particular week slot and make its timing custom. Actual booking slots are stored in:

```text
homework_support_time_slots
```

Default timing is a configuration used when creating or configuring initial week slots. It is stored separately in:

```text
homework_support_default_slot_timings
```

The UI has:

```text
Manage Default Slot Timing
```

and no longer has:

```text
Add Default Slot
```

because the current product decision is one default timing configuration rather than multiple independent defaults.

The frontend service is:

```text
src/services/homeworkDefaultSlotTimingService.js
```

The service sends an ordered request such as:


```json
{
  "default_slot_timings": [
    {
      "start_time": "09:00",
      "end_time": "09:30",
      "slot_order": 1
    }
  ]
}
```

The backend should make the stored center-specific default timing set exactly match the submitted list, including removals. The current UI submits at most one record.

## 9. Booking Cut-off Design

Booking cut-off applies to **all selected Homework Support weeks for the selected academic term**.

It is not selected per week.

The UI currently uses:

```text
Cut-off day
Cut-off time
```

and saves:

```json
{
  "day": "Monday",
  "time": "09:00"
}
```

The frontend includes this object in the existing configuration PUT request. It does not add `homework_support_week_id`.

The backend persists this using:

```text
center_code + academic_term_id
```

through the existing `HomeworkSupportBookingCutoff` model/table.

## 10. Current Next Step

Configuration persistence has been tested. The next small implementation step is **not email sending yet**.

The next task is to implement and test the scheduler's configuration-reading layer only.

The scheduler should:

1. Read `homework_automation_configurations`.
2. If `enabled == false`, stop processing.
3. If enabled, use `invitation_day` and `invitation_time`.
4. Find the centre's active `AcademicTerm`.
5. Find `HomeworkSupportWeek` records for that centre and active term.
6. Find all `HomeworkSupportTimeSlot` records for those weeks.
7. Read the global `HomeworkSupportBookingCutoff` for the center and active academic term when needed by the scheduling decision.
8. Log a clear scheduler decision containing:
   - center
   - active term
   - invitation day/time
   - selected Homework Support weeks
   - time slots for each week
   - booking cutoff when relevant
9. Do not send emails yet.

No scheduler file location could be verified because no backend/scheduler source is present in this workspace.

## 11. What Has NOT Been Built Yet

The following functionality is not present in this frontend repository or has not been implemented in the overall feature:

- Scheduler configuration-reading layer
- Determining the exact invitation target week/date
- Active student recipient selection
- Parent email recipient resolution
- Email template
- Email sending
- Booking availability API
- Parent booking UI
- Preventing over-capacity bookings
- Booking records
- Booking confirmation
- Cancellation/rescheduling
- Scheduler production scheduling

The current frontend Automation and Configuration screens call the expected backend APIs, but the backend implementation is external to this workspace.

## 12. Important Rules

Do not:

- Reintroduce mock data.
- Hardcode academic weeks.
- Create a separate academic-week table unless explicitly requested.
- Create only one time slot per week.
- Add a unique constraint preventing multiple slots per week.
- Make booking cutoff week-specific.
- Trust a client-supplied center code without verifying it against the authenticated admin.
- Start implementing email sending before the scheduler configuration-reading layer has been tested.
- Add an `Add Default Slot` control for multiple independent default configurations unless the product decision is explicitly reconsidered.

## 13. How to Continue

Start by reading this checkpoint and then inspect the external backend repository for the actual model and scheduler file locations before changing functionality.

The frontend files most relevant to the current feature are:

```text
src/App.jsx
src/pages/AdminPanel.jsx
src/auth/AuthContext.jsx
src/auth/authService.js
src/components/admin/HomeworkConfiguration.jsx
src/components/admin/HomeworkAutomation.jsx
src/services/homeworkConfigurationService.js
src/services/homeworkDefaultSlotTimingService.js
src/services/homeworkAutomationService.js
.env.local
```

Do not modify application functionality as part of checkpoint maintenance. Update this document when verified endpoint contracts, backend model locations, scheduler behavior, or test results change.

```text
CURRENT CHECKPOINT

Configuration tab: COMPLETE AND TESTED
Multiple slots per week: COMPLETE AND TESTED
Booking cutoff persistence: COMPLETE
Default slot timing: IMPLEMENTED
Automation configuration: IMPLEMENTED

NEXT TASK:
Implement and test the scheduler configuration-reading layer only.
Do not send emails yet.
```
