# Daily transportation and notifications

## Activate

Run `supabase/005_transportation_notifications.sql` once in Supabase SQL Editor after migrations 002–004. Then run `supabase/verify_setup.sql`. These changes are prepared locally; they are not installed automatically by starting or deploying the app.

## Staff workflow

1. Sign in with an administrator-assigned Teacher or Admin account.
2. Open **Transportation → Staff transportation desk → Manage bus routes**. Enter the actual route, start/end points and stops in order. Archive unused routes to keep them out of new departure choices; historical services stay readable.
3. Open **Publish a daily departure**. Select a route, enter the bus name/number, service date, scheduled time and passenger information. Each bus run is a separate record. Publish actual runs for each day; no recurring or example services are generated automatically.
4. Choose **Update service** to report an estimated departure, boarding, departure, delay or unavailability. A cancelled service requires a reason.
5. Saving an unavailable/delayed service automatically creates a bus notice and an in-app notification. Restoring a cancelled service also creates an update. Re-saving identical service information does not create duplicate alerts. Staff writes, generated notices and alerts succeed or roll back together.

Students can view/filter services but cannot edit routes or departures. All assigned Teachers/Admins can manage campus transportation. Admins can also open it from the Admin panel shortcut.

## Passenger workflow

- Transportation opens on the current **Asia/Dhaka** service date; search by bus, stop or destination, or select another date/route.
- Scheduled and updated departure times are shown separately. An unavailable bus remains visible with its reason; the list never substitutes a previous day's schedule.
- The page refreshes every 30 seconds while visible and on return to the tab. The live list depends on staff keeping records current; it does not provide GPS tracking or guaranteed arrival predictions.
- The notification bell shows unread updates among the latest 100 notices since account creation. Read status belongs to each user. Course alerts inherit the underlying notice's audience; private course notices do not become public.
- Notifications are **inside CampusOS**, with polling while the workspace is open. Email, SMS and device push are not configured. Older notices remain available in Campus Notices.

## Pending live verification

- Apply 005 and check its schema/trigger grants.
- Staff creates a route and today's run; a Student sees it and cannot alter it through the API.
- Cancel with a reason: confirm both the bus notice and unread notification exist. Re-save unchanged information: confirm no extra notice. Restore service: confirm the update.
- Delay and update its estimate: confirm displayed Dhaka times and the alert.
- Student A marks read; Student B's unread state is unchanged.
- Publish a private course notice: another course's student cannot read its notification through the API.
- Cross Dhaka midnight: today's view moves to the next day without showing yesterday's runs. Deliberately selected historical dates remain selected.
- Try a failed save: input remains and no partial notice/alert appears.

Lint and build checks do not certify database policies or live writes. No actual timetable is included; authorized staff must enter current university information.
