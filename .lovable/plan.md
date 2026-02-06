
# Support Ticket System Implementation Plan

## Overview
This plan implements a complete support ticket system allowing users to report account issues directly from their dashboard. Tickets will be sent to support@bizooma.com via email and displayed in a dedicated admin panel for joe@bizooma.com.

---

## What You'll Get

### For All Users
- A "Help" or "Report Issue" button accessible from the dashboard sidebar
- Simple form to submit tickets with:
  - Subject line
  - Description of the issue
  - Auto-captured user email and account info
- Confirmation message after submission

### For Admin (joe@bizooma.com)
- New "Support" tab in the admin dashboard
- Table showing all submitted tickets with:
  - User email
  - Subject
  - Status (Open, In Progress, Resolved)
  - Submitted date
- Ability to update ticket status
- View full ticket details

### Email Notifications
- Automatic email to support@bizooma.com when a new ticket is created
- Email includes user details and issue description

---

## Technical Implementation

### Database Changes

**1. Create Support Tickets Table**
```text
+----------------+-----------+------------------------------------------+
| Column         | Type      | Purpose                                  |
+----------------+-----------+------------------------------------------+
| id             | uuid      | Primary key                              |
| user_id        | uuid      | The user who submitted the ticket        |
| user_email     | text      | User's email (for quick reference)       |
| subject        | text      | Brief description of the issue           |
| description    | text      | Detailed issue description               |
| status         | enum      | 'open', 'in_progress', 'resolved'        |
| admin_notes    | text      | Internal notes from admin (optional)     |
| created_at     | timestamp | When the ticket was submitted            |
| updated_at     | timestamp | When the ticket was last modified        |
+----------------+-----------+------------------------------------------+
```

**2. RLS Policies**
- Users can insert their own tickets
- Users can view their own tickets
- Admins can view and update all tickets

### Backend Changes

**1. Create `submit-ticket` Edge Function**
- Accepts ticket subject and description from authenticated users
- Inserts the ticket into the database
- Sends an email notification to support@bizooma.com via Resend
- Returns success/error status

**2. Create `admin-list-tickets` Edge Function**
- Admin-only access (verified via `has_role` function)
- Returns all tickets with user information
- Supports filtering by status

**3. Create `admin-update-ticket` Edge Function**
- Admin-only access
- Updates ticket status and/or admin notes

### Frontend Changes

**1. Support Dialog Component (`src/components/support/SupportDialog.tsx`)**
- Modal dialog with form
- Subject (input) and description (textarea) fields
- Submits to the `submit-ticket` edge function
- Shows loading and success states

**2. Update Dashboard Sidebar**
- Add "Help" or "Support" link with a help icon
- Opens the support dialog when clicked

**3. Admin Tickets Page (`src/pages/AdminTickets.tsx`)**
- New route `/admin/tickets`
- Table displaying all support tickets
- Status badges (Open = yellow, In Progress = blue, Resolved = green)
- Click to expand/view details
- Dropdown to update status

**4. Update Admin Dashboard**
- Add "Support Tickets" card showing count of open tickets
- Link to the tickets management page

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| Database migration | Create | Support tickets table + enum + RLS |
| `supabase/functions/submit-ticket/index.ts` | Create | Handle ticket submission + email |
| `supabase/functions/admin-list-tickets/index.ts` | Create | Fetch all tickets for admin |
| `supabase/functions/admin-update-ticket/index.ts` | Create | Update ticket status |
| `supabase/config.toml` | Modify | Add new functions |
| `src/components/support/SupportDialog.tsx` | Create | User-facing support form |
| `src/components/admin/TicketTable.tsx` | Create | Admin ticket list |
| `src/pages/Dashboard.tsx` | Modify | Add support button to sidebar |
| `src/pages/Admin.tsx` | Modify | Add tickets section/stats |
| `src/App.tsx` | Modify | Add admin tickets route (if separate page) |

---

## Email Template

When a ticket is submitted, support@bizooma.com will receive:

```
Subject: New Support Ticket: [User's Subject]

From: [User Email]
Submitted: [Date/Time]

Issue:
[User's Description]

---
View in Admin Dashboard: [Link to admin]
```

---

## Security Measures

1. **Authenticated Submissions**: Only logged-in users can submit tickets
2. **Admin Verification**: All admin endpoints verify role via `has_role` database function
3. **RLS Protection**: Database-level security ensures users can only see their own tickets
4. **Input Validation**: Subject and description validated for length and content

---

## User Experience Flow

### For Regular Users:
1. User clicks "Help" or support icon in dashboard sidebar
2. Dialog opens with a simple form
3. User enters subject and description
4. User clicks "Submit"
5. Loading spinner shown while processing
6. Success toast: "Ticket submitted! We'll get back to you soon."
7. Dialog closes

### For Admin:
1. Admin sees "Support Tickets" section in admin dashboard
2. Badge shows number of open tickets
3. Clicking opens ticket list with all submissions
4. Admin can view details and update status
5. Admin can add internal notes if needed
