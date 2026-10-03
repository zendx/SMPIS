# Production preparation: Hostinger, smpis.com and Paystack

This is a reviewable deployment package, not a deployment confirmation. The user selected Hostinger and `smpis.com`; the hosting plan, server access, domain ownership/DNS access, SMTP provider and payment-account arrangement still need confirmation. No credentials should be placed in chat or committed to source control.

## Target topology

The files in `deploy/` target a Hostinger VPS: Caddy terminates HTTPS for `smpis.com`, Node serves the built React app and API, and PostgreSQL stores records. Only ports 80/443 are published. Documents and backups use private persistent volumes. Run a single application instance until migration coordination, shared storage and job ownership are extended for horizontal scaling.

Hostinger documents both managed Node hosting and VPS options; its VPS option supports Docker Compose workflows. This package needs PostgreSQL, private persistent storage and database backup tooling, so the actual hosting plan must be checked before deployment. [Hostinger Node hosting](https://www.hostinger.com/nodejs-hosting), [Node application deployment](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/).

## Configuration and first staging run

1. On an authorized server, install Docker/Compose and copy the application source. Do not upload `.git`, `.env`, local school data or backups into a public website directory.
2. Copy `deploy/.env.example` to `deploy/.env`. Set a strong database password and the matching URL-encoded password in `DATABASE_URL`. Configure an SMTP URL and verified sender when the email service is chosen. Secrets remain in the server environment/configuration.
3. For staging, change `deploy/Caddyfile` and `APP_URL` in `deploy/compose.yaml` to the authorized staging hostname. Point that hostname to the server only after DNS access and deployment are approved. Caddy needs public access to ports 80/443 for certificate provisioning.
4. Validate and build from the repository root:

   ```sh
   docker compose --env-file deploy/.env -f deploy/compose.yaml config --quiet
   docker compose --env-file deploy/.env -f deploy/compose.yaml up -d --build
   docker compose --env-file deploy/.env -f deploy/compose.yaml ps
   ```

5. Verify `/healthz`, the login/setup page, MFA, school isolation, document storage, exports and a controlled backup/restore before introducing real records. `NODE_ENV=production` enables Secure cookies. `TRUST_PROXY_HOPS=1` is for this single trusted reverse-proxy topology; do not expose the app's port directly to the internet.
6. Fresh setup designates its installation administrator as a platform operator. Provision other schools from **Schools**. Each school administrator uses a separate login and stays within their school. Configure actual term dates before academic work.

An existing installation can explicitly designate an operator while the local server is stopped:

```sh
node scripts/platform-operator.js administrator@example.com
```

## Paystack

The current adapter uses **separate Paystack account keys per school**, with no shared-account fallback. This is a prepared configuration; the user has not yet confirmed whether independent accounts or platform-managed subaccounts are required. Subaccount settlement is not implemented.

Set `PAYSTACK_SCHOOL_KEYS_JSON` to a JSON object mapping actual school IDs to secrets, for example `{"1":"sk_test_REPLACE"}`. Keep `PAYSTACK_LIVE_ENABLED=false` during staging. The Finance screen shows whether configured checkout is TEST or LIVE. Test confirmations remain in the gateway transaction log and do not change invoice balances.

Configure a webhook per school's Paystack account:

```text
https://smpis.com/api/v1/webhooks/paystack/SCHOOL_ID
```

Use the staging hostname while testing. The app initializes checkout on the server using an authorized invoice and verified balance, checks returned amounts/currency/mode, validates the raw-body HMAC SHA-512 signature, and credits a successful live reference at most once. Browser redirects do not mark invoices paid. Paystack documents signature verification and retries in its [webhook guide](https://paystack.com/docs/payments/webhooks/), and transaction initialization/verification in the [Transaction API](https://paystack.com/docs/api/transaction/).

Before enabling LIVE mode, verify successful, failed, abandoned, duplicate and delayed payments against a staging school; verify reconciliation and receipts; confirm the merchant account and settlement arrangement. Live activation requires `PAYSTACK_LIVE_ENABLED=true`, `sk_live_...` keys, and an HTTPS `APP_URL`. No live activation or provider test has occurred in this workspace.

If a captured payment exceeds the invoice's remaining balance because another payment or waiver happened meanwhile, the transaction becomes REVIEW. The money is not silently discarded or credited twice. Finance must investigate with the Paystack account and arrange any necessary refund; automated refund and refund-ledger support remain outstanding.

## Email

`SMTP_URL`, `MAIL_FROM` and `APP_URL` configure transactional mail. Outbox entries stay queued when SMTP is absent. With SMTP configured, the background job sends queued notifications and retries failures. Choose a sender domain, configure its provider-required DNS records, verify delivery and password-reset links, and review queued notifications before enabling the service for real users.

## Backups and migration

The application creates daily database/document backups while running. The VPS image includes `pg_dump` matching the PostgreSQL 15 service. Local backup files are not offsite protection. Configure restricted, encrypted offsite storage, retention, monitoring and a tested restore procedure before production use.

An existing PGlite school database is **not automatically migrated** to external PostgreSQL. Preserve its snapshot and documents. A dedicated migration/export/import and reconciliation step is needed if real local records must be carried over; do not start with an empty production database and assume those records moved.

For a maintenance-window manual backup, stop the app, run its backup script as a one-off container using the same environment and volumes, then restart it. Use a fresh target database for restore tests. Do not delete production volumes as an upgrade or recovery shortcut.

## Outstanding external verification

- Confirm Hostinger plan, access and the authorized domain/DNS configuration.
- Run container builds and PostgreSQL integration tests; the local Docker engine was unavailable during this delivery.
- Configure and verify school-specific Paystack accounts or extend for an agreed subaccount model.
- Configure and test SMTP, HTTPS, storage/backup access controls, offsite restoration, monitoring and representative load.
- Set operational ownership for updates, incidents, merchant reconciliation and recovery. No uptime or production performance certification is implied.
