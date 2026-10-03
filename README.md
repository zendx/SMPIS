# SMPIS — core, academics and school operations

Working local implementation of the **School Management, Performance and Intelligence System**, based on the two supplied documents. React + Node.js covers core operations, academic and school-quality workflows, plus historical model evaluation. External integrations and evidence-based prediction release still require real provider setup and school history; see the coverage records below.

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

## Academic workflow

Open **Academics → Setup** to create subjects, assign teachers to class subjects, and review grading rules. Create assessments with weights totaling 100% per subject, enter scores, review the gradebook, then generate, finalize and publish report cards. Linked parents/students can view published reports and download PDFs. Use **Curriculum** for weekly plans, CSV imports, teaching logs and coverage comparisons, and **Academics → Analytics** for performance and support flags.

The approved configurable defaults are A ≥70, B ≥60, C ≥50, D ≥45, E ≥40, F <40, with a 50% pass mark and ranking disabled. GPA starts disabled. Use **Academics -> Records** for transfer-aware term rosters, elective selections, class/term grading rules, internal exam schedules and archived report PDFs. See [Phase 2 coverage and operating rules](docs/PHASE2-COVERAGE.md) for calculation, locking, publication and historical reconstruction limits.

## Quality, people, facilities and intelligence

- **School experience:** discipline reviews, parent complaints and satisfaction surveys. Configure response targets, repeat-incident thresholds and review weights in its administrator Policy tab.
- **People & HR:** assign staff supervisors, maintain HR profiles, manage vacancies/applicants, review leave and record performance snapshots. Approved leave marks configured working days, skips school holidays, checks the annual cap and blocks conflicting check-ins. HR can cancel new approvals and restores only attendance changes recorded for that approval; legacy records need reconciliation. HR can upload private staff documents and preserve earlier review versions.
- **Facilities & assets:** inventory, condition updates, maintenance assignment/progress and mandatory closure costs.
- **Management alerts:** prioritized operational issues, filters, acknowledgment and links to their source modules.
- **Intelligence:** enrollment/receipt history, aggregate support and family indicators, a six-month receipt baseline, and an administrator-only historical model lab for revenue/support/retention evaluation. Imported datasets must be pseudonymous and sourced from observed records. Evaluation runs use temporal holdouts; passing results remain review-only, with production prediction disabled.
- **Schools:** designated platform operators provision independent school workspaces. Fresh installation setup designates its first administrator; existing installations use `node scripts/platform-operator.js administrator@example.com` while the local server is stopped. A school administrator does not gain cross-school access.

Phase 1 follow-ups also add recovery codes under **Administration → Security**, class batch billing in **Finance**, and attendance summary/chronic-absence exports. See [Phase 3–4 coverage](docs/PHASE3-4-COVERAGE.md) for the remaining limitations.

## Database and files

The default database is persistent **PGlite**, a PostgreSQL build running in Node, stored in `data/postgres`. This is a local single-process setup; the server and backup command use a process lock. PGlite filesystem behavior is documented at [PGlite filesystems](https://pglite.dev/docs/filesystems).

A PostgreSQL server adapter is included. Copy `.env.example` to `.env` and set `DATABASE_URL` to a dedicated empty database to use it. The app applies `server/schema.sql`, `server/academic-schema.sql`, `server/operations-schema.sql` and `server/refinement-schema.sql` on startup. PostgreSQL server integration has **not** been run against a separate server in this workspace; the automated tests run the schema and queries on PGlite. Switching databases does not migrate records automatically.

Private uploads are stored in `data/documents`, outside the Node static directory. There are no browser-localStorage records or tokens. Sessions are HttpOnly cookies. Keep `data/`, `.env` and backups outside version control.

## Email and integrations

Set `SMTP_URL`, `MAIL_FROM` and `APP_URL` in `.env` to enable email delivery and password-reset links. Without SMTP, absence and fee reminders are recorded in the outbox; the app does not claim they were emailed. Password reset returns a configuration message. Background jobs run every minute and retry failed mail up to five attempts.

Overdue reminders are queued at 7/14/30 days by default; `FEE_REMINDER_DAYS` configures these intervals. Low-attendance notifications go to the principal and assigned class teacher, deduplicated per day. Attendance percentage uses recorded days, counts Present/Late as attendance, and requires three records before raising a rolling 30-day alert. These rules need review against the school’s attendance policy.

Manual card/bank entries record payments already received. A Paystack checkout/verification/webhook adapter is now included and tested with a fake provider. It requires explicit school-specific credentials and configuration; no live provider transaction has been tested. TEST payments do not credit real invoices. Hostinger VPS deployment files are prepared in `deploy/`, with instructions in [production preparation](docs/PRODUCTION-HOSTINGER.md). Hosting access, domain/DNS, SMTP and merchant setup remain external work. SMS/WhatsApp, device integrations and native mobile apps remain unimplemented.

## Historical model evaluation

A principal or school administrator can use **Intelligence -> Historical model evaluation**. Revenue CSV columns are `month,value`, with at least 24 consecutive completed months and receipts in the smallest currency unit. Student-support columns are `entity_key,snapshot_date,outcome_date,outcome,attendance_rate,average_score,prior_failures`; retention uses `entity_key,snapshot_date,outcome_date,outcome,attendance_rate,overdue_ratio,satisfaction_score`. Use a random pseudonymous key, one observation per student/family, features known on the snapshot date and a later observed outcome. Do not upload names, contact details or unknown outcomes encoded as zero. The importer validates chronology/shape and stores provenance and a checksum. The evaluator records train/tune/test evidence and a baseline comparison. It does not activate a model or make individual decisions. Real school data is needed before performance can be assessed.

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
npm.cmd run test:ui:academics
npm.cmd run test:ui:operations
npm.cmd audit
```

The browser tests use installed Chrome and isolated in-memory databases. The core workflow covers setup/MFA, admissions, finance, enrollment, documents and attendance. The academic workflow covers weighted grading, curriculum, reports/publication and parent access. The operations workflow covers maintenance closure, recruitment, leave, discipline, complaints/surveys, staff reviews, intelligence data limits and school provisioning. Screenshots include desktop/mobile views in `test-results/`. The 38 integration tests cover access isolation, workflow/calculation rules, exports, backup restoration, payment verification and recovery-code security.

An initial dependency audit reported zero vulnerabilities after updating the transitive UUID dependency used by Excel export. The final audit recheck could not reach the npm advisory endpoint; run `npm.cmd audit` again when that endpoint is available. No dependencies changed between the successful audit and the failed recheck.

## Deployment boundary

This delivery is a local application covering core operations, academics and curriculum, not a production hosting deployment or an availability/performance certification. Before real school data is introduced, configure HTTPS (`NODE_ENV=production` enables Secure cookies), a supported Node runtime, database/storage encryption and access controls, mail delivery, off-site backups, monitoring, recovery procedures and school-specific policies. Public application abuse controls currently use IP rate limiting; add stronger controls for public internet operation.

Sensitive domain data and authenticator secrets in the database rely on storage encryption and access controls; application-level field encryption is not implemented. Do not expose the local PGlite directory or backups. One primary guardian/account link per student, percentage-based concessions and fixed role templates remain initial constraints. Advanced guardian relationships, custom role editing, accountant adjustments/refunds, programme-specific fee rules, scheduled-day attendance policy and production operational testing remain further work. School workspaces are now independently provisionable; shared multi-school user memberships and campus hierarchy remain future extensions.

See [implementation record](docs/IMPLEMENTATION.md), [Phase 1 coverage](docs/PHASE1-COVERAGE.md), [Phase 2 coverage](docs/PHASE2-COVERAGE.md) and [Phase 3–4 coverage](docs/PHASE3-4-COVERAGE.md) for requirements mapping, operating rules and remaining work.
