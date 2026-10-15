# POIGAI donor research and conversion release

Reviewed 15 October 2026. This is a source-led implementation brief, not proof of donor demand or an achieved conversion rate.

## What the evidence supports

| Source and population | Finding relevant to POIGAI | Implementation inference |
|---|---|---|
| CAF World Giving Report 2026, global donor context: https://www.worldgivingreport.org/what-it-means-for-donors-2026 | Connection to communities, understanding operations and seeing the use of contributions are recurring giving considerations. | Make local needs visible; show responsibilities, cost categories and the next decision. |
| BBB Give.org Donor Trust Report 2026, more than 1,500 US adults surveyed December 2025: https://give.org/news/donor-trust-report-2026-openness-trust-gap | 67.7% say trust is essential before donating, while 18.3% report high trust. Charity websites influence 54% of respondents who seek information before giving. | Publish an accessible evidence register and distinguish verified records from pending requirements. These figures are US findings, not global estimates. |
| Dalberg / Indiaspora / India Philanthropy Alliance, 2024/25 Indian American Community Engagement Survey, over 400 respondents: https://dalberg.com/our-ideas/from-closing-the-gap-to-setting-the-standard-the-state-of-philanthropic-giving-in-the-indian-american-diaspora/ | Knowledge, trust and engagement emerge as drivers; climate interest does not translate automatically into giving. | Give diaspora visitors a place-based starting point and a route to informed engagement. This is a sample of Indian Americans, not every diaspora community. |
| CAPS Giving Back Home, April 2026, China/India/Philippines/Vietnam contexts: https://caps.org/caps-press-releases/press-release-new-research-reveals-high-potential-for-diaspora-philanthropy-to-china-india-the-philippines-and-vietnam/ | Giving infrastructure, institutional trust and regulatory complexity affect diaspora philanthropy. | Explain the need to verify the recipient and money route before transferring funds. |
| CAF America historical India giving guidance: https://cafamerica.org/blog/giving-to-india-compliance-with-the-newly-amended-fcra/ | Cross-border giving requires attention to donor and recipient requirements; the guidance describes restrictions on Indian onward grants and foreign-contribution receiving accounts. | Do not offer POIGAI as a pass-through, imply FCRA eligibility, appoint a giving intermediary or promise tax treatment. Obtain current case-specific professional review before a transaction. This source includes historical details and extensions; do not reuse those as current permissions. Official reference: https://fcraonline.nic.in/ |

The published website summarises these sources in original language. External references imply neither endorsement nor a POIGAI partnership. The site does not claim all donors share one mindset, stereotype visitors by nationality, or infer willingness to fund POIGAI from population research.

## Practical donor contexts

- Individuals and families: connection to a cause, understandable role, modest information burden.
- Diaspora and overseas supporters: connection to place plus confidence in the recipient and permitted route.
- Foundations and family offices: programme fit, governance, evidence, risks and reporting.
- Corporate CSR: strategic/geographic fit, implementing-entity eligibility, approvals and accountable delivery.

These are navigation contexts selected by the visitor, not inferred identities or eligibility decisions.

## Implemented

1. Donor-focused homepage with local human needs, explicit concept status and a clear route to the funder hub.
2. `/funders/`: four selectable donor contexts, three planning briefs, a scoped assessment conversation, funding-route comparison, proposed reporting standard and direct FAQs.
3. `/trust/`: organisational purpose; public evidence register; pending legal/team/financial/recipient disclosures; separation of project funds and advisory fees; privacy, concerns and source references.
4. `/funders/briefs/d01/`, `/d02/`, `/d03/`: ungated, versioned and printable concept briefs. Print dialogue supports saving as PDF. These are not grant-ready dossiers.
5. Numbered donor stages: explore, discuss, review, agree, follow through. Existing detailed stakeholder journeys and advisory capabilities are preserved at `/partners/`, while seven-field demonstrator records remain at `/projects/`. The homepage reaches the enquiry before additional advisory detail. Mobile funding and evidence tables become labelled cards.
6. Shorter enquiry: role, name, email and consent; optional organisation and context. Individuals no longer need an organisation. Role, project and enquiry intent preselect from internal links.
7. No compulsory account, financial details, marketing subscription, donation checkout, fabricated testimonial, matching claim, donor count, partner logo or unsupported project result.
8. Enquiry status, email-draft and copy messages explicitly distinguish unsent drafts from confirmed online capture. Network waits are bounded, retries preserve idempotency, and returned references are validated.
9. Backend accepts individual, diaspora and foundation roles and optional organisation without changing the database schema. Consent, origin, rate limits, payload bounds and private-reference behavior remain enforced.
10. New routes included in public runtime allowlist, sitemap and committed public build.

## Live capture is still a deployment dependency

The production endpoint returned `{"available":false}` during the audit. Committed configuration has `ENQUIRIES_ENABLED=false`; the repository does not contain the confirmed POIGAI database ID. No migration, secret access, remote database change or activation was performed by this release.

The required activation sequence remains in `MOBILE_IMPLEMENTATION_2026-10-15.md`: confirm the POIGAI DB binding, apply migrations through the ledger, assign a review/retention owner, enable enquiries, then verify a controlled submission and office retrieval. A stored reference is not email notification. There is no notification queue or office dashboard in this release; the protected D1 console remains the existing review route. Do not activate silent capture without an agreed review process.

Fallback is intentionally usable and honest: prepare an email, open the local email application, send manually, or copy it. Do not report this as one-click live capture.

## Real-world evidence required for full donor readiness

- Legal entity/contracting name, registration/constitution, address and authorised signatory.
- Named leader, accepted project coordinator/reviewer roles and substantiated experience.
- Relevant governance, financial and conflict-of-interest information.
- Named eligible funding recipient and evidence of applicable registrations/permissions.
- Accepted delivery and maintenance partners for an actual site.
- The seven verified fields for at least one demonstrator; exact costs, funding gap, outcome targets and dates.
- Agreed enquiry review owner, retention period, complaints owner/process and response expectations.
- Project reporting owner/schedule, safeguarding arrangements, changes and unspent-funds terms.
- Consented site photography and authentic evidence when fieldwork exists.

No code change can supply these facts. Do not mark them verified without records and responsible acceptance.

## Validation and learning plan

Run the existing authentication/enquiry suite and the donor route/build/link tests. Browser QA must include 360, 393, 760 and 1440 px widths; navigation; donor context selection; project/intent preselection; print rendering; email preparation/copy; and simulated online success, timeout/failure and safe retry. Do not send a real message as a QA side effect.

After release and operational capture activation, establish a real baseline: funder-page visits -> brief views -> enquiries confirmed -> qualified conversations -> proposals reviewed -> funding agreements. Distinguish manually emailed enquiries from draft preparation. Count actual agreements, not button clicks, as funding conversion. Use consented or appropriate aggregate measurement and avoid beneficiary or donor personal data in analytics.

Proposed experiments (not validated uplifts): compare primary CTA language, short donor introduction versus longer process copy, and brief-first versus conversation-first paths. Review qualified enquiries and discussion outcomes; no percentage uplift or 10/10 conversion claim is established.

## Completed local verification

- `npm run build`: PASS.
- `npm test`: 23 tests PASS, covering authentication regressions, enquiry validation/rate limits/idempotency/private references, new donor roles, optional organisation, public route allowlist and build/link consistency.
- Chromium browser verification: 24 page/viewport checks at widths 360, 393, 760 and 1440 for home, funders, trust, concept brief, project portfolio and partner pathways; no horizontal overflow.
- Browser interactions: mobile menu and Escape, donor context switching, role/project/intent preselection, offline draft with zero POSTs, simulated online 503 recovery, unchanged request ID on retry, confirmed-reference success, and empty organisation accepted. External production services were mocked in these browser checks; no real enquiry or email was sent.
- Printable D01 brief: generated two-page A4 output inspected locally; concept status and pending responsibilities remain visible.
- HTML duplicate-ID and Git whitespace checks: PASS.

## Publication approval

The user explicitly approved publication to the public `csrtn2022/poigai` repository, merge and deployment on 15 October 2026. The tested implementation is being released through the connected POIGAI GitHub account. Online enquiry activation and the real-world evidence requirements above remain separate operational dependencies.
