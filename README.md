<p align="center">
  <img src="public/favicon.svg" alt="CampusOS logo" width="64" height="64">
</p>

<h1 align="center">CampusOS</h1>

<p align="center"><strong>A digital campus hub for City University</strong></p>
<p align="center">Course resources · Campus guidance · Clubs & events · Student support</p>

<p align="center">
  <a href="#overview">Overview</a> ·
  <a href="#features">Features</a> ·
  <a href="#getting-started">Getting started</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#hackathon-coverage">Hackathon coverage</a>
</p>

---

## Overview

CampusOS brings everyday university tasks into one workspace for **Students, Teachers and Administrators**. Built for the **CPCCU AI-Powered Web App Development & Deployment Hackathon 2026**, it covers all four proposed core modules and adds campus notices, course enrollment and attendance.

Students can find study material, read sourced campus guidance, register for events and follow support requests. Authorized staff publish information and manage academic records. Application forms save records and files in Supabase.

**Project stage:** local implementation with Supabase migrations and initial email settings configured. Public deployment and end-to-end account checks remain pending. The latest auth check found an eight-digit email code where the app expects six, and new-signup confirmation delivery still needs troubleshooting. [View verification status →](docs/VERIFICATION.md)

### The problem it addresses

Campus information can be scattered across group chats, social media, personal drives and notice boards. CampusOS gives students a consistent place to find information and act on it.

| Everyday CU situation | What CampusOS provides |
| :--- | :--- |
| Finding past papers the night before an exam | Course search, Question Paper filters and downloads |
| Learning university procedures as a new student | Organized Helpdesk answers with official source links |
| Checking a class change or campus closure | Published campus/course notices with viewable attachments |
| Joining a club workshop | Event discovery, RSVP and a check-in ticket |
| Recovering a calculator or student ID | Searchable lost/found reports with photos and locations |
| Following up on a complaint | A private receipt, status updates and administrator replies |
| Reviewing attendance | Actual class records entered by authorized staff |

## Features

### Resource Hub

A searchable archive for notes, past papers, lab manuals and notices.

- Upload **PDF, DOCX or PPTX** files up to **20 MB**.
- Organize material by department, course, category, subject and tags.
- Search metadata, combine filters and sort results.
- Preview PDFs, download files and bookmark resources locally.
- Share Public resources with signed-in users; keep Private resources accessible only to the uploader.

### Smart Helpdesk

A structured source of campus guidance maintained by administrators.

- Browse Bus, Exam, Rules, Academic and General topics.
- Search questions, answers and keywords.
- Check source labels, official links and update dates.
- View notice images and preview/download PDF attachments.
- Publish/edit answers or review/import six official CU guides checked **8 October 2026**.

Students can also ask private questions, receive teacher/admin replies and follow up in the same conversation. Conversations refresh automatically while the Helpdesk is open.

Published Helpdesk guidance uses FAQ search. Current bus stops/times and exam routines require dated university notices; imported guidance does not supply a live timetable.

### Club & Event Engine

A shared feed of club and department activities.

- Browse event details: host, type, date/time, location and description.
- Filter by club, type, Bangladesh date or keywords.
- RSVP, receive a unique ticket code and cancel registration.
- Let event owners/admins view attendees and check in tickets.
- Reject unknown or already checked-in tickets.

Registered attendees receive downloadable QR tickets. Event organizers/admins scan them with a camera, read a ticket image or use the code fallback. Server verification rejects wrong-event and already-used tickets.

### Lost & Found / Complaint Box

Two connected support workflows with different visibility rules.

- **Lost & Found:** publish a photo, description, contact information, location and date; search/filter reports and resolve or reopen them. Photos accept JPG, PNG and WebP up to **5 MB**.
- **Complaints:** submit privately, retain a tracking ID and follow Received, In progress or Resolved status. Administrators reply; other students and teachers cannot read someone else's complaint.

### Additional campus tools

| Feature | Capabilities |
| :--- | :--- |
| Campus notices | Campus-wide or assigned-course updates; image/PDF previews and downloads |
| Transportation | Daily staff-published bus runs, route stops, departure estimates, availability and automatic service-change notices |
| Notifications | In-app notice alerts, unread bell badge and personal read status; refreshes every 30 seconds |
| Courses & attendance | Verified university IDs, course enrollment, class sessions and bulk attendance by pasted IDs or roster selection |
| Dashboard | Saved-content statistics, recent notices and quick actions |
| Accounts | Signup email confirmation, six-digit email login codes, assigned-role checks, sessions, logout and recovery |
| Responsive workspace | Fixed sidebar, mobile drawer, sticky header, keyboard focus and reduced-motion support |
| Feedback | Loading skeletons, retained content during refresh, retries, success messages and unsaved-form warnings |

Smart Helpdesk follows **Courses & Attendance** in the main navigation.

## Design and experience

Warm ivory surfaces, burgundy branding and forest/sage accents give CampusOS one consistent visual identity. The public experience follows **“A campus that comes alive”**: an original SVG campus scene blends with photography, four destinations open accessible previews, and three short chapters introduce a campus day. Bookshelf, conversation and ticket illustrations give modules distinct visual personalities.

Login, signup and recovery share a decorative campus passport and paper desk. Role choices update the preview; signup guides users through personal details, account access and review while retaining input across steps and login/signup switches. Staff requests require administrator assignment, and confirmation screens follow the actual Supabase response. Decorative motion respects reduced motion and skips narrow/touch layouts. Operational pages retain readable records, notice filters, loading states and unfinished-form warnings.

[Read the design system →](docs/DESIGN_SYSTEM.md)

## Roles and workflows

### Access model

| Role | Workspace responsibilities |
| :--- | :--- |
| **Student** | Find/share resources, read permitted notices, register for events, report items, submit complaints and view own attendance |
| **Teacher** | Student-facing tools plus assigned-course notices, enrollment/attendance and management of own events |
| **Admin** | Manage staff roles, Helpdesk content, campus notices, courses, events and complaint responses |

**Staff access requires approval.** Selecting Teacher or Admin at signup records the requested role. Every new account receives Student access until an administrator assigns verified staff permissions. Login checks the assigned database role.

PostgreSQL **row-level security (RLS)** and column grants enforce access. Private resources remain uploader-only, complaints are visible to their author/admins, and attendance follows student ownership or authorized course management.

### Account workflow

1. Choose account type and submit name, department, email and password.
2. Supabase creates the identity, profile and Student role.
3. Open the signup email and click **Verify email**. Enable Supabase Confirm email before registration.
4. An administrator assigns verified staff access where appropriate.
5. Choose the assigned role, request a six-digit email code and verify it to enter the workspace.

Regular login uses email codes instead of passwords. Password recovery remains available and returns to code login. [Activate email confirmation, templates, SMTP and database protection →](docs/EMAIL_VERIFICATION.md)

### Content workflow

| Module | Publish | Discover/use | Complete the loop |
| :--- | :--- | :--- | :--- |
| Resources | Upload file and metadata | Search, preview, download | Save a browser bookmark |
| Helpdesk | Admin publishes sourced answers | Browse/search topics | Admin updates information |
| Events | Staff creates an event | Student registers | Authorized staff checks in ticket |
| Lost/found | User posts photo and details | Search and contact poster | Owner/admin resolves report |
| Complaints | User submits privately | Follow tracking ID/status | Admin replies and updates status |

**Teaching workflow:** admin assigns Teacher access and creates a course → teacher enrolls students → shares course resources/notices → creates class sessions → records attendance → students review their own records.

## Getting started

### 1. Install

Use Node.js/npm compatible with the installed dependencies, Git and a Supabase project with email/password authentication.

```sh
git clone https://github.com/cpccu/hackathon2-meherin-jahan.git
cd hackathon2-meherin-jahan
npm install
```

Run npm commands from the folder containing `package.json` if the application is inside a subfolder.

### 2. Configure the environment

Copy `.env.example` to `.env.local`, then replace the placeholders:

```ini
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

Use the Supabase **base URL**, without `/rest/v1`, and its publishable or legacy anon key. Vite exposes `VITE_` configuration to browser code: never use a service-role/secret key. RLS controls data access. `.env.local` is ignored by Git.

### 3. Activate the database

Run these in the same Supabase project, in order:

| Script | When to run |
| :--- | :--- |
| `supabase/setup.sql` | Once: original resources, Helpdesk and storage |
| `supabase/002_campus_modules.sql` | Once, after setup: roles and remaining modules |
| `supabase/003_event_permissions.sql` | After 002: event editing permissions; safe to rerun |
| `supabase/004_questions_attendance_qr.sql` | After 003: private questions/replies, university IDs and secure QR check-in; safe to rerun |
| `supabase/005_transportation_notifications.sql` | Once, after 004: daily bus services and notice notifications |
| `supabase/006_email_verification_access.sql` | After 005: confirmed email/OTP session restrictions; safe to rerun |
| `supabase/verify_setup.sql` | Read-only installed-schema and permission checks |

**Existing installations:** skip setup and migration 002 if they already succeeded.

Follow [the activation guide](supabase/ACTIVATE_CAMPUS.md) to assign the first administrator. Use the Admin panel to assign further staff roles.

For member signup/login, follow [email authentication setup](docs/EMAIL_VERIFICATION.md). Confirm email, both templates, SMTP, local callback URLs and migration 006 have been configured. Verify that signup confirmation reaches a new member and set the Supabase email OTP length to six before treating authentication as complete.

### 4. Start the application

```sh
npm run dev
```

Open Vite's printed local URL and keep the terminal running. Restart the server after environment changes.

### 5. Add campus content

The initial setup includes two CampusOS usage guides. Admins can review/import six sourced CU guides, then publish actual dated bus schedules, exam routines and notices. Create genuine courses/enrollments, upload permitted resources and enter real event details.

No attendance, event or live bus timetable is invented or seeded. Provide dedicated confirmed demo accounts to judges through the submission form; keep passwords and private student records out of Git.

## Architecture

```text
React interface
    │
    └── Supabase JavaScript SDK
          ├── Auth          Identity, sessions and recovery
          ├── PostgreSQL    Records, relationships and RLS
          └── Storage       Private documents and images

Vite production build → dist/
```

Browser actions call Supabase directly; this version has no separate custom application server. React state manages navigation. Data refreshes when modules open or users select Refresh.

### Tools and their responsibilities

| Tool | Used for | Main location |
| :--- | :--- | :--- |
| React 18 / React DOM / JSX | Pages, forms and interactive state | `src/` |
| CSS / SVG | Layout, typography, responsive styling and icons | Stylesheets, `CampusIcon.jsx` |
| qrcode / jsQR | Ticket QR images and camera/image decoding | `EventQR.jsx` |
| Vite / React plugin | Development server and production assets | `vite.config.js` |
| Supabase SDK | Auth, database and Storage API calls | `supabaseClient.js`, data modules |
| Supabase Auth | Signup, login, sessions and recovery | `Auth.jsx`, `PasswordRecovery.jsx`, `App.jsx` |
| PostgreSQL / SQL / RLS | Persistence, constraints and authorization | `supabase/` |
| Supabase Storage | Uploads, previews and downloads | Resources, notices and lost/found |
| Node.js / npm | Dependencies and project commands | `package.json` |
| ESLint | Static code checks | `eslint.config.js` |
| Node test runner | Unit and SQL source regression checks | `tests/` |
| Browser APIs/storage | Downloads, clipboard and bookmarks | File actions and saved resources |

**Development tools:** Bolt supported initial frontend prototyping; Codex assisted local implementation, debugging and documentation. VS Code/terminal supported local development, Git/GitHub handles version control, and the Supabase dashboard handles backend configuration.

Bolt and Codex are development tools, not runtime dependencies. The current application uses structured FAQ/keyword search and has no LLM API integration.

<details>
<summary><strong>Database and file storage reference</strong></summary>

| Area | Tables |
| :--- | :--- |
| Identity | `auth.users`, `member_profiles` (verified university IDs), `account_roles` |
| Resources / Helpdesk | `resources`, `helpdesk`, `helpdesk_questions`, `helpdesk_replies` |
| Academic | `campus_courses`, `course_enrollments`, `class_sessions`, `attendance_records` |
| Notices | `campus_notices` |
| Transportation | `transport_routes`, `transport_departures` |
| Notifications | `campus_notifications`, `notification_reads` |
| Events | `campus_events`, `event_registrations` |
| Support | `lost_found_posts`, `campus_complaints` |

| Private bucket | Files | Maximum size |
| :--- | :--- | :--- |
| `campus-resources` | PDF, DOCX, PPTX | 20 MB |
| `campus-documents` | PDF, DOCX, PPTX, JPG, PNG, WebP | 20 MB |
| `campus-photos` | JPG, PNG, WebP | 5 MB |

Files use account-specific folders. Storage policies check ownership or permitted linked records. Resource PDF previews use short-lived signed URLs; notice previews/downloads use authorized requests. Failed record creation cleans up new uploads where possible.

</details>

<details>
<summary><strong>Project structure and component responsibilities</strong></summary>

```text
CampusOS Meherin/
├── public/                   Campus images and favicon
├── src/
│   ├── main.jsx              Startup and loading fallback
│   ├── App.jsx               Sessions and page state
│   ├── Landing.jsx           Interactive campus story and module introductions
│   ├── CampusScene.jsx       Original SVG campus and accessible destinations
│   ├── DestinationPreview.jsx Accessible module preview dialogs
│   ├── Passport.jsx          Decorative role-aware campus passport
│   ├── Auth.jsx              Login and three-step account creation
│   ├── EmailCodeLogin.jsx    Email code request, verification and role check
│   ├── SignupConfirmation.jsx Signup verification and resend feedback
│   ├── EmailVerification.jsx Real email-confirmation callback state
│   ├── emailSession.js       Email-session navigation check (RLS enforces access)
│   ├── PasswordField.jsx     Labelled password visibility controls
│   ├── authValidation.js     Shared signup validation
│   ├── creative.css          Public campus/passport compositions
│   ├── RoleSelector.jsx      Keyboard-operable account type controls
│   ├── PasswordRecovery.jsx  Recovery request and password update
│   ├── CampusShell.jsx       Navigation, header and workspace
│   ├── Dashboard.jsx         Overview and recent content
│   ├── ResourceHub.jsx       Resource browsing, uploads and file actions
│   ├── Helpdesk.jsx          Sourced answers and search
│   ├── HelpdeskQuestions.jsx Private questions and staff replies
│   ├── Events.jsx            Discovery and registration
│   ├── EventQR.jsx           QR tickets and secure check-in scanner
│   ├── LostFound.jsx         Item reports and complaints
│   ├── Notices.jsx           Campus/course announcements
│   ├── Academic.jsx          Enrollment and class sessions
│   ├── BulkAttendance.jsx    Multi-student attendance by IDs/roster
│   ├── AdminPanel.jsx        Roles and Helpdesk management
│   ├── Attachments.jsx       Image/PDF previews and downloads
│   ├── CampusUI.jsx          Shared forms, skeletons and feedback
│   ├── Profile.jsx           Real account details and saved resources
│   ├── UnsavedDialog.jsx     Draft confirmation dialog
│   ├── useDraftGuard.jsx     Protection for in-page form switches
│   ├── CampusIcon.jsx        SVG icons
│   ├── campusData.js         Queries, mutations and loading helpers
│   ├── supabaseClient.js     Supabase configuration
│   ├── useResources.js       Resource loading and bookmarks
│   ├── resourceUtils.js      Metadata, validation and filters
│   ├── attendanceUtils.js    Attendance calculation
│   ├── documentUpload.js     Attachment uploads
│   ├── officialGuides.js     Sourced CU guidance dataset
│   ├── design.css            Shared tokens and complete visual redesign
│   └── *.css                 Base and workspace styling
├── supabase/                 Migrations, policies and activation guide
├── tests/                    Unit and SQL source regression checks
├── scripts/                  Read-only backend diagnostic
├── docs/                     Verification and submission guides
├── .env.example              Public configuration placeholders
├── .gitignore                Local-file exclusions
└── package.json              Dependencies and commands
```

</details>

## Verification

### Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Development server |
| `npm run lint` | Static code checks |
| `npm test` | Unit and SQL source regression checks |
| `npm run build` | Production assets in `dist/` |
| `npm run preview` | Local preview of the production build |
| `node scripts/check-backend.mjs` | Anonymous access diagnostic; prints no credentials or records |

### Recorded checks — 8 October 2026

| Check | Recorded result |
| :--- | :--- |
| Automated tests | 17 passed before the email-auth update; not rerun for that update |
| Lint / production build | Passed |
| Anonymous database access | Nine live tables denied reads: HTTP 401 / code 42501 |
| Environment tracking | `.env.local` ignored; no environment files tracked |
| Supabase schema/RLS check | `verify_setup.sql` passed after migrations 003–006 on 8 October 2026 |

These checks cover unit behavior, selected SQL source rules, signed-out denial and installed schema/policy structure. Authenticated role checks and successful new-member confirmation remain unverified. Follow [the acceptance checklist](docs/VERIFICATION.md).

The six-digit email login update passed lint and production build. Phone login
layout and the invalid confirmation callback were reviewed. SMTP and templates
are configured for initial testing; login delivered an eight-digit code and
new-signup confirmation did not arrive in the latest manual check. The six-digit
OTP setting and signup email delivery still need verification.

## Current limitations

- Staff must maintain accurate, current official information.
- Attendance counts Present/Late as attended, excludes Excused and ignores unmarked classes. Confirm this formula with CU before treating it as official policy.
- Bookmarks stay on the current browser. Transportation and notifications poll every 30 seconds while visible; other modules use their existing refresh behavior. Bus timings are staff-reported, without GPS tracking.
- Camera QR scanning needs HTTPS/localhost and browser permission; ticket images/codes provide alternatives.
- Campus announcement email/push notifications, offline admission and per-page deep links are not implemented. Gmail SMTP is currently used for initial auth testing; signup email delivery is still under verification, and a transactional email provider is recommended before wider rollout.
- AI summaries, semantic search and image matching are possible future additions.
- Full authenticated acceptance checks still require dedicated accounts and installed-policy verification.

## Documentation

| Guide | Purpose |
| :--- | :--- |
| [Activation](supabase/ACTIVATE_CAMPUS.md) | Database installation and first-admin setup |
| [Email verification](docs/EMAIL_VERIFICATION.md) | Signup confirmation, six-digit code login, SMTP and access policies |
| [Verification](docs/VERIFICATION.md) | Recorded evidence and remaining acceptance checks |
| [Submission](docs/SUBMISSION.md) | Project description and submission fields |
| [Questions, attendance & QR](docs/QUESTIONS_ATTENDANCE_QR.md) | Upgrade activation and staff/student workflows |
| [Transportation](docs/TRANSPORTATION.md) | Daily bus management, automatic notices and in-app notifications |
| [Design system](docs/DESIGN_SYSTEM.md) | Implemented palette, components, motion and interaction rules |
| [UI/UX upgrade brief](docs/UI_UX_UPGRADE_PROMPT.md) | Original redesign brief |

---

## Hackathon coverage

### Problem set responses

### What campus problem does the project address?

Campus information and student services are spread across chats, notice boards and personal drives. CampusOS brings academic materials, campus guidance, events and student support into one role-based web app for City University.

### Which requested features are included?

| Problem set feature | CampusOS response |
| :--- | :--- |
| **Resource Hub** | Members search and filter course resources, upload permitted files, preview PDFs, download materials and keep private uploads restricted to their owner. |
| **Smart Helpdesk** | Students search sourced campus FAQs or submit private questions; teachers/admins can respond. Admins maintain guidance and attachments. |
| **Club & Event Engine** | Staff publish events; students register and receive unique QR tickets; authorized organizers scan and validate tickets at entry. |
| **Lost & Found / Complaint Box** | Members post searchable lost/found reports with photos. Complaints remain private to their author and administrators, with a receipt, status and replies. |

### How does it support different campus roles?

Students use resources, events, support and their own attendance records. Teachers manage assigned-course notices, rosters and attendance. Administrators maintain campus information, answer Helpdesk questions and assign staff permissions. Selecting Teacher or Admin at signup is a request; database permissions remain Student until an administrator assigns the role.

### What additional campus needs does it cover?

Campus-wide and course notices support image/PDF viewing and downloads. Courses and attendance include roster/ID-based bulk marking. Transportation lists staff-maintained routes and daily departures, with service-change notices and in-app notifications. These tools depend on accurate current information entered by university staff.

### What technology and safeguards are used?

CampusOS uses React, Vite and CSS with Supabase Auth, PostgreSQL, Row Level Security and private Storage. QR tickets support event admission. Authentication is designed for signup email confirmation and six-digit email-code login. The database migration check passed; live signup-email delivery and the configured OTP length still need final verification. The Helpdesk uses sourced FAQ and keyword search; no AI capability is claimed.

### Presentation demo

Google Drive presentation/demo video link:

---

Built for the City University community · [CPCCU organization repository](https://github.com/cpccu/hackathon2-meherin-jahan)
