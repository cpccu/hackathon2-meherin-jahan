# Verification record and acceptance checks

## Automated checks

Completed locally on 8 October 2026:

| Check | Result |
|---|---|
| `npm test` | 17 tests passed (signup validation, existing unit tests and SQL source regression checks) |
| `npm run lint` | Passed |
| `npm run build` | Passed; production files generated in `dist` |
| `node scripts/check-backend.mjs` | Nine live tables denied anonymous requests with HTTP 401 / PostgreSQL code 42501 |
| Git environment check | `.env.local` ignored; no environment files currently tracked |

The backend check uses the local publishable/anon key, performs read-only
requests and prints no credentials or records. It verifies signed-out denial,
not the correctness of permissions after signing in. The schema and policy
structure check later passed with `verify_setup.sql`; authenticated role
workflows and deployed-site checks remain unverified.

Run `npm test`, `npm run lint`, and `npm run build` locally. Unit tests cover
file validation, resource search/filters, attendance arithmetic and sourced
guide metadata. These do not prove that live Supabase policies or uploads work.
Run `supabase/verify_setup.sql` separately to inspect installed schema/grants.

## Email authentication update — 8 October 2026

- Lint and the production build passed after the six-digit email login changes.
- Login and signup guidance reviewed in the local browser. At 390px, login
  inputs remain 16px and the document does not overflow horizontally.
- Opening `?verified=1` without a valid confirmation session shows an invalid
  verification explanation instead of claiming success. Continue to login is
  provided. No account was created and no email/code was requested in review.
- Supabase Confirm Email, SMTP, signup/login templates and local redirect URLs
  were configured; migration 006 was applied and `verify_setup.sql` passed.
- In the latest manual check, login email delivered an eight-digit code instead
  of the six digits expected by the app. A new signup confirmation email did
  not arrive. OTP length and signup delivery still need troubleshooting.
- Existing 17-test result predates this authentication update; tests were not
  rerun for it. Live confirmation, OTP acceptance/resend, role checks and
  password-only session denial remain unverified. Follow
  [the activation and acceptance guide](EMAIL_VERIFICATION.md).

## Earlier creative public-page review — 8 October 2026

- Landing, login, signup and recovery checked at 320, 390, 768, 1280 and 1600px. Fixed the landing illustration's minimum-height/aspect-ratio overflow at 320px; final page width matches the viewport.
- Desktop landing/login/signup and phone landing/signup reviewed visually. Phone form input text is 16px; the decorative passport follows the form.
- Resource preview opens a native modal, focuses its close control, closes with Escape and restores focus to the destination button. Native dialog behavior supplies focus containment.
- Arrow-key role selection updates the passport; its optional cover opens without blocking the form. Password visibility toggles correctly, with a separate accessible input label.
- Bookshelf tabs respond to arrow keys and display the corresponding introduction. All three campus-day chapters remain ordinary readable content.
- Signup name, department, email and step survive login/signup switches; backward navigation retains details. No password was entered and no account was created. Valid/invalid credential rules are covered by pure unit tests.
- Recovery with no valid session shows an invalid/expired-link explanation and a working Request a new link action. No email was requested and no credential was changed.
- No browser console errors were observed in the review tab.
- Reduced-motion CSS and pointer eligibility/cleanup were inspected. Live OS reduced-motion emulation, password-manager autofill, completed signup review/submission, email confirmation, role-validating sign-in and valid-session password updates remain manual checks.
- Lint passed, all 17 tests passed and the final production build passed using reduced Node memory/workers on Windows.
- Screenshots: [landing](screenshots/creative-landing.jpg), [login](screenshots/creative-login.jpg), [signup](screenshots/creative-signup.jpg), [phone login](screenshots/creative-login-phone.jpg), [recovery](screenshots/creative-recovery.jpg).

Signed-in module layouts, draft dialogs, live uploads, registration/check-in and attendance writes still require authenticated acceptance checks. No live campus records were created during this public-page review.

## Authenticated acceptance checklist

### Transportation / public scrolling update — 8 October 2026

- Lint passed without warnings and production build passed for the transportation and notification components.
- Public header verified sticky at `top: 0` after scrolling to the feature section. Idle opacity reached 0.25; keyboard activity removed the idle state. Pointer/touch/focus listeners use the same wake path and are cleaned up on unmount.
- Landing at 320px has no horizontal overflow after the sticky-header change. Scroll reveal observers are installed and cleaned up; reduced-motion CSS keeps sections static and visible.
- Screenshot: [sticky public header](screenshots/sticky-public-header.jpg).
- Migration `005_transportation_notifications.sql` is prepared locally but has not been applied here. Live staff writes, generated notices, notification audience/privacy and personal read status remain pending. No bus records were invented or created.
- See [Transportation](TRANSPORTATION.md) for activation and acceptance steps. The 17-test result above is from the preceding public redesign; automated tests were not rerun for this update.

### Questions / bulk attendance / QR upgrade

Migration `004_questions_attendance_qr.sql` is prepared locally; its installation and the live flows below are pending. Lint and the production build have passed for the new components, with reduced Node memory/workers after Windows memory failures. Existing automated test results above predate these features and do not certify them.

- [ ] Student A asks a question; a teacher/admin replies; A sees the answer and can follow up. Student B cannot read either row through the API.
- [ ] Reply author/role fields cannot be supplied by a client; a Student cannot create a staff reply.
- [ ] Admin assigns unique university IDs; a Student/Teacher cannot change IDs through the API.
- [ ] Teacher pastes several enrolled IDs and saves once. Unknown IDs add no partial selection; duplicate IDs select each student only once.
- [ ] Unselected attendance is preserved by default; explicit mark-others-absent replaces only the selected session's roster.
- [ ] Other teachers/students cannot write attendance outside their authorized course.
- [ ] Registered attendee downloads a QR; the organizer scans camera/image/manual code and obtains server-confirmed admission.
- [ ] Unknown/cancelled/wrong-event/used QR tickets are rejected; two concurrent scans yield only one admission.
- [ ] Students cannot call the admission RPC successfully or cancel a checked-in registration.
- [ ] Denied camera permission offers image/code alternatives; closing the scanner stops camera tracks.

See [the upgrade workflow guide](QUESTIONS_ATTENDANCE_QR.md).

Use one Admin, two Students (A and B), and two Teachers (A and B).
Use clearly marked test entries and delete them when finished. Do not use real
private student records in a judge-facing demo. Reload after each saved record
to confirm it persisted. Check a second browser/account for visibility.

| Flow | Expected result |
|---|---|
| Signup as Teacher/Admin | Actual role stays Student until assigned by an admin |
| Login with the wrong role selected | Rejected with the actual assigned role shown |
| Confirmation, logout, password recovery | Email links return to the app; password updates; logout clears session |
| Upload PDF/DOCX/PPTX | Metadata persists; search by course/tag works; download opens |
| Empty/unsupported/over-20-MB resource | Rejected with an explanation |
| Private resource uploaded by Student A | Student B cannot see its row or download its storage path |
| Admin imports official guides twice | No duplicate questions; existing answers preserved |
| Helpdesk source and attachment | Source opens; image displays; PDF previews and downloads |
| Student tries Helpdesk/admin write via API | Database denies the operation |
| Admin campus notice with image/PDF | Visible on Home/Notices; preview and download work |
| Teacher A course notice | Only enrolled students/authorized staff see it; Teacher B cannot publish to that course |
| Admin creates event; student registers twice | One registration; unique persistent ticket code |
| Event owner or admin checks ticket | Correct attendee marked checked in; unknown/duplicate code rejected |
| Teacher B manages Teacher A event | Database denies edits/check-in; admin can edit it after migration 003 |
| Lost/found photo + description/location/date | Searchable persistent post; photo loads; owner/admin resolves it |
| Student A complaint | Receipt ID persists; A and admin see it; Student B and teachers cannot |
| Admin complaint reply/status | Student A sees the new response after refresh |
| Assigned teacher marks attendance | Enrolled student sees own records and calculated percentage |
| Another student/teacher reads or changes attendance | Database denies access outside assigned course/own records |
| Header and navigation at 390px and desktop widths | All modules reachable; header fixed while scrolling and wakes on interaction |
| Empty, network-error and retry states | Clear message and useful next action; no fabricated records |

UI hiding alone is not a permission test. For negative cases, try the same
table/storage operation through the Supabase API while signed into the account
being checked. Record the result without copying access tokens into screenshots
or the repository.

## Public-site checks — after deployment

- [ ] Fresh-browser signup and confirmation work at the final URL.
- [ ] Password recovery returns to the deployed site.
- [ ] Repeat upload/download, Helpdesk, event registration/check-in and complaint reply.
- [ ] No browser console errors or failed app assets.
- [ ] Dedicated judge accounts are confirmed and correctly assigned.
- [ ] Current official bus route/time notice has been published.
- [ ] Live, repository and demo video links are accessible to judges.

Authenticated and deployed checks must be recorded as passed only after they
have actually been performed. Neither a successful build nor this checklist
certifies live end-to-end functionality.
