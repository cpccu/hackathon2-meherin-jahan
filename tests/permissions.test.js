// Source regression checks only. Run verify_setup.sql and account workflow
// checks against Supabase to verify installed policies and runtime behavior.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const sql=readFileSync(new URL('../supabase/002_campus_modules.sql',import.meta.url),'utf8')
const fix=readFileSync(new URL('../supabase/003_event_permissions.sql',import.meta.url),'utf8')
test('new members receive student access regardless of requested signup role',()=>{
  assert.match(sql,/insert into public\.account_roles\(user_id,role\) values\(new\.id,'student'\)/)
})
test('complaints and attendance source policies restrict reads to owner or authorized manager',()=>{
  assert.match(sql,/complaint_read[^;]+submitted_by=auth\.uid\(\) or public\.campus_role\(\)='admin'/)
  assert.match(sql,/attendance_read[^;]+student_id=auth\.uid\(\) or public\.manages_course\(course_id\)/)
})
test('event patch preserves ownership and only grants editable field updates',()=>{
  assert.match(fix,/revoke update on public\.campus_events from authenticated/)
  assert.match(fix,/grant update\(title,club,event_type,starts_at,location,description\)/)
  assert.doesNotMatch(fix,/grant update\([^)]*created_by/)
})
test('ticket updates are limited to check-in timestamp',()=>{
  assert.match(sql,/grant update\(checked_in_at\) on public\.event_registrations to authenticated/)
  assert.doesNotMatch(sql,/grant update\([^)]*checkin_code/)
})
