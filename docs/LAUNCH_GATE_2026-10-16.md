# POIGAI launch acceptance gate — 16 October 2026

Status: **CONDITIONAL / NOT YET CLEARED**. This document is a release checklist, not evidence of completed tests.

## Scope
Public informational soft launch for climate advisory, evidence discovery and partnership enquiries only.
No charitable donations, project funding collection, verified project impact claims, public account activation, or major paid campaign launch without separate approvals and evidence.

## Five workstations and mandatory release checks

### WS1 — UI, mobile, navigation
- [ ] Android 360/393px, iPhone 375/390px, tablet 768px, desktop 1366px tested.
- [ ] All shared-header menus and submenus operate by touch, keyboard and screen reader.
- [ ] No horizontal overflow, clipped stakeholder illustration, overlaid navigation, or inaccessible CTA.
- [ ] Approved emblem matches brand file and every public route shares header and footer.
- [ ] Screenshots retained for relevant routes; 200% zoom and reduced motion checked.

### WS2 — Enquiry, backend, identity and security
- [ ] Both hostnames verified and one canonical redirect policy documented.
- [ ] GET /api/enquiries/status accurately indicates the availability of working backend and database binding.
- [ ] POST /api/enquiries actually creates a record with consent timestamp; idempotency tested.
- [ ] Real inbox receives controlled enquiry notification or admin queue confirms successful intake.
- [ ] Form handles invalid input, duplicate requests, timeouts and database unavailability without falsely claiming success.
- [ ] Stakeholder account registration and reset either complete an authenticated end-to-end test or remain visibly unavailable.
- [ ] Security check: rate limiting, role scoping, input validation, secrets exposure and backup/rollback.

### WS3 — Stakeholder conversion
- [ ] Donor, corporate CSR, NGO, technical, community and visitor journeys have relevant CTA destinations.
- [ ] Controlled submission yields acknowledgement with a reference and observable follow-up ownership.
- [ ] Email fallback tested in at least one mobile and one desktop email client.
- [ ] No published response SLA unless resourced and demonstrably achievable.

### WS4 — Claims, knowledge and project evidence
- [ ] All three demonstrators labelled concept-stage until documented field evidence exists.
- [ ] Unverified costs, places and outcomes are explicitly marked as estimates or proposals.
- [ ] Knowledge bank source links, district paths and review dates spot checked.
- [ ] No fabricated visitor counts, funded amounts, verified partner counts or realised impact.

### WS5 — Trust, compliance and QA
- [ ] Legal identity, contracting party and contact details reviewed; pending facts transparently disclosed.
- [ ] Privacy, consent, retention and contact mechanisms reviewed.
- [ ] No implied CSR implementation eligibility, donation licence, FCRA approval or grant guarantees.
- [ ] Site-map/link audit, 404s, keyboard accessibility, metadata, security headers and incident rollback reviewed.
- [ ] Named human release approver records final GO / NO-GO and timestamp.

## Release acceptance
- P0 functional test failures: zero.
- No misleading regulated funding or legal claims.
- Enquiry pathway demonstrably works or clearly defaults to tested email submission.
- No account flow advertised as live until verified.
- Deployment requires normal repository review and explicit release approval.
- Test results, reviewer name, approval and production verification URL must be attached to PR.

## Rollback
Identify the deployed commit and last known-good Cloudflare Pages deployment before promotion.
For a failed release, restore the last known-good deployment and verify homepage, contact route, account route, and API status.
Never publish credentials, live personal enquiry data, or beneficiary private records in issue logs.
