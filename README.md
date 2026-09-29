# SMPIS — Phase 1

Working local implementation of the **School Management, Performance and Intelligence System**, based on the two supplied documents. Scope agreed: **Phase 1, React + Node.js**.

## Start locally

From `C:\xampp\htdocs\SMPIS`:

```powershell
npm.cmd install
npm.cmd run dev
```

Open **http://127.0.0.1:3000**. Node serves the API and React together. XAMPP Apache and MySQL are not required. `.htaccess` blocks Apache access to this directory so it cannot expose private documents, databases, backups or source files.

For the built application:

```powershell
npm.cmd run build
npm.cmd start
```

Node 22.12+ is required. Validation in this workspace used Node 25.2.1 and Chrome. Use a supported Node LTS release for deployment.

## First use

1. Enter the school name, short code, currency, timezone, academic-year dates and administrator account. There are no default passwords or fictional student records.
2. Sign in. Administrators must enroll an authenticator app before using the workspace. Add the displayed key as a time-based account, retain it securely, then verify a six-digit code.
3. In **Administration → Calendar**, review the automatically created first term (initially 100 days from the year start) and edit its dates. Add other terms as needed. The header selects a viewing term; **Make current** changes the school-wide current term.
4. Create teacher, admissions, finance, HR and parent user accounts. Create classes and assign their teachers. Classes can be edited later.
5. Add staff records and link each to its user ID to enable self check-in. Administrators/HR may also record attendance for staff.
6. Create a student application in Admissions, or use the **public application form** linked from Administration → School. Advance applications one stage at a time.
7. Set class fees for the selected term in Finance, configure any student concessions, and generate an invoice. Record payment or an explicit waiver before enrollment.
8. Complete enrollment from the Fees Pending stage. Payment and capacity checks run on the server; the student receives a permanent number.
9. Record attendance, upload supporting documents through the student profile, review balances, print PDF receipts, and export reports.
10. Link a parent user ID in the student profile. Parent accounts see only the linked child’s records and may edit address/phone.

Currency defaults to NGN and timezone to Africa/Lagos in setup; change these to the school’s actual values. Currency cannot change after billing starts.

## Included

- School/year/term configuration; user creation, roles and suspension; server-enforced role permissions; session authentication, CSRF protection, password hashing, MFA, email password-reset workflow and audit events.
- Public and staff-entered admissions, validated stage progression, rejection notes, payment/capacity gates, unique student numbers, profiles, class transfers and enrollment status changes.
- Primary guardian/contact information, parent-account linkage, private PDF/PNG/JPEG document uploads and authorized downloads (5 MB maximum).
- Class attendance with six statuses, present defaults, historical-date locks and administrator unlock, assigned-class restrictions, rolling low-attendance alerts and absence notifications.
- Staff directory, self/admin check-in/out, duplicate prevention, late detection, hours worked and non-working attendance statuses.
- Class/term fee schedules, conditional boarding/transport fees, discount and scholarship percentages, idempotent invoices, exact minor-unit money arithmetic, transactional partial/full payments, replay protection, receipt PDFs, waivers, payment plans/promises and reminders.
- Role-scoped dashboards, term fee totals, class enrollment, attendance/payment trends, management alerts, notification outbox, CSV/Excel/PDF reports and export auditing.
- Daily local database/document backups while the server is running; manual backup and safe restore tools.

## Database and files

The default database is persistent **PGlite**, a PostgreSQL build running in Node, stored in `data/postgres`. This is a local single-process setup; the server and backup command use a process lock. PGlite filesystem behavior is documented at [PGlite filesystems](https://pglite.dev/docs/filesystems).

A PostgreSQL server adapter is included. Copy `.env.example` to `.env` and set `DATABASE_URL` to a dedicated empty database to use it. The app applies `server/schema.sql` on startup. PostgreSQL server integration has **not** been run against a separate server in this workspace; the automated tests run the schema and queries on PGlite. Switching databases does not migrate records automatically.

Private uploads are stored in `data/documents`, outside the Node static directory. There are no browser-localStorage records or tokens. Sessions are HttpOnly cookies. Keep `data/`, `.env` and backups outside version control.

## Email and integrations

Set `SMTP_URL`, `MAIL_FROM` and `APP_URL` in `.env` to enable email delivery and password-reset links. Without SMTP, absence and fee reminders are recorded in the outbox; the app does not claim they were emailed. Password reset returns a configuration message. Background jobs run every minute and retry failed mail up to five attempts.

Overdue reminders are queued at 7/14/30 days by default; `FEE_REMINDER_DAYS` configures these intervals. Low-attendance notifications go to the principal and assigned class teacher, deduplicated per day. Attendance percentage uses recorded days, counts Present/Late as attendance, and requires three records before raising a rolling 30-day alert. These rules need review against the school’s attendance policy.

Card/bank entries record payments already received. **There is no live online payment checkout or webhook integration.** Payment gateways, SMS/WhatsApp, QR/RFID/biometrics, native mobile apps and cloud deployment require separate provider/device work. Phase 2–4 modules are not represented as completed features.

## Backups and restore

The running server creates a backup at startup when needed, then every 24 hours. Backups remain under `backups/<timestamp>/`; retention and off-machine encrypted copies are an operator responsibility. A stopped server can be backed up with:

```powershell
npm.cmd run backup
```

For PGlite, each backup includes `database.tar.gz`, a manifest and documents. Restore to a **new empty directory**:

```powershell
node scripts/restore.js backups/CHOSEN-TIMESTAMP data-restored
```

Then set `DATA_DIR=./data-restored` in `.env` and start the app. Existing data is never overwritten by the restore tool. A backup restore is covered by automated tests. PGlite snapshots are for PGlite; they are not native PostgreSQL dump files.

With `DATABASE_URL`, backup uses `pg_dump` (must be installed and on PATH) and copies documents. Restore that database with `pg_restore` into a fresh database, restore documents and configure the connection. This separate-server path needs deployment validation.

## Verification

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run test:ui
npm.cmd audit
```

The browser test uses installed Chrome and an isolated in-memory database. It exercises setup, mandatory MFA, classes, admissions, invoices, payments, enrollment, uploads, attendance, staff check-in, export, navigation and mobile layout. Screenshots are written to `test-results/`. All 16 integration tests passed, covering access isolation, workflow gates, exact finances, document/report formats, MFA, notification deduplication and backup restoration. The production build and browser workflow also passed.

An initial dependency audit reported zero vulnerabilities after updating the transitive UUID dependency used by Excel export. The final audit recheck could not reach the npm advisory endpoint; run `npm.cmd audit` again when that endpoint is available. No dependencies changed between the successful audit and the failed recheck.

## Deployment boundary

This delivery is a locally verified Phase 1 application, not a production hosting deployment or an availability/performance certification. Before real school data is introduced, configure HTTPS (`NODE_ENV=production` enables Secure cookies), a supported Node runtime, database/storage encryption and access controls, mail delivery, off-site backups, monitoring, recovery procedures and school-specific policies. Public application abuse controls currently use IP rate limiting; add stronger controls for public internet operation.

Sensitive domain data and authenticator secrets in the database rely on storage encryption and access controls; application-level field encryption is not implemented. Do not expose the local PGlite directory or backups. The supplied single-school UI, one primary guardian/account link per student, percentage-based concessions and fixed role templates are deliberate initial constraints. Advanced guardian relationships, custom role editing, accountant adjustments/refunds, program-specific fee rules, batch billing UI, richer attendance aggregation and production operational testing remain further work.

See `docs/IMPLEMENTATION.md` and `docs/PHASE1-COVERAGE.md` for requirements mapping and design deviations.
