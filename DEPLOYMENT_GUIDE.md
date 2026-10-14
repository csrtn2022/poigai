# POIGAI Website — Deployment & Launch Checklist

## Current verified setup
- GitHub repository: https://github.com/csrtn2022/poigai
- Production branch: `main`
- Static site files: `index.html`, `styles.css`, `script.js`
- Current public preview: https://poigai.csrtn2022.workers.dev/
- Domain owned through GoDaddy: `poigai.com`
- Existing GoDaddy DNS includes GoDaddy nameservers, an apex A record currently set to `Parked`, and `www` CNAME to `poigai.com`. Do not change these until DNS/email records have been inventoried.

## Recommended order

### 1. Create a Git-connected Cloudflare Pages project
Use Cloudflare Dashboard → Workers & Pages → Create application → Pages → Connect to Git.
Choose GitHub account `csrtn2022` and repository `poigai`.
Use:
- Project name: `poigai`
- Production branch: `main`
- Framework preset: None
- Build command: leave blank
- Build output directory: `/` (repository root)
- Root directory: leave blank or `/`

This is a static HTML/CSS/JS website, so no build command is required. Git integration should automatically deploy future commits. Keep the existing Worker preview until the Pages deployment is verified.

### 2. Verify the Pages deployment
Open the generated `*.pages.dev` URL. Check:
- Desktop and mobile layout
- Navigation links and mobile menu
- Every section anchor
- Contact form validation and draft behavior
- No missing CSS/JavaScript or browser console errors

The current contact form does **not** deliver or store enquiries. It only creates an email draft. Do not represent it as a live enquiry system until an official recipient or secure form service is configured.

### 3. Prepare the custom domain safely
Before changing nameservers or DNS:
- Confirm whether GoDaddy email, forwarding, verification, or other services use this domain.
- Record every existing DNS record, especially MX, SPF, DKIM, DMARC and verification TXT records.
- Add/migrate any required records to the chosen DNS host before switching nameservers.
- Do not delete the current GoDaddy DNS zone or parked record until the new site and any mail services are verified.

Then add `poigai.com` and `www.poigai.com` through the Cloudflare Pages project's Custom Domains screen and follow Cloudflare's exact instructions. Do not guess DNS target values.

### 4. Complete the launch information
Before promoting the website publicly, provide and verify:
- The legal entity/name responsible for POIGAI and its operating address, where appropriate
- Official enquiry email and/or telephone/WhatsApp
- Confirmation that the services described on the site are genuinely offered
- A privacy notice covering enquiry form fields and any analytics/cookies
- Any required terms and social links

### 5. Later project
Build the authenticated NGO workspace/admin portal separately. Do not put private NGO records or internal dashboards in the public static website.

## What requires account-owner intervention
The connected GitHub tools can update repository files, but they cannot operate the logged-in Cloudflare/GoDaddy dashboards or approve domain/DNS changes. The account owner must complete the Cloudflare Pages Git connection and review any DNS/nameserver change prompts. Share a screenshot of the next Cloudflare screen if a choice is unclear; no need to download or upload website files.
