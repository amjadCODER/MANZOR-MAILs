# MANZOR Mail v3 QA Report

## Static checks completed
- JavaScript API/provider files passed `node --check`.
- No `.env` or `.env.local` files are included.
- No hard-coded Google client secret, private key, or API key was found.
- Gmail OAuth files and persistent refresh-token logic were retained.
- IMAP/SMTP credentials remain encrypted in PostgreSQL.
- Organization cards continue to open the inbox directly.
- Campaign builder now supports Excel recipients, recipient organization, sender organization, HTML templates, image insertion, preview, delay, and per-recipient personalization.
- Generic IMAP/SMTP presets were added for Zoho, Yahoo, GoDaddy, Hostinger/Titan, Namecheap, Fastmail, Rackspace, cPanel, and custom providers.

## Environment limitation
A complete `npm install` timed out in the build environment while downloading dependencies, so a successful production `next build` and live provider authentication could not be certified here. Run the commands in README on the target machine and test with authorized test mailboxes before handling institutional production data.
