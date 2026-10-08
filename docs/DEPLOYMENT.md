# Push and deploy CampusOS

## Before pushing

1. If `setup.sql` and `002_campus_modules.sql` already succeeded, **do not rerun them**.
2. Run `supabase/003_event_permissions.sql` in Supabase SQL Editor. This lets
   admins edit staff events while keeping event ownership immutable.
   Then run `supabase/004_questions_attendance_qr.sql` to activate private
   Helpdesk conversations, university student IDs and secure QR check-in.
   Follow with 005 for transportation and 006 for email-session access. Complete
   [email authentication setup](EMAIL_VERIFICATION.md) before member sign-in.
3. Run `supabase/verify_setup.sql`. It checks installed tables, RLS, private
   buckets and important column grants without changing your data.
4. Log in as Admin. In Admin panel, review and click **Import official CU guides**.
   This saves six sourced answers in your real database and preserves existing
   answers with matching questions. Upload a current CU bus route/time notice
   separately; the official transport webpage does not list exact times.
5. Complete [the account workflow checks](VERIFICATION.md) with Student, Teacher
   and Admin accounts. Provide genuine course records, notices and resources.

## Git commands

Run these in the CampusOS project terminal:

```powershell
git status
git add .
git diff --cached --stat
git diff --cached --name-only
```

Confirm no `.env.local`, credentials or private documents are staged.
`.env.example` contains placeholders and should be included. `.gitignore`
should also be public: it tells Git which files to exclude.

```powershell
git commit -m "Complete CampusOS modules and deployment preparation"
git push origin main
```

## Vercel deployment

1. Import `cpccu/hackathon2-meherin-jahan` in Vercel.
2. Select the folder containing `package.json` as Root Directory.
3. Framework: Vite. Build: `npm run build`. Output: `dist`.
4. Add `VITE_SUPABASE_URL` (base project URL) and
   `VITE_SUPABASE_ANON_KEY` (publishable/anon key).
5. Deploy. If you add or change either variable afterward, redeploy.
6. Supabase > Authentication > URL Configuration:
   - Site URL: your final public HTTPS URL.
   - Redirect URLs: your public URL, your public URL with `/?recovery=1`,
     and `http://127.0.0.1:5173/?recovery=1` for local password recovery.
     If using `localhost`, add that local address too.
7. Complete [email authentication setup](EMAIL_VERIFICATION.md): enable Confirm
   email, use six-digit codes, install signup/login templates and configure SMTP.
   Allow the deployed and local `/?verified=1` redirects too.
8. Open the public site in a fresh browser. Sign up, confirm email, log in,
   download a shared resource and check all four modules. Test recovery too.

## Submission

Fill in [SUBMISSION.md](SUBMISSION.md) and record the demo using
[DEMO_SCRIPT.md](DEMO_SCRIPT.md). The live URL and video link must be accessible
to judges. Supply dedicated demo credentials privately in the submission form;
do not commit account passwords. Keep personal complaints and actual student
attendance out of the public demo recording.
