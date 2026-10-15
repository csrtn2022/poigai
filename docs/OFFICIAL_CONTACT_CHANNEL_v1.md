# POIGAI Official Contact Channel — v1.0

Date: 2026-10-15
Status: Approved official operational contact address

- Public business email: **contact@poigai.com**
- Receiving inbox: `csrtn2022@gmail.com`
- Incoming transport: Cloudflare Email Routing forwarding for `contact@poigai.com`
- Outgoing transport: Brevo SMTP configured through Gmail Send mail as
- Domain: `poigai.com` authenticated for Brevo outgoing email (reported verified)
- Evidence: User-confirmed incoming forwarding test and screenshot of received outgoing test message displayed as POIGAI.

## Usage

Use **contact@poigai.com** in POIGAI public contact copy and operational correspondence. Do not publish `csrtn2022@gmail.com` as the POIGAI public contact address. The forwarding inbox address is operational configuration, not brand-facing contact information.

## Security and scope

Do not put SMTP keys, passwords, verification codes or other secrets in this repository. Keep Cloudflare MX forwarding and Brevo DNS authentication records intact. Confirm external recipient sees `contact@poigai.com` in full message details before declaring sender identity fully verified for all destinations. A working email channel does not mean the website's enquiry form is functional: that form still needs a secure submission implementation and end-to-end test.
