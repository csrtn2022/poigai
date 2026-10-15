# POIGAI stakeholder authentication

Implementation: create account, email verification, password sign-in, forgot/reset password, resend verification, current account and logout. Stakeholder types: NGO, corporate CSR, technical/implementation partner, community/project proponent. A chosen type is a profile classification and never an administrative grant. No admin routes, document uploads, funding applications or organisation approvals are implemented.

## Current release state
Prepared for review. Public activation remains OFF (`AUTH_ENABLED=false`). Production account creation and live email delivery have not been verified. Keep CTM PATH infrastructure and credentials separate.

## Activation sequence (POIGAI account only)
1. In Cloudflare account **csrtn2022@gmail.com**, create a new D1 database **poigai-auth**. Record its database ID (not an API credential). Never bind the CTM PATH database.
2. Add the following top-level entry to `wrangler.jsonc`, replacing the database ID with the actual value, then commit it to this feature branch:
   ```json
   "d1_databases": [{
     "binding": "DB",
     "database_name": "poigai-auth",
     "database_id": "ACTUAL-POIGAI-DATABASE-ID",
     "migrations_dir": "migrations"
   }]
   ```
3. Apply `migrations/0001_stakeholder_auth.sql` to **poigai-auth**. Using Wrangler with the correct POIGAI account: `npx wrangler d1 migrations apply poigai-auth --remote`. Alternatively execute the SQL once in that database's Cloudflare console. The migration creates new auth tables only; do not reapply manually to an existing schema.
4. In the **poigai Cloudflare Pages project**, production runtime secrets, set `RESEND_API_KEY` to a POIGAI Resend key permitted to send from the verified `contact@poigai.com` domain. An SMTP key used in Gmail does not establish that this runtime secret is configured. Set `AUTH_PEPPER` to a cryptographically random value of at least 32 characters (recommend 32 random bytes encoded as hex). Generate and enter it privately; do not place it in GitHub, screenshots or chat. Losing/changing it invalidates existing password hashes and requires password recovery for affected users. Do not use CTM PATH secrets.
5. POIGAI uses Cloudflare Pages. The Pages Wrangler config selects `dist` as its output; a committed public build supplies that directory even when no dashboard build command is configured. An explicit `npm run build` build command is also supported. Pages Functions `_middleware.js` delegates to the authentication handler. The public output contains only the site and account assets; backend source, migrations and tests stay outside it. The separate failing Workers integration is not the serving Pages project.
6. Run `npm test` and `npm run build`. Deploy with `AUTH_ENABLED=false` and confirm existing public pages work, `/account/` gives a clear unavailable state and `/api/auth/status` returns `{"available":false}`. Then set `AUTH_ENABLED=true` in Wrangler vars and deploy the next controlled activation commit; dashboard-only overrides are overwritten by Wrangler config.
7. Using an owner-controlled inbox, test actual registration, verification email receipt, manual verification confirmation, sign-in, account reload, logout, forgotten password, reset email receipt, password change and old-session rejection. Do not claim production readiness until these checks pass. Check mobile widths 360, 393 and 760 and desktop 1440. Confirm no token values appear in analytics or request logs.
8. Release the stakeholder navigation entry after successful production checks. Monitor delivery errors and request limits; no plan upgrade or paid service is required by this code. Actual platform quotas still apply.

## Security details
- 12–128 character passwords; HMAC-SHA256 with a private pepper followed by 100,000-iteration salted PBKDF2-SHA256. The work factor respects Cloudflare's current PBKDF2 runtime ceiling. Benchmark in the deployed Worker before activation. Password hash v1 permits a future KDF upgrade; this implementation is not a third-party audited identity service.
- Random 256-bit tokens; SHA-256 digests only in D1. Verification: 24 hours. Recovery: 30 minutes. Atomic token consumption blocks replay. Tokens arrive in URL fragments, are removed from the address bar and are submitted only after an explicit user action. No third-party scripts on the account page.
- Host-only Secure, HttpOnly, SameSite=Lax cookies expire after 8 hours. Logout deletes server session. Password recovery revokes all account sessions and outstanding email links.
- Same-origin POST checks, JSON-only requests and 8 KB payload cap. Persistent per-IP and per-email limits. Generic normal recovery responses. Raw credentials and tokens are never logged. Operational email-provider errors must be diagnosed without logging message bodies or request secrets.
- Private account endpoint returns the authenticated account only. Public sign-up cannot assign admin privileges. Email verification is separate from organisation review.
- Background expiry cleanup for transient tokens, sessions and request counters runs on successful API requests, at most once per hour per active instance. Accounts persist until owner-handled deletion; access/correction/deletion contact appears on the account page.
- Registration data and consent use are disclosed on the form; registration does not opt into marketing.

## Validation
`npm test` uses SQLite with the real migration and executes the Worker authentication handlers. Email delivery is mocked to prevent sending real messages. This proves local functional behavior only, not live D1 binding, delivery, Pages Functions runtime CPU budget or production readiness.

Frontend DOM checks passed for stakeholder preselection, registration consent, recovery field switching, fragment removal, explicit verification submission, and unavailable-service behavior. Browser visual/mobile inspection remains pending: the local Chromium download failed in this environment.

## Deployment adaptation
GitHub checks established that the working project is Cloudflare Pages, while a separate Worker build integration fails. Deployment now targets the existing Pages project with Pages Functions, Pages Wrangler configuration, and a committed public-only dist output. Authentication remains disabled until the production database and email secrets are supplied. A runtime allowlist additionally rejects nonpublic asset paths.

The deployment snapshot in dist is committed for compatibility with the existing no-build-command Pages project. Run npm run build before committing changes to public files.
