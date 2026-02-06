

# Admin Dashboard Implementation Plan

## Overview
This plan implements a secure admin system for joe@bizooma.com, providing Pro Plus functionality and a user management dashboard with tools to monitor the SaaS website.

---

## What You'll Get

### 1. Admin Access
- joe@bizooma.com will be designated as the site owner/admin
- Automatic Pro Plus tier features (unlimited maps, nodes, CSV import, URL crawler)
- Special admin dashboard section visible only to this account

### 2. User Management Dashboard
A new "Admin" tab in your dashboard with:
- **User List Table** showing:
  - Email address
  - Current plan tier (Free, Pro, Pro Plus, Team)
  - Subscription start date
  - Account status
- **User Actions**:
  - Pause user (disable their account temporarily)
  - Delete user (permanently remove account and their data)

---

## Technical Implementation

### Database Changes

**1. Create User Roles Table**
A secure `user_roles` table to store admin status:
```text
+-------------+------+---------------------------+
| Column      | Type | Purpose                   |
+-------------+------+---------------------------+
| id          | uuid | Primary key               |
| user_id     | uuid | References auth.users     |
| role        | enum | 'admin', 'moderator', 'user' |
+-------------+------+---------------------------+
```

**2. Create Security Helper Function**
A `SECURITY DEFINER` function `has_role(user_id, role)` to safely check admin status without recursive RLS issues.

**3. Assign Admin Role**
Insert joe@bizooma.com (user_id: `0b1e759c-ee6e-4889-a858-e47f644d5725`) with the `admin` role.

### Backend Changes

**1. Update `check-subscription` Edge Function**
- Check if user has admin role in `user_roles` table
- Return `is_admin: true` and override plan to `proplus` for admins

**2. Create `admin-list-users` Edge Function**
- Fetches all users with their email, created date
- Cross-references with Stripe to get subscription status
- Only accessible by users with admin role

**3. Create `admin-manage-user` Edge Function**
- Handles pause/delete user actions
- Verifies caller has admin role before executing
- Deletes user from auth.users (cascades to remove their data)

### Frontend Changes

**1. Update Subscription Hook (`useSubscription.tsx`)**
- Add `isAdmin` flag to subscription state
- Override plan checks for admin users

**2. Create Admin Dashboard Components**
- New "Admin" tab in sidebar (visible only to admins)
- User list table with search/filter
- Action buttons for pause/delete with confirmation dialogs

**3. Create Admin Page (`/admin`)**
- Protected route only accessible to admin users
- Overview stats (total users, subscribers, etc.)
- Full user management table

---

## Security Measures

1. **Server-Side Role Verification**: All admin actions verified via edge functions using the `has_role` database function
2. **No Client-Side Storage**: Admin status determined from database, not localStorage
3. **RLS Policies**: Admin role checks use SECURITY DEFINER functions to prevent recursive policy issues
4. **Cascading Deletes**: User deletion properly removes all associated data (maps, profiles, views)

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| Database migration | Create | User roles table + admin assignment |
| `supabase/functions/check-subscription/index.ts` | Modify | Add admin role check |
| `supabase/functions/admin-list-users/index.ts` | Create | Fetch all users with subscription data |
| `supabase/functions/admin-manage-user/index.ts` | Create | Pause/delete user actions |
| `src/hooks/useSubscription.tsx` | Modify | Add isAdmin state |
| `src/pages/Admin.tsx` | Create | Admin dashboard page |
| `src/components/admin/UserTable.tsx` | Create | User list with actions |
| `src/App.tsx` | Modify | Add admin route |
| `src/pages/Dashboard.tsx` | Modify | Add admin link in sidebar |

---

## User Experience

Once implemented, when joe@bizooma.com logs in:
1. Dashboard sidebar shows new "Admin" navigation item
2. Clicking "Admin" opens the user management dashboard
3. Full user list with subscription details displayed
4. Can pause or delete any user with confirmation prompts
5. Pro Plus features are automatically unlocked regardless of Stripe subscription

