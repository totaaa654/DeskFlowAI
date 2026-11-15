# DeskFlow AI

DeskFlow AI is a Windows desktop IT service desk built with Tauri 2, React, TypeScript, Tailwind CSS, shadcn/ui, and Supabase. Phase 3 adds four-tier role and invitation management while preserving the Phase 1 dashboard and Phase 2 authentication. Ticket management and AI troubleshooting are intentionally not implemented yet.

## Authentication and account-management capabilities

- Cloud Blue sign-in, invitation registration, recovery, and password reset screens in light and dark modes
- Supabase email/password authentication with persisted sessions and secure global sign-out
- Tauri `deskflowai://auth/callback` deep links for invitations and recovery
- Employee, IT Technician, IT Admin, and Super Admin profiles with role-specific navigation
- Protected application routes and account-state gates for invited, pending, active, and suspended users
- Administrator-selected invitation roles and optional departments
- Pending, accepted, expired, and revoked invitation tracking with resend/revoke controls
- IT Admin limits for everyday users and Super Admin-only administrator management
- PostgreSQL RLS, column-level grants, safe role defaults, and an administration audit table
- Trusted Supabase Edge Function for every privileged Auth Admin operation
- Last-active-Super-Admin and administrator self-lockout protection

The desktop bundle contains only the public Supabase project URL and publishable/anon key. It never contains a secret key or legacy service-role key.

## Prerequisites

- Windows 10 or 11 with Microsoft Edge WebView2
- Node.js 20 or newer
- Rust stable with the MSVC toolchain
- Visual Studio C++ Build Tools with **Desktop development with C++**
- A Supabase project and the Supabase CLI for migration/function deployment

## Local install

```powershell
cd "C:\Users\jozza galang\Desktop\Coding Projects\DeskFlowAI"
npm install
Copy-Item .env.example .env
```

Set only these public client values in `.env`:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
VITE_AUTH_REDIRECT_URL=deskflowai://auth/callback
```

Legacy projects may set `VITE_SUPABASE_ANON_KEY` instead of `VITE_SUPABASE_PUBLISHABLE_KEY`. Never place `sb_secret_...`, `service_role`, database passwords, or other administrative credentials in a `VITE_*` variable. Vite values are embedded in the desktop frontend.

## Configure Supabase securely

1. Link the local folder to your Supabase project and apply the migration:

   ```powershell
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```

2. In **Authentication → URL Configuration**, add this allowed redirect URL exactly:

   ```text
   deskflowai://auth/callback
   ```

   In **Authentication → Email Templates → Invite user**, keep the invitation button linked to `{{ .ConfirmationURL }}`. The Supabase verification URL confirms the email and then redirects to the allowed `deskflowai://auth/callback` URL. Test invitation links in the Tauri desktop app (`npm run tauri dev`), not the browser-only Vite preview.

3. In **Authentication → Providers → Email**, disable public user sign-ups. DeskFlow company accounts are created only through administrator invitations. Keep email/password authentication enabled.

4. In **Authentication → Emails → SMTP Settings**, enable custom SMTP. For the current Gmail configuration use `smtp.gmail.com`, port `587`, the full Gmail address as the username and sender address, and a Google App Password as the SMTP password. The Google account must have 2-Step Verification enabled to create an App Password. Do not use the normal Google account password.

   Supabase Auth is the only invitation-email caller: the trusted `admin-users` Edge Function calls `supabase.auth.admin.inviteUserByEmail()`, and Supabase Auth hands the message to the SMTP provider configured in the Dashboard. DeskFlow does not call Resend or Gmail directly. SMTP credentials belong in Supabase Dashboard, never in the Tauri `.env`, Edge Function source, or frontend.

5. Deploy the trusted administration function:

   ```powershell
   npx supabase functions deploy admin-users
   ```

   Hosted Supabase injects its server-side project credentials into the Edge Function runtime. For local function development only, put the required server credentials in `supabase/functions/.env`; that file is ignored by Git. Never copy them into the root `.env` or frontend.

6. Set the server-side redirect value for the function:

   ```powershell
   npx supabase secrets set AUTH_REDIRECT_URL=deskflowai://auth/callback
   ```

7. Bootstrap the first Super Admin. Create the user from **Authentication → Users** in the Supabase Dashboard, then run this once in the SQL Editor with the real email:

   ```sql
   update public.profiles
   set role = 'super_admin', status = 'active'
   where lower(email) = lower('first.admin@company.com');
   ```

   This manual bootstrap is intentionally out-of-band. There is no public “make me admin” function. Existing Phase 2 `admin` accounts migrate to `it_admin`; promote the designated owner to `super_admin` once after applying Phase 3.

8. For a custom Supabase domain, add that exact HTTPS/WSS origin to `app.security.csp` in `src-tauri/tauri.conf.json`. The included CSP permits standard `*.supabase.co` projects.

## Authorization model

`auth.users` owns authentication identity and password storage. `public.profiles` owns application authorization.

- A database trigger creates every profile as `employee` + `pending`, regardless of user-supplied metadata.
- Authenticated clients can read their own profile; active administrators can read all profiles.
- Clients can update only their own `full_name` column. They have no SQL grant to modify `role` or `status`.
- The invitation activation RPC only activates a signed-in, confirmed user whose tracked invitation is pending, unexpired, and matches the server-assigned role.
- The `admin-users` Edge Function validates the caller’s JWT, re-reads their active admin profile from PostgreSQL, then uses server-only admin credentials.
- Direct URLs and hidden-button manipulation do not bypass RLS or the Edge Function’s authorization check.
- IT Admins can manage only Employees and IT Technicians. Super Admins can manage every role.
- The function blocks administrator self-demotion/self-suspension and removal of the final active Super Admin.

## Run and validate

```powershell
npm test
npm run typecheck
npm run build
npm run tauri dev
```

Without `.env` values, the application intentionally shows a setup-required screen. That is not a simulated login: real authentication becomes available only after the Supabase backend is configured.

## Important files

```text
src/contexts/AuthContext.tsx                 Session restoration and auth actions
src/pages/auth/                              Login, invitation, and recovery UI
src/pages/UserManagementPage.tsx             Administrator account management
src/services/admin-users.ts                  User-scoped Edge Function client
supabase/migrations/*_phase_2_auth.sql        Profiles, grants, RLS, triggers, audit
supabase/functions/admin-users/index.ts       Trusted privileged operations
src-tauri/tauri.conf.json                    Deep-link scheme and CSP
```

## Current milestone boundary

Dashboard ticket data remains fictional from Phase 1. Do not treat it as a live ticket system. Phase 3 can build ticket management on top of this authentication and authorization foundation; it should add ticket-specific RLS before any live ticket data is exposed.
