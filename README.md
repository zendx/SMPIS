# SMPIS

**School Management, Performance and Intelligence System** is a role-based school operations web application built with React, Node.js, Express and PostgreSQL-compatible storage.

SMPIS is currently a **local application**, not a production deployment. Core operations, academic workflows, school-quality tools and historical model evaluation are implemented locally. External services, real-world predictive validation and production operations still require configuration and verification.

## Current status

- Local development runs at `http://127.0.0.1:3000` and uses persistent PGlite storage by default.
- PostgreSQL support is included. Supabase PostgreSQL is the recommended hosted database option for this SQL-based application, but it is not connected or validated in this workspace.
- The current automated API suite has 48 tests. Browser workflows cover core, academic and operations journeys using isolated test data.
- Hostinger deployment files are preparation materials only. No hosting, domain, SMTP service or live payment account has been configured.

See the [phase coverage records](#requirements-and-delivery-records) for implemented scope and known limitations.

## Requirements

- Node.js **22.12 or later**
- npm
- Google Chrome for browser tests

XAMPP Apache and MySQL are not required. Node serves the React application and API from the same origin.

## Run locally

From the project directory on Windows:

```powershell
npm.cmd install
npm.cmd run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). The default bind address is loopback, so the development server is available on this computer only.

To serve the production build locally:

```powershell
npm.cmd run build
npm.cmd start
```

The application stores its local database in `data/postgres`, uploads in `data/documents`, and backups under `backups/`. Keep these directories and `.env` private and out of source control.

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

SMPIS uses individual accounts, server-enforced role and school access, hashed passwords, HttpOnly session cookies, CSRF protection, audit events and administrator MFA. Keep school records, uploaded documents, database files, backups and environment secrets private. Student records may contain medical and other sensitive information.

Application-level encryption for sensitive database fields is not implemented. For production, configure appropriate encryption at rest and in transit, restrict server and backup access, and review the school's data-retention and recovery policies before importing real records.

## Configuration

Copy `.env.example` to `.env` only when you need to override defaults. Restart the server after changing environment variables.

| Variable | Purpose |
| --- | --- |
| `PORT`, `HOST` | Local server address; defaults to port `3000` on `127.0.0.1`. |
| `DATA_DIR` | Persistent local database, upload and backup directory. |
| `DATABASE_URL` | Optional PostgreSQL connection. Without it, SMPIS uses local PGlite. |
| `REQUIRE_MFA` | Administrator MFA is required by default. Set to `false` only for local evaluation. |
| `SMTP_URL`, `MAIL_FROM`, `APP_URL` | Transactional email and password-reset links. Without SMTP, notifications remain queued. |
| `FEE_REMINDER_DAYS` | Comma-separated overdue reminder intervals; defaults to `7,14,30`. |
| `TRUST_PROXY_HOPS` | Trusted proxy count for a correctly configured reverse proxy. Leave unset for local development. |
| `PAYSTACK_SCHOOL_KEYS_JSON`, `PAYSTACK_LIVE_ENABLED` | Per-school Paystack keys and explicit live-mode switch. Live payments are disabled unless deliberately configured. |

Never commit real database credentials, mail credentials or payment keys. Keep secrets on the server; do not put them in React environment variables or browser code.

## Database and external services

The default database is persistent **PGlite**, an embedded PostgreSQL-compatible database suitable for local, single-process use. SMPIS also includes a PostgreSQL server adapter and applies its schema at startup when `DATABASE_URL` is set.

For a hosted database, **Supabase PostgreSQL is the recommended option** because SMPIS uses relational tables, SQL queries, constraints and transactions. Firebase Firestore is not a drop-in replacement; it uses a document data model and would require a substantial data-layer redesign. Supabase is not configured here. Validate its connection and SSL settings before using school data. Switching from PGlite does not migrate existing records automatically.

Paystack checkout and webhook handling are implemented and tested with a fake provider. No live transaction has been made. Payment keys and webhook configuration are required; unsafe or mismatched captures need manual reconciliation, and automated refunds are not implemented.

Email delivery requires a working SMTP provider and verified sender. SMS, WhatsApp, biometric devices, accounting integrations and native mobile apps are not implemented. The web interface is responsive on desktop and mobile browsers.

## Historical evaluation

The Intelligence area includes a basic revenue baseline and tools to evaluate candidate models using historical data. These tools do not activate predictions or make individual student decisions. Real, representative school history is needed before predictive performance can be assessed. Revenue evaluation requires at least 24 consecutive completed months; student-support and retention evaluations also enforce minimum sample sizes and temporal holdouts.

Use pseudonymous entity keys and observed outcomes only. Do not import student names, contact details or fabricated labels. Review [Phase 3–4 coverage](docs/PHASE3-4-COVERAGE.md) before preparing data.

## Backups and restore

The running server creates local database and document backups daily. Local backups are not off-site protection; configure encrypted external copies and test recovery before relying on them.

To create a manual backup while the application is stopped:

```powershell
npm.cmd run backup
```

Restore a PGlite backup to a **new, empty directory**:

```powershell
node scripts/restore.js backups/CHOSEN-TIMESTAMP data-restored
```

Then set `DATA_DIR=./data-restored` in `.env` and start SMPIS. Existing data is not overwritten by the restore tool. PGlite snapshots are not native PostgreSQL backups. For a PostgreSQL server, the backup path requires `pg_dump`; restore with `pg_restore` into a fresh database. External PostgreSQL backup and restore need deployment validation.

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
