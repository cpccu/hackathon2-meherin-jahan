# Helpdesk conversations, bulk attendance and QR entry

## Activate the upgrade

In Supabase SQL Editor, run the full contents of **`supabase/004_questions_attendance_qr.sql`**, after migrations 002 and 003. Migration 004 can be rerun and preserves existing records. Then run `supabase/verify_setup.sql` and refresh CampusOS.

The migration adds private Helpdesk conversations, administrator-assigned university IDs and atomic ticket check-in. Existing registrations retain their ticket codes and automatically receive a QR image in the application. No schedules, students, courses or attendance records are seeded.

## Student questions and staff answers

1. Student opens Smart Helpdesk → Ask the Helpdesk → Ask a question.
2. Enter a title, topic and details, then send once.
3. Teachers and administrators see Student questions in Smart Helpdesk and reply to a conversation.
4. The student sees the staff name, role, timestamp and answer, and can add a follow-up.

Conversations refresh every 30 seconds while the page is visible and when returning to it. Manual Refresh is also available. A conversation whose latest reply is from staff shows **Staff replied**; a student follow-up makes it **Waiting for staff** again. There are no email or push notifications in this version.

Questions/replies are readable only by their student author and authenticated teachers/admins. Staff identity on replies is stamped by the database; clients cannot invent another author or role. Published, sourced FAQ guidance remains separate and continues to work.

## Assign university IDs

Admin panel → Account permissions → open a Student account → enter its verified university student ID → Save university student ID.

IDs are unique, stored as uppercase text, and accept 2–50 letters/numbers with hyphens or slashes. Students can see their assigned ID in Profile. Teachers see IDs in the enrollment selector and attendance roster. Database account UUIDs still link records internally; a university ID is not an authentication credential. No ID is inferred from a student's email or invented automatically.

## Bulk class attendance

1. Open an assigned course, enroll its actual students and create/select a class session.
2. Paste multiple university IDs separated by spaces, commas or lines, then choose **Add these IDs to selection**. Unknown IDs stop the whole import so mistakes are visible.
3. Alternatively, search the roster by ID/name and tick multiple students. **Select all shown** adds the filtered results; **Clear selection** removes the current selection.
4. Choose Present, Late, Excused or Absent for the selection.
5. Save once to write every selected student's attendance in one database request.

Unselected students retain their existing mark by default. Optionally choose **Mark every unselected enrolled student Absent**; the form explains how many records will be replaced before saving. The same session can be reopened for corrections. Only an assigned teacher or administrator can write attendance; students read their own records.

## QR tickets and entry admission

1. Student registers for an upcoming event. The registration's existing random ticket code becomes a downloadable QR ticket.
2. Student shows the QR on a phone or as a saved image at the entrance.
3. The event's teacher organizer or an administrator opens **Attendees & check-in → QR entry check-in**.
4. Start the rear-camera scanner, read a QR image, or use the manual ticket-code fallback.
5. A server-confirmed **Entry approved** result identifies the attendee and records check-in. The organizer can scan the next attendee's ticket.

The QR encodes its event ID and random ticket code, without a student's name, email or university ID. Image decoding happens on the organizer's device; images/video are not uploaded. [qrcode](https://github.com/soldair/node-qrcode) generates tickets and [jsQR](https://github.com/cozmo/jsQR) decodes images.

The server checks organizer/admin permission and looks up an existing registration for that specific event. A row lock prevents two simultaneous scanners consuming one ticket. Unknown, cancelled, wrong-event and already-used tickets are rejected. Students cannot check themselves in through the database API. Checked-in registrations cannot be cancelled to obtain another admission; removing an event still removes its registrations.

Camera access requires browser permission and HTTPS on deployment (localhost also works). If denied or unavailable, use image upload or the ticket-code fallback. Cameras stop on leaving the screen, stopping the scanner or reading a ticket. A network failure never displays admission approval.

Tickets are bearer passes: anyone holding a copied QR could present it first. Organizers should check student identity where required. There is no offline admission mode or physical gate integration.

## Activation and acceptance status

Implementation is local until migration 004 is applied to the configured Supabase project. Live authenticated questions, roster saves, camera permission and competing-scanner behavior require acceptance checks after activation. The schema verification script is read-only and does not replace those checks.
