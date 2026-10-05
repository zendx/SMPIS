# Vercel deployment

SMPIS runs on Vercel as a Vite frontend and an Express serverless function, with Supabase PostgreSQL for records and a private Supabase Storage bucket for documents. SMPIS sessions, MFA and school/role permissions still handle user access. Browser requests go through the Express API; no Supabase key is bundled into React.

The integration is tested locally. A real Supabase project and Vercel Preview deployment must still be connected and verified.

## Services to prepare

1. Create a dedicated Supabase project. In **Connect**, copy the **Transaction pooler** PostgreSQL string (port `6543`). Replace the password placeholder with your percent-encoded database password and append `?sslmode=verify-full`. The API uses unnamed node-postgres queries, which are compatible with transaction pooling. Use the dashboard's actual hostname and username. See [Supabase connection guidance](https://supabase.com/docs/guides/database/connecting-to-postgres).
2. Get the project URL and the legacy **service_role** JWT from Supabase's API Keys settings. This server adapter uses the service-role key for private Storage requests. The publishable/anon key is not used by this application.
3. Copy `.env.supabase.example` to `.env` and fill in the connection string, URL, service-role key and bucket name. If the database certificate requires a custom CA, download the Supabase database root certificate and set `DB_SSL_CA` to its PEM contents (actual newlines or escaped `\n` are supported). Certificate verification stays enabled. Keep the existing `.env` if you already have one and add the variables instead of replacing it.
4. Run the setup and check commands below. Setup creates or updates the application schema in a transaction, enables RLS on every application table, revokes public/anon/authenticated table access and seeds the role templates. It creates the private document bucket if missing. An existing public or incorrectly configured bucket causes an error; correct it in Supabase Storage and rerun. Both commands verify a PDF upload, download and deletion using a temporary probe object. The check command does not change schema or bucket settings.
5. Import this Git repository into Vercel. Choose the **Express** framework preset and repository root. `vercel.json` sets `npm run build:vercel` as the build command and `public` as output. The root `index.js` exports the Express function. Local builds continue to use `dist`.

```powershell
Copy-Item .env.supabase.example .env
# Edit .env privately before running these commands.
npm.cmd run supabase:setup
npm.cmd run supabase:check
```

The table changes are idempotent and do not erase existing records. Use a dedicated project: the protection step deliberately removes direct Supabase client access to SMPIS tables. PostgreSQL connections using the dashboard's `postgres` role retain access; the Express API applies school and permission checks. Do not add permissive Data API policies to these tables. See [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security).

Run `supabase:setup` again before deploying a version with schema changes. Vercel cold starts open the database without applying DDL. If local PGlite data already exists, setup does not copy it to Supabase; migration is a separate task.

## Vercel environment variables

Set these in Vercel Project Settings for Preview and Production. Add a separate test database and storage bucket for Preview if preview deployments will be used.

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Supabase Transaction pooler connection string, port 6543, with `sslmode=verify-full`. |
| `DB_POOL_MAX` | `1`, to bound connections per warm function instance. |
| `DB_SSL_CA` | Optional trusted database root certificate PEM if required by the project. |
| `SUPABASE_URL` | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase legacy service-role JWT; server-side only. |
| `SUPABASE_STORAGE_BUCKET` | Name of the private document bucket. |
| `INTEGRATION_ENCRYPTION_KEY` | Stable 64-character hexadecimal key used to encrypt school integration credentials. |
| `CRON_SECRET` | Long random secret used by Vercel's daily scheduled job. |
| `APP_URL` | The deployed HTTPS origin, used in generated links. |
| `REQUIRE_MFA` | Keep unset or set to `true` for production. |
| `TRUST_PROXY_HOPS` | `1`, so Express reads Vercel's client address for security controls. |
| `SMTP_URL`, `MAIL_FROM` | Optional transactional email service and verified sender. |
| `PAYSTACK_SCHOOL_KEYS_JSON` | Optional school-scoped Paystack secret keys; keep live payments disabled until verified. |
| `PAYSTACK_LIVE_ENABLED` | Set to `true` only after live payment review and webhook setup. |

Do not commit real values, paste them into chat, or prefix secrets with `VITE_`. The first deployment must create the initial school and Super Admin through the setup screen, then enroll authenticator MFA.

Generate `CRON_SECRET` locally with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` and save it privately. Set `APP_URL` to the actual deployment HTTPS origin before testing email/reset links.

## Scheduled work and data

Vercel invokes `/api/cron` daily at 02:00 UTC. The endpoint rejects requests without the configured `CRON_SECRET`. Daily execution suits Vercel Hobby's once-a-day cron limit; notifications and fee reminders therefore run daily instead of every minute. Vercel does not run the local process's timer. Configure and test Supabase's database backups and document retention separately.

Uploaded student and HR documents go to the configured private Supabase Storage bucket. Existing local PGlite records and files are not migrated automatically. Before switching an existing school, export and migrate its records and documents, then verify counts and access rules in a non-production project.

The bucket and application upload limit are **4 MB (4194304 bytes)** and allowed types are `application/pdf`, `image/png`, and `image/jpeg`. The API detects the file signature and sends the verified MIME type to Storage. This leaves space for multipart headers within [Vercel's 4.5 MB function request/response limit](https://vercel.com/docs/functions/limitations). Existing larger documents and large generated exports may exceed that response limit; validate those workflows before migrating existing data.

## Verify before using real records

Run `npm.cmd test`, `npm.cmd run build:vercel`, and `npm.cmd run supabase:check`. The automated storage tests use a mocked Supabase API and embedded PostgreSQL; only `supabase:check` with real credentials verifies your hosted services.

Deploy a Preview project with non-production credentials and verify `/healthz`, first-time school setup, login/MFA, direct-link refreshes, private student and HR uploads/downloads, cross-role and cross-school access, and the cron endpoint. `/api/cron` must return 401 without its bearer secret and succeed with it. Verify mail delivery, payment test mode, backups and a restore when those services are configured. Only promote to Production after those checks pass.

Vercel deployment does not by itself make the system production-ready. Review school privacy obligations, Supabase access policies, backups, retention, monitoring, and recovery procedures before loading real student information.

## Administration integration settings

Set `INTEGRATION_ENCRYPTION_KEY` to the same 64-character hexadecimal key as your private local environment. Do not regenerate it during deployments. Super admins configure school SMTP, Paystack, Flutterwave and Twilio credentials in Administration ? Integrations. SMTP and Paystack are connected to existing workflows; Flutterwave checkout and Twilio delivery remain unavailable. Run Supabase setup again when deploying schema changes.
