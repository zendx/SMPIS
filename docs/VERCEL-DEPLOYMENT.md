# Vercel deployment

SMPIS can run on Vercel as a Vite frontend and an Express serverless function. The Vercel runtime requires hosted PostgreSQL and durable private document storage; its function filesystem is temporary and its instances do not run continuously.

## Services to prepare

1. Create a Supabase project and keep its database credentials private. Use the PostgreSQL connection string from the Supabase dashboard, with SSL enabled. Prefer the Supavisor session pooler if direct database connections are unavailable to your network.
2. Create a **private** Supabase Storage bucket for school documents. Set its upload limit to 5 MB and allow only PDF, PNG and JPEG. The server uses the service-role key to access this bucket after checking the signed-in user's school permissions. Never expose that key in a `VITE_` variable.
3. Create a Vercel project from this repository. Use the repository root as the project root, the Express framework preset, `npm run build` as the build command, and `public` as the output directory. Vercel's `VERCEL` build variable directs Vite's production output to `public`; local builds continue to use `dist`.

## Vercel environment variables

Set these in Vercel Project Settings for Preview and Production. Add a separate test database and storage bucket for Preview if preview deployments will be used.

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Supabase PostgreSQL connection string with SSL. |
| `SUPABASE_URL` | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role secret; server-side only. |
| `SUPABASE_STORAGE_BUCKET` | Name of the private document bucket. |
| `CRON_SECRET` | Long random secret used by Vercel's daily scheduled job. |
| `APP_URL` | The deployed HTTPS origin, used in generated links. |
| `REQUIRE_MFA` | Keep unset or set to `true` for production. |
| `TRUST_PROXY_HOPS` | `1`, so Express reads Vercel's client address for security controls. |
| `SMTP_URL`, `MAIL_FROM` | Optional transactional email service and verified sender. |
| `PAYSTACK_SCHOOL_KEYS_JSON` | Optional school-scoped Paystack secret keys; keep live payments disabled until verified. |
| `PAYSTACK_LIVE_ENABLED` | Set to `true` only after live payment review and webhook setup. |

Do not commit real values, paste them into chat, or prefix secrets with `VITE_`. The first deployment must create the initial school and Super Admin through the setup screen, then enroll authenticator MFA.

## Scheduled work and data

Vercel invokes `/api/cron` daily at 02:00 UTC. The endpoint rejects requests without the configured `CRON_SECRET`. Daily execution suits Vercel Hobby's once-a-day cron limit; notifications and fee reminders therefore run daily instead of every minute. Vercel does not run the local process's timer or local backup routine. Configure and test Supabase's database backups and document retention separately.

Uploaded student and HR documents go to the configured private Supabase Storage bucket. Existing local PGlite records and files are not migrated automatically. Before switching an existing school, export and migrate its records and documents, then verify counts and access rules in a non-production project.

## Verify before using real records

Run `npm.cmd test` and `npm.cmd run build` locally. Then deploy a Preview project with non-production credentials and verify initial setup, login and MFA, direct-link page refreshes, private uploads and downloads, mail delivery, the protected cron endpoint, payment test mode, backups and a restore. Only promote to Production after those checks pass.

Vercel deployment does not by itself make the system production-ready. Review school privacy obligations, Supabase access policies, backups, retention, monitoring, and recovery procedures before loading real student information.
