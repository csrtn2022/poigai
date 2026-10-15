# POIGAI — Production-Maturity Release Gates
Status: IN PROGRESS / NOT certified for live donation transactions
Updated: 2026-10-16
Scope: POIGAI exclusively; no CTM PATH infrastructure or credentials.

## Verified deployed
- Public dual funder / Impact Partner journey, illustrated timelines and CTAs, routes under /how-it-works/.
- Public research directory, district screening, consent-based approved-organisation directory.
- Authenticated organisation records, private proposal drafts, admin decisions, audit table, opt-in matching, milestones and impact observations.
- Current automated Node tests and production HTTP smoke checks.
- Cloudflare POIGAI D1 migrations through 0008.

## P0 release blockers before accepting donor funds
- [ ] Obtain independent Indian legal assessment of actual POIGAI legal entity, service contracts, CSR intermediary/implementing agency framework, income tax and applicable FCRA conditions, fund-flow structure, FIU/PMLA if relevant, payment provider terms, GST, invoicing, donation receipts and refunds; publish verified legal identity.
- [ ] Decide whether donors pay eligible NGOs directly, or a licensed/eligible financial recipient; POIGAI must not hold money by default.
- [ ] Conduct external infrastructure/application penetration testing including IDOR, XSS, CSRF, file upload, role permissions, account recovery, session invalidation, OWASP ASVS mapping and load/rate-limit testing.
- [ ] Add and independently verify administrator MFA, access-event alerts, scoped roles, backup restores and immutable audit export.
- [ ] Add safe document handling: private storage, file type/content inspection, size caps, malware scanning, short-lived signed access, encryption, owner/administrator access control, redaction and retention/deletion policies.
- [ ] Obtain a signed data processing/privacy assessment, mandatory grievance officer/contact identification and regulatory review for DPDP duties and cross-border use.
- [ ] Perform actual separate NGO/funder/admin browser E2E after all other P0 gates, without initiating transfer.
- [ ] Define payment ledger, idempotency, webhooks verification, reconciliations and approval-separated disbursement before transactions can be enabled.

## P1 engineering completion
- [ ] Build complete application integration tests with isolated temporary D1 and authenticated sessions; ensure no leakage of other organisations' documents or project records.
- [ ] Versioned organisations/projects with explicit administrator review packets (contracts, registration/CSR-1/FCRA review findings), and approval evidence.
- [ ] Secure upload/document review interface and organisational consent-withdrawal/deletion workflows.
- [ ] Donor interest notification and project matching audit, opt-out, referral and conflict-of-interest controls.
- [ ] Independently reviewed baseline, beneficiaries (aggregated, non-identifying), financial budget, milestones and actual outcome metrics with timestamp/source/method.
- [ ] Responsive/mobile + accessibility audit across all public and private routes, form error states and printable dossier design.
- [ ] Publish legally reviewed website privacy policy, terms, procurement and conflicts policies, fee disclosures, brand/trademark review and permissions for illustrations/images.
- [ ] Monitoring, backup recovery drills, logging without secrets, incident response runbook and uptime alerting.

## Activation guardrails
- Do not collect or transfer payments or present a transaction success interface while gates are open.
- Never present partner or project as independently verified unless an actual review is completed and recorded.
- Never present proposed beneficiaries or outcomes as delivered results.
- Separate internal automated tests from independent security/legal audits in all external claims.
- The user requested actual NGO–donor end-to-end testing only after readiness work; preserve that order.

## Evidentiary checklist for final sign-off
1. Named responsible legal/compliance reviewer and dated written findings.
2. Named independent penetration tester and dated evidence, remediation plus retest.
3. Verified legal entity/recipient/agreements and payment-provider approval.
4. Tested backup/restore, security monitoring and least-privileged production access.
5. Private stakeholder account journey independently exercised with consent.
6. Final owner approval to enable live financial transactions.
