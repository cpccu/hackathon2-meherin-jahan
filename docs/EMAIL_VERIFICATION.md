# Activate email verification and login codes

CampusOS uses Supabase email authentication. New members confirm their email
through a **Verify email** button. Returning members choose their assigned role,
enter their registered email, request a **six-digit code**, and submit it to
enter the workspace. Login does not create accounts.

This is passwordless email sign-in, not a password plus a second factor. Access
depends on control of the member's mailbox. A valid session remains signed in
across refreshes; logout requires a new code for the next sign-in.

## 1. Configure Supabase Auth

Open the project's **Authentication** settings:

1. Enable the **Email** provider and **Confirm email**. Confirmation must be
   enabled before members register. The app detects immediate signup sessions,
   closes them and shows a configuration error instead of entering the workspace.
2. Set **Email OTP length** to **6**. Supabase supports 6–10 digits; the
   CampusOS field accepts six. If the dashboard does not expose this setting,
   use Supabase's supported Auth configuration interface. Do not truncate codes.
3. Retain or configure the email expiration and resend limits. The interface
   uses a 60-second resend cooldown; Supabase enforces actual request limits.
   Email expiry settings can also affect confirmation/recovery links.

## 2. Install the two email templates

Under **Authentication → Email templates**:

| Template | Paste the corresponding file | Required content |
| :--- | :--- | :--- |
| Confirm signup | `supabase/email-templates/confirm-signup.html` | Verify email button linking to `{{ .ConfirmationURL }}` |
| Magic Link | `supabase/email-templates/login-code.html` | Six-digit `{{ .Token }}`; no magic-link button |

Suggested subjects: **Verify your CampusOS email** and **Your CampusOS login code**.
Keep the existing recovery template and its recovery link.

Supabase's `signInWithOtp` sends a magic link by default. Updating the **Magic
Link** template to display the token is essential for the numeric code flow.
Signup confirmation uses its separate template.

## 3. Set the website addresses

Under **Authentication → URL Configuration**, set **Site URL** to the deployed
HTTPS website. Add permitted redirect URLs for the actual environments:

```text
http://127.0.0.1:5173/?verified=1
http://127.0.0.1:5173/?recovery=1
http://localhost:5173/?verified=1
http://localhost:5173/?recovery=1
https://YOUR-DEPLOYED-DOMAIN/?verified=1
https://YOUR-DEPLOYED-DOMAIN/?recovery=1
```

Replace the deployed placeholder and local port if needed. The verification
page reads the actual Supabase session; adding `?verified=1` alone never confirms
an account. Continue to login closes the callback session and requests a fresh
login code. Recovery updates the password and returns to code-based login.

## 4. Configure email delivery

Configure **custom SMTP** in Supabase with a verified sender/domain and an email
provider suitable for university members. Supabase's default sender restricts
delivery to project-team addresses and has low sending limits, so it is not
suitable for arbitrary student and staff inboxes.

SMTP credentials belong in Supabase's server settings. Never put SMTP passwords,
service-role keys or email-provider secrets in `VITE_` variables or Git. Check
the provider's domain verification and delivery logs if messages do not arrive.

## 5. Apply the database protection

After migrations 002–005 have succeeded, run the entire file
`supabase/006_email_verification_access.sql` in Supabase SQL Editor, then run
`supabase/verify_setup.sql`.

Migration 006 is safe to rerun. It requires a confirmed email and the signed
Supabase JWT's `otp` authentication method for application data and campus
storage access. Restrictive policies supplement existing ownership and role
policies; they do not grant new permissions. Role checks and QR admission also
require this session. The browser's session check controls navigation only.

Existing password-only or recovery sessions lose workspace access. Members can
sign in using a new email code without changing their assigned roles or records.
Supabase email links also use the `otp` method; the login template must omit
magic-link buttons to deliver the intended numeric-code experience. Signup
confirmation closes its callback session before normal sign-in.

## 6. Check the real email workflows

Use accounts and mailboxes you control:

- Signup: no workspace before email confirmation; the button confirms the
  actual account. Expired/used links must show a useful failure state.
- Login: correct six-digit code signs in; wrong, expired and reused codes fail.
- An unknown email must not create an account. Resend follows provider limits.
- Student/Teacher/Admin selection must match the assigned role. Requesting a
  staff role at signup must still start with Student permissions.
- Refresh retains a valid email session; logout and the next login require a
  fresh code. Password recovery returns to code login.
- A password-only session must be denied table/storage access after migration
  006. Repeat private-resource, attendance, complaint and QR admission checks.

## Implementation and verification status

The forms, callback page, recovery changes, email templates and SQL migration
are in the repository. Confirm Email, SMTP, both templates and local callback
URLs were configured in Supabase; migration 006 was applied and
`verify_setup.sql` passed on 8 October 2026. In the latest manual check, login
email arrived with eight digits rather than the six expected by the app, and a
new signup confirmation email did not arrive. Configure OTP length six and
troubleshoot signup delivery before treating authentication as verified. The
personal Gmail SMTP setup is for initial testing; use a transactional sender
before a wider campus rollout.

## Supabase references

- [Email OTP and token template](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [Email OTP length](https://supabase.com/docs/guides/local-development/cli/config#auth.email.otp_length)
- [Email templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Email confirmation settings](https://supabase.com/docs/guides/auth/general-configuration)
- [Custom SMTP and default sender restrictions](https://supabase.com/docs/guides/auth/auth-smtp)
- [Signed JWT authentication methods](https://supabase.com/docs/guides/auth/jwt-fields)
