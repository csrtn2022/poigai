# POIGAI public journey improvements — 15 October 2026

## Public changes
- Four numbered stakeholder journeys: NGOs, corporates, technical partners, communities/maintenance owners.
- Public enquiries require no account. Role and demonstrator links preselect their context.
- Consent, bounded fields, copyable email drafts and a manual-copy fallback. Drafts are held in page memory, not local storage. Nothing is submitted by preparing a draft.
- Each demonstrator shows its current stage, next decision, coordinator status, target-date status, dated published review and evidence gate. Unconfirmed owners and dates remain unconfirmed.
- Account availability explains that registration, sign-in and recovery are closed; visitors can still enquire.
- Enquiry privacy and advisory engagement expectations; social preview, organisation metadata, robots and sitemap.

## Prepared enquiry service — NOT activated
`POST /api/enquiries` stores a consented enquiry in the POIGAI DB and returns a reference. It does not send an email, create an account or approve a project. Repeating the same request ID and payload returns the same reference. Changed payloads under a used ID are rejected. No public read/list endpoint exists. Requests have origin, content, body size, field, role, project and rate limits.

Required activation steps in the POIGAI Cloudflare account only:
1. Confirm the Pages DB binding points to poigai-auth. Do not use CTM PATH infrastructure.
2. Apply auth migration 0001 if not already applied, then 0002_enquiries.sql. Use the migration ledger; do not manually reapply existing tables.
3. Change ENQUIRIES_ENABLED to true in the committed Wrangler configuration and deploy. The status endpoint also checks for the required tables. Apex visitors keep the email fallback; online submission is canonical-www only.
4. Test one controlled enquiry, confirm the reference and matching DB record, retry without duplication, and test mobile failure/recovery. Delete the controlled test record only with owner authorisation.
5. Office review is through the protected Cloudflare D1 console for now. No notification, review dashboard or response-time guarantee is implemented. Establish enquiry review and retention responsibilities before opening capture.

AUTH_ENABLED remains false. Authentication additionally needs the private AUTH_PEPPER and POIGAI Resend API key plus the production account lifecycle verification documented in STAKEHOLDER_AUTH_ACTIVATION.md. These values must be entered privately in Cloudflare, never in chat or source.

## Remaining field work
Select actual sites; obtain consent and permissions; measure baselines; identify existing-service gaps; appoint delivery and maintenance owners; develop costed designs; agree numerical outcomes and evaluation dates. Public text does not substitute for these decisions.
