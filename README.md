# SMPIS

**School Management, Performance and Intelligence System** is a role-based school operations web application built with React, Node.js, Express and PostgreSQL-compatible storage.

SMPIS requires Supabase PostgreSQL and private Supabase Storage in development and production. A Vercel deployment path is prepared.

## Current status

- Local and hosted servers use Supabase; there is no persistent local database or upload fallback.
- In-memory databases and document storage are reserved for isolated automated tests.
- Super admins can manage school-specific SMTP, Paystack, Flutterwave and Twilio credentials under Administration ? Integrations.
- SMTP and Paystack settings power existing email and payment flows. Flutterwave checkout and Twilio SMS delivery are not implemented; their credentials can be stored securely.

See the [phase coverage records](#requirements-and-delivery-records) for implemented scope and known limitations.

## Requirements

- Node.js **22.12 or later**
- npm
- Google Chrome for browser tests

XAMPP Apache and MySQL are not required. Node serves the React application and API from the same origin.

## Run locally

Copy `.env.example` to your private `.env`, enter Supabase credentials, and generate a stable `INTEGRATION_ENCRYPTION_KEY` before running these commands. From the project directory on Windows:

```powershell
npm.cmd install
npm.cmd run supabase:setup
npm.cmd run supabase:check
npm.cmd run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). The default bind address is loopback, so the development server is available on this computer only.

To serve the production build locally:

```powershell
npm.cmd run build
npm.cmd start
```

Database records and uploads are stored in Supabase. Existing local records are not migrated automatically. Keep `.env` private.

## First-time setup

1. Create the school workspace. Enter the school name, short code, currency, timezone, academic-year dates and initial administrator account. SMPIS does not create default passwords or sample student records.
2. Sign in as the initial Super Admin and enroll an authenticator before using the rest of the workspace. Scan the displayed QR code or enter the setup key manually, then verify the six-digit code.
3. Review the automatically created first term under **Administration → Calendar** and set its actual dates.
4. Create user accounts with individual logins and assign their school roles. Users share the same sign-in page; their permissions determine which screens they can access. Student accounts are optional.
5. Create classes and staff records, assign teachers, configure fees and grading, then add students through Admissions or the public application form.
6. Link parent accounts to students. Parents can access only records linked to their account.

Currency and timezone default to `NGN` and `Africa/Lagos`. Set the school's actual values during setup. Currency cannot be changed after invoicing begins.

## Application areas

- **Students and admissions:** applications, staged decisions, enrollment checks, student records, class transfers and private document uploads.
- **Attendance and staff:** class registers, attendance history, alerts, staff check-in/out and attendance reports.
- **Finance:** class and term fees, invoices, concessions, payments, receipts, waivers, payment plans and outstanding-balance reports.
- **Academics and curriculum:** assessments, gradebook, configurable grading, report publication and revisions, class/term records, exam schedules, teaching logs and curriculum coverage.
- **School experience:** discipline, parent complaints, satisfaction surveys and management alerts.
- **People and facilities:** recruitment, leave approvals, staff reviews and private HR documents; assets, maintenance and costs.
- **Intelligence and schools:** aggregate school indicators, historical evaluation tools and isolated school provisioning for designated platform operators.
- **Reports and administration:** role-scoped PDF, Excel and CSV exports, school/calendar settings, user accounts, MFA recovery codes and audit history.

The approved academic defaults are A ≥70, B ≥60, C ≥50, D ≥45, E ≥40 and F <40, with a 50% pass mark. Ranking and GPA are disabled by default and can be configured.

## Security and sensitive data

SMPIS uses individual accounts, server-enforced role and school access, hashed passwords, HttpOnly session cookies, CSRF protection, audit events and required MFA for the initial Super Admin. Keep school records, uploaded documents, database files, backups and environment secrets private. Student records may contain medical and other sensitive information.

Integration credentials use AES-256-GCM encryption with a server-held key. Other sensitive database fields do not use application-level encryption. For production, configure appropriate encryption at rest and in transit, restrict server and backup access, and review the school's data-retention and recovery policies before importing real records.

## Configuration

Configure the required variables in `.env` or your hosting environment. Restart the server after changing environment variables.

| Variable | Purpose |
| --- | --- |
| `PORT`, `HOST` | Local server address; defaults to port `3000` on `127.0.0.1`. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` | Required project API and private document storage. |
| `INTEGRATION_ENCRYPTION_KEY` | Required 64-character hex key for encrypted integration settings. Generate once; keep the same key on every server and after restores. |
| `DATABASE_URL` | Required Supabase PostgreSQL connection with SSL. |
| `REQUIRE_MFA` | Administrator MFA is required by default. Set to `false` only for local evaluation. |
| `SMTP_URL`, `MAIL_FROM`, `APP_URL` | Transactional email and password-reset links. Without SMTP, notifications remain queued. |
| `FEE_REMINDER_DAYS` | Comma-separated overdue reminder intervals; defaults to `7,14,30`. |
| `TRUST_PROXY_HOPS` | Trusted proxy count for a correctly configured reverse proxy. Leave unset for local development. |
| `PAYSTACK_SCHOOL_KEYS_JSON`, `PAYSTACK_LIVE_ENABLED` | Per-school Paystack keys and explicit live-mode switch. Live payments are disabled unless deliberately configured. |

Never commit real database credentials, mail credentials or payment keys. Keep secrets on the server; do not put them in React environment variables or browser code.

## Database and external services

The application connects directly to Supabase PostgreSQL using the server SQL adapter. Supabase Storage holds private documents. Setup enables RLS and removes browser-role table grants; the existing SMPIS authentication, MFA and school permissions control access through the API.

Under **Administration ? Integrations**, super admins can enable, disable, replace or remove school credentials. Blank secret inputs keep the saved value. Responses and audit logs never include saved secrets. SMTP settings apply to password reset emails and queued notifications; Paystack settings apply to checkout, verification and webhooks. Environment SMTP and per-school Paystack settings remain compatibility defaults only until that school saves its own settings. No global payment key is shared across schools.

Flutterwave and Twilio credentials are configurable, but do not activate a checkout or SMS workflow. Use `APP_URL` for email reset links and payment callbacks. Changing the encryption key without re-encrypting credentials makes saved settings unreadable.

Paystack checkout and webhook handling are implemented and tested with a fake provider. No live transaction has been made. Payment keys and webhook configuration are required; unsafe or mismatched captures need manual reconciliation, and automated refunds are not implemented.

## Deploy to Vercel

The Vercel entry point and daily protected job are configured in this repository. Vercel uses Supabase PostgreSQL and private Supabase Storage. Copy `.env.supabase.example` to your private `.env`, fill in your project credentials, then run `npm.cmd run supabase:setup` and `npm.cmd run supabase:check`. These commands initialize the application tables, restrict Supabase public API access, create a private document bucket, and verify storage operations. The existing SMPIS login, MFA and role permissions continue to handle user access.

Add the same server environment variables in Vercel and import this repository using the **Express** preset. The build command and static output are configured in `vercel.json`. Validate a Preview deployment before using school data. Follow the [Vercel deployment guide](docs/VERCEL-DEPLOYMENT.md) for exact setup steps. Document uploads are limited to 4 MB to fit Vercel's function payload limit.

Email delivery requires a working SMTP provider and verified sender. SMS, WhatsApp, biometric devices, accounting integrations and native mobile apps are not implemented. The web interface is responsive on desktop and mobile browsers.

## Historical evaluation

The Intelligence area includes a basic revenue baseline and tools to evaluate candidate models using historical data. These tools do not activate predictions or make individual student decisions. Real, representative school history is needed before predictive performance can be assessed. Revenue evaluation requires at least 24 consecutive completed months; student-support and retention evaluations also enforce minimum sample sizes and temporal holdouts.

Use pseudonymous entity keys and observed outcomes only. Do not import student names, contact details or fabricated labels. Review [Phase 3–4 coverage](docs/PHASE3-4-COVERAGE.md) before preparing data.

## Backups and restore

The running server relies on Supabase for durable data; it no longer creates local daily snapshots. Configure database recovery and document backup separately in your Supabase project. The optional `npm run backup` command exports a database dump using `pg_dump`; it does not export Supabase Storage objects. Preserve the integration encryption key with your recovery materials. The legacy PGlite restore script is for recovering historical exports only; its output cannot serve as the application backend.

## Verification

Run the API integration tests and production build:

```powershell
npm.cmd test
npm.cmd run build
```

Run the Chrome-based browser workflows after building:

```powershell
npm.cmd run test:ui
npm.cmd run test:ui:academics
npm.cmd run test:ui:operations
```

The API tests use isolated in-memory databases. Browser tests also use isolated test databases; screenshots are written to `test-results/`. These checks demonstrate local behavior, not production performance or availability.

## Production readiness

SMPIS has **not** been deployed. Before using real school records, configure and validate hosting, HTTPS, external PostgreSQL, email, payment accounts, storage access controls, encrypted off-site backups, monitoring and recovery procedures. Test migration from local PGlite if existing records must be retained, and verify capacity, response-time and availability targets under representative load.

Other documented constraints include one primary guardian account per student, fixed role templates, incomplete historical records for some class transfers, and no shared user membership or campus hierarchy across provisioned schools. See the project coverage records for the full list.

## Requirements and delivery records

- [Phase 1 coverage](docs/PHASE1-COVERAGE.md)
- [Phase 2 coverage](docs/PHASE2-COVERAGE.md)
- [Phase 3–4 coverage](docs/PHASE3-4-COVERAGE.md)
- [Hostinger deployment preparation](docs/PRODUCTION-HOSTINGER.md)
- [Implementation record](docs/IMPLEMENTATION.md)
