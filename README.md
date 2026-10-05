# SMPIS

School Management, Performance and Intelligence System built with React, Express, Supabase PostgreSQL, and private Supabase Storage.

## Deploy to Vercel

1. Push this repository to GitHub and import it into Vercel using the **Express** framework preset and the repository root.
2. Add the environment variables listed in [the deployment guide](docs/VERCEL-DEPLOYMENT.md). Keep the same `INTEGRATION_ENCRYPTION_KEY` as your local `.env`.
3. Build with `npm run build:vercel`; frontend assets are built into `public`. Vercel searches the project root (`outputDirectory: "."`) for the Express entry point. These settings are already in `vercel.json`.
4. Deploy, check `/healthz`, and verify login, MFA, and document upload/download.

Before deploying schema changes, run locally with your private Supabase configuration:

```powershell
npm run supabase:setup
npm run supabase:check
```

## Local development

Requires Node.js 22.12 or later. Configure `.env` from `.env.example` without replacing existing credentials, then run:

```powershell
npm install
npm run dev
```

Open http://127.0.0.1:3000. The first-run screen creates the school and initial super admin; no default accounts are supplied.

## Administration

Super admins manage school-specific SMTP, Paystack, Flutterwave, and Twilio credentials in **Administration > Integrations**. Secrets are encrypted and hidden after saving. SMTP and Paystack power the existing email and payment workflows. Flutterwave checkout and Twilio SMS delivery are not implemented.

Supabase is required for the running application. PGlite and in-memory documents support isolated tests; there is no automatic outage fallback. Existing local data is not migrated automatically.

## Verification

```powershell
npm test
npm run build:vercel
npm run test:ui
```

Browser tests use `dist`; run `npm run build` before `npm run test:ui`. Keep `.env`, school data, backups, and the encryption key private. Database recovery and document backups must be configured separately in Supabase.
