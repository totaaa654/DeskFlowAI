# DESKFLOW AI — REVISE COMPLETE DEVELOPMENT ROADMAP AND EXPAND ACCOUNT MANAGEMENT

You are my senior software architect, IT Service Management specialist, Tauri desktop developer, and Supabase security engineer.

Project directory:

`C:\Users\jozza galang\Desktop\Coding Projects\DeskFlowAI`

## OBJECTIVE

I want DeskFlow AI to become a realistic, professional, enterprise-style IT Service Desk and Workflow Automation application.

Our previous roadmap is incomplete, especially for User Management, password administration, email management, account security, and help desk operations.

Your current task is to inspect the existing project and update the existing roadmap and `AGENTS.md` to reflect the comprehensive development plan below.

Do not rebuild features that already exist.

Do not implement all future phases immediately.

## 1. INSPECT THE EXISTING PROJECT

Before making changes:

- Read `AGENTS.md` and `ROADMAP.md`.
- Inspect the existing Tauri + React + TypeScript application.
- Examine Supabase authentication and migrations.
- Inspect the current sidebar and dashboard routes.
- Inspect the existing User Management screen.
- Inspect invitation handling, role changes, and account deactivation.
- Inspect the existing backend functions and RLS policies.
- Review existing tests and documentation.

Preserve all working functionality.

Only mark a roadmap task COMPLETE after verifying its implementation and available tests.

## 2. CORE APPLICATION SCOPE

DeskFlow AI is a Windows desktop IT Service Desk and Workflow Automation application.

Technology stack:

- Tauri 2
- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Lucide React
- Supabase PostgreSQL
- Supabase Auth
- Supabase Realtime
- Supabase Storage
- Supabase Edge Functions

It must work through the internet across multiple laptops, regardless of whether those laptops are on the same local network.

Initial scale target:

- 100 Employees
- 5 IT Technicians
- 1 IT Administrator
- Super Admin as a privileged account tier

Design: Cloud Blue with light and dark modes. Preserve the existing design system.

AI must ONLY support workflow administration.

Never implement AI troubleshooting, technical diagnosis, generated fixes, or autonomous technical remediation.

## 3. REVISED DEVELOPMENT PHASES

The roadmap contains these 15 phases, with detailed subtasks, dependencies, acceptance criteria, tests, and completion checklists.

### PHASE 1 — Desktop Application Foundation

- Tauri/React/TypeScript setup
- Cloud Blue design system
- Light and dark themes
- Sidebar and topbar
- Dashboard shell
- Role-aware navigation
- Reusable components
- Responsive desktop layouts
- Theme persistence
- Basic frontend tests

### PHASE 2 — Authentication

- Supabase email/password login
- Logout
- Session restoration
- Protected routes
- Forgot Password
- Reset Password
- Email verification
- Secure authentication redirects for Tauri
- Authentication error handling
- Session expiration and refresh
- Authentication tests

### PHASE 3 — COMPLETE USER AND ACCOUNT ADMINISTRATION

This phase is now a major priority.

The existing User Management and Invite User features must be enhanced rather than recreated.

#### 3.1 User Directory

Implement:

- View all authorized DeskFlow AI accounts
- Search by name, email, employee ID
- Filter by role, department, status
- Sort and paginate users
- View user profiles
- Show invitation status
- Show account creation and last sign-in information where available and authorized

#### 3.2 User Profile Administration

Allow authorized admins to:

- Edit user full name
- Edit department
- Edit employee ID
- Edit internal profile information
- Change authorized user roles
- Activate and deactivate accounts
- View account history

Protect privileged actions using backend authorization.

#### 3.3 Account Email Administration

Support:

- View current DeskFlow AI login email
- Allow a user to request an email change
- Allow authorized admins to initiate an email change
- Verify email ownership where applicable
- Check email uniqueness
- Handle pending email changes
- Notify affected users about sensitive changes
- Log who initiated and completed changes

Use Supabase Auth as the authoritative source of login email identity.

Do not change only the public profile email while leaving the authentication email unchanged.

Use a documented, secure recovery procedure for administrator-initiated changes.

#### 3.4 Password Administration

Implement secure account password management for DeskFlow AI ONLY.

Required features:

- Forgot Password
- Send Password Reset Email
- Change Own Password
- Admin-Initiated Password Reset
- Force Password Reset on Next Login
- Password policy validation
- Recovery failure and expired-link handling
- Account recovery audit logs

IMPORTANT:

Admins must NEVER be able to view, retrieve, export, or reveal existing user passwords.

Do not implement a View Password feature.

Do not store plaintext passwords in application tables, logs, or notifications.

Prefer secure password reset workflows.

If an administrator password replacement function is implemented, it must require strict privilege checks and must not expose passwords through the frontend, logs, or emails.

For forced password resets, enforce the restriction server-side and prevent access to protected application data until the reset is complete.

#### 3.5 Invitation Management

The Invite User feature already exists.

Enhance it to support:

- Full name
- Email address
- Department
- Role selection
- Employee
- IT Technician
- IT Admin
- Super Admin
- Pending invitations
- Accepted invitations
- Expired invitations
- Revoked invitations
- Resend invitation
- Invitation audit history
- Secure preassigned role handling

Permission rules:

IT Admin may invite Employees and IT Technicians.

Only Super Admin may invite IT Admins and Super Admins.

Invited users cannot select or elevate their own roles.

Invitation role assignments must be validated server-side.

#### 3.6 Account Access Management

Implement:

- Account activation
- Account deactivation
- Secure sign-out/session revocation
- Re-enable authorized accounts
- Prevent deactivated users from accessing protected data
- Protect against deactivating the final active Super Admin
- Handle stale sessions and authorization changes
- Confirm high-impact actions

Do not assume that updating an account's active flag automatically invalidates every session.

Implement actual access enforcement.

#### 3.7 Security and Role Management

Roles:

- Employee
- IT Technician
- IT Admin
- Super Admin

Enforce permissions using trusted server-side operations and PostgreSQL RLS.

Implement:

- Privilege escalation prevention
- Self-promotion prevention
- Admin permission restrictions
- Role change confirmation
- Initial Super Admin bootstrap
- Authorization tests
- Audit logging for sensitive administrative changes

#### 3.8 Account Detail Interface

Improve the existing User Management UI.

Clicking a user must open an account detail page or drawer containing:

- Overview
- Profile Details
- Login Email
- Role and Permissions
- Account Status
- Security Actions
- Invitation Information
- Activity and Audit History

Provide clearly labeled actions:

- Edit Profile
- Change Email
- Send Password Reset
- Change Role
- Revoke Sessions
- Deactivate/Reactivate

Only show permitted actions, and always enforce authorization on the backend.

### PHASE 4 — Core Ticket Management

- Ticket creation
- Unique ticket numbers
- Title and description
- Category and priority
- Attachments
- Ticket assignment
- Role-based ticket visibility
- Comments and internal notes
- Ticket status lifecycle
- Search, filtering, sorting, pagination
- Resolution recording
- Employee confirmation
- Reopening requests
- Ticket activity history

### PHASE 5 — Realtime Synchronization

- Realtime ticket updates
- Status synchronization
- Assignment synchronization
- Comment updates
- Realtime notification events
- Reconnect handling
- Multi-device synchronization tests
- Event deduplication
- Authorization-aware subscriptions

### PHASE 6 — Notifications and Email Communication

- In-app notification center
- Email delivery
- Ticket creation confirmation
- Assignment notification
- Status updates
- Resolution and closure notifications
- Email templates
- Notification preferences
- Email logs
- Delivery failure handling
- Retry policies

For development, use Supabase Auth with the configured Gmail SMTP provider for authentication emails.

Resend is not part of the intended development email setup.

Do not hardcode Gmail passwords or SMTP credentials.

Keep application notification emails separate from authentication emails where appropriate.

### PHASE 7 — Workflow Automation

- Configurable assignment rules
- Event-driven workflow triggers
- Follow-up reminders
- Pending ticket reminders
- Resolution confirmation
- Automatic closure rules
- Ticket reopening workflows
- Workflow execution history
- Error handling and retries
- Duplicate execution prevention
- Human approval requirements

### PHASE 8 — AI Workflow Assistance

AI is ONLY for workflow automation.

Allowed:

- Ticket classification
- Ticket categorization
- Administrative routing recommendations
- Email and notification drafting
- Ticket activity summaries
- Administrative workflow summaries

NOT allowed:

- AI troubleshooting
- Technical diagnosis
- Suggested technical solutions
- Generated remediation steps
- Autonomous infrastructure changes

Implement secure server-side inference, output validation, usage limits, approval workflows, logging, and failure fallback.

### PHASE 9 — SLA and Incident Prioritization

- Impact and urgency assessment rules
- Priority calculation
- Response targets
- Resolution targets
- Deadline calculation
- SLA breach detection
- Escalation policies
- Overdue ticket indicators
- SLA reporting

### PHASE 10 — Asset and Service Management

Create an appropriately scoped initial asset module.

- IT asset inventory
- Asset identifiers
- Device type
- Manufacturer/model
- Asset assignment to employees
- Serial number where appropriate
- Asset status
- Warranty information
- Related tickets
- Affected services

Keep this lightweight in the initial release.

Do not expand into remote device control, remote password management, or full endpoint management.

### PHASE 11 — Reports and Analytics

- Ticket volume dashboard
- Open and closed tickets
- Ticket category distribution
- Priority distribution
- Technician workload
- Resolution time
- SLA compliance
- Date filters
- Charts and trends
- CSV export
- Role-based report visibility

### PHASE 12 — System Configuration and Audit

- Departments
- Ticket categories
- Priority configuration
- Workflow settings
- Notification templates
- SLA policies
- Application preferences
- Audit logging
- Administrative activity history
- Data retention settings

### PHASE 13 — Security and Reliability Review

Security must be applied throughout development, not delayed until this phase.

Perform a final audit of:

- RLS permissions
- Server-side authorization
- Session handling
- Sensitive operations
- Password reset security
- Email change security
- Privilege escalation protection
- Rate limiting
- Logging and secret protection
- Data integrity
- Backup and recovery procedures
- Error handling

### PHASE 14 — Testing and Optimization

- Unit tests
- Integration tests
- Authentication tests
- Authorization tests
- Account management tests
- Ticket lifecycle tests
- Automation tests
- Realtime synchronization tests
- Multi-device tests
- Performance tests
- 106-account simulation
- Gradual concurrent-user load testing
- Failure and recovery testing

Do not claim performance capacity without measurable results.

### PHASE 15 — Windows Deployment

- Tauri Windows installer
- Application icon
- Version information
- Production configuration
- Installer validation
- Secure update strategy
- Signing considerations
- User documentation
- Administrator documentation
- Release checklist

## 4. REVISE THE SIDEBAR

Review and reorganize the existing Super Admin sidebar.

Suggested sections:

### WORKSPACE

- Dashboard
- Ticket Management
- My Work Queue
- Notifications

### ADMINISTRATION

- User Management
- Roles & Permissions
- Workflow Automation
- SLA Management
- Reports & Analytics
- Audit Logs

### SYSTEM

- System Configuration
- My Settings

Do not create duplicate navigation pages.

Merge overlapping existing pages where appropriate, preserving functionality and routes.

The Employee and Technician sidebars must show only their authorized features.

Do not create separate top-level sidebar items for every password and email action. Put account-specific actions inside User Management.

Preserve Cloud Blue themes, typography, spacing, collapsible sidebar, and existing polished UI appearance.

## 5. SECURITY REQUIREMENTS

All account operations apply ONLY to credentials and accounts belonging to DeskFlow AI.

DeskFlow AI does not control:

- Personal Gmail account passwords
- Windows login passwords
- Microsoft account passwords
- Google Workspace accounts
- Active Directory passwords
- Other external systems

Use Supabase Auth for authentication identity.

Use trusted backend functions for privileged administration.

Never expose service-role or secret keys in the Tauri frontend.

Never display existing user passwords.

Do not disable RLS to make functionality work.

Protect sensitive administrative actions with authorization, audit logs, and appropriate confirmation.

Do not invent implementations or mark work completed without verification.

## 6. UPDATE PERMANENT PROJECT FILES

Update:

- `ROADMAP.md`
- `AGENTS.md`

`ROADMAP.md` must contain:

- The complete 15-phase roadmap
- Detailed implementation checklists
- Dependencies
- Completion criteria
- Test requirements
- Current verified progress
- Next recommended task
- Known blockers
- Security requirements

`AGENTS.md` must require future Codex sessions to:

1. Read the roadmap.
2. Inspect current code.
3. Identify the next incomplete task.
4. Preserve existing features.
5. Implement approved work.
6. Test changes.
7. Update the roadmap.
8. Report completed work and limitations.

Do not create duplicate roadmap files.

## 7. CURRENT EXECUTION SCOPE

For this request:

1. Inspect the repository.
2. Update `ROADMAP.md` and `AGENTS.md`.
3. Reorganize the documented sidebar architecture.
4. Assess the existing User Management implementation.
5. Identify missing Phase 3 features.
6. Create a prioritized Phase 3 implementation checklist.
7. Report the exact recommended next coding task.

Do NOT implement all 15 phases immediately.

Do NOT delete or rebuild the existing User Management interface.

Do NOT perform destructive Supabase database operations without approval.

The next development priority should be completing Account Administration, including secure email changes, password reset management, user profiles, account access controls, and audit logging.

START NOW.
