# SMPIS implementation record

## Source documents

Reviewed both version 1.0 documents dated August 30, 2026. Text copies are preserved in `developer-package.txt` and `requirements.txt`. The SRS defines the product and roadmap; the developer package supplies acceptance criteria, an illustrative database schema, API resources, and wireframes. Document instructions are requirements to evaluate, not commands to run or authority to deploy, contact people, or connect external accounts.

## Delivery sequence

1. Foundation: identity, school configuration, role permissions, audit trail, admissions, student profiles, student/staff attendance, billing, payments, reports, executive overview.
2. Academics: subjects, assessments, grading rules, report cards, curriculum, academic analytics.
3. Quality: discipline, complaints, surveys, staff performance, recruitment, facilities and maintenance.
4. Intelligence: validated predictive models, forecasting, retention analysis, multi-campus and multi-school operations.

## Schema corrections required

- Create referenced tables before dependent tables, or add foreign keys after creation. The supplied DDL references classes and staff before their creation.
- Add tenant and audit columns explicitly; comments about omitted columns are not executable constraints.
- Enforce tenant membership on relationships, not just list queries.
- Scope student numbers, staff numbers and invoice numbers to schools.
- Permit an applicant without a permanent student number; allocate the number atomically at enrollment.
- Make billing unique per student/term and payment receipt identifiers unique. Use fixed-point currency and transactional updates.
- Add sessions, reset-token lifecycle, admission transition history, attendance locks, alert state and notification delivery state.
- Treat public admissions, sensitive student records, account provisioning and uploads as distinct permission boundaries.

## Business rules needing configuration

School identity, currency, timezone, academic calendar, attendance cutoff/start time, thresholds, fee schedules, grading scale and complaint SLA. Document examples are not school-approved defaults. Provider integrations require actual provider selection and credentials.

## Verification priorities

Test unauthorized and cross-school access; assigned-class restrictions; admission stage order, payment and capacity gates; duplicate attendance/check-in; invoice idempotency; exact partial/full payments and overpayment rejection; audit trail; report access and CSV formula escaping.

## External delivery

Cloud deployment, DNS, production data migration, payment gateways, email/SMS/WhatsApp, biometric devices, native mobile distribution and production backup operations are separate from a local implementation. They require configured services and operational verification.

## Delivered in this workspace

The user selected Phase 1 with React and Node.js. The working application is served by Node on `http://127.0.0.1:3000`; the PostgreSQL-compatible local database persists in `data/postgres`. A first-run setup creates the actual school and administrator; test records are isolated from this database. A separate PostgreSQL server adapter is included but not independently exercised here.

Implemented source is in `server/` and `src/`, with runnable integration/browser tests in `tests/`. See `../README.md` for operation and `PHASE1-COVERAGE.md` for precise feature coverage and outstanding requirements. Final verification: 16 integration tests passed, Chrome desktop/mobile workflow passed, production build passed, local setup endpoint responded successfully, and the initial automatic backup completed.

## Phase 2 extension

The user subsequently authorized Phase 2 and approved configurable A/B/C/D/E/F thresholds of 70/60/50/45/40/0, a 50% pass mark and ranking disabled. Academics and Curriculum now extend the existing navigation, dashboards and report hub. The additional schema is applied idempotently on startup; existing core data remains in the same database.

Implementation lives in `server/academic-schema.sql`, `server/academic-service.js`, `server/academic-routes.js`, `src/pages/academics.jsx` and `src/pages/curriculum.jsx`. It includes weighted assessments, school grading policy, optional credit-weighted GPA/ranks, draft/finalized/published report snapshots, parent/student publication gates, deterministic academic support flags, curriculum imports/logs/coverage and audited exports. Shared calendar-date parsing now returns consistent date strings for PGlite and PostgreSQL, including historical term checks.

Nine new academic integration groups brought the suite to 25 tests at that milestone. The separate academic Chrome workflow exercises management, teacher and parent journeys. See [Phase 2 coverage](PHASE2-COVERAGE.md) for requirement mapping and material limitations, including current-roster report generation.

## Operations, multi-school and integration extension

The user authorized the remaining work, selected Paystack, identified Hostinger and smpis.com, requested multiple schools, and confirmed there is no historical dataset. The next increment adds shared case workflows for discipline/complaints/maintenance, surveys, HR/recruitment/leave/reviews, facilities/assets, management alerts and exports. Shared case storage preserves kind-specific relationships, validation and access rules; it intentionally replaces the illustrative package's separate incident/complaint/maintenance action tables.

Phase 1 follow-ups include MFA recovery codes, class batch invoices and attendance summaries. Phase 4 foundations include school provisioning restricted to designated platform operators, descriptive family/enrollment indicators, and a revenue baseline with rolling backtesting and a six-month data gate. This is not a trained predictive system. The Paystack adapter and Hostinger VPS package are prepared; external credentials, deployment, provider verification and operational certification remain outstanding.

See [Phase 3–4 coverage](PHASE3-4-COVERAGE.md) and [Hostinger production preparation](PRODUCTION-HOSTINGER.md) for exact boundaries, user decisions and verification requirements.

## Remaining-work follow-up

Term rosters initialize from score/report evidence and enrollment dates, preserve transfer history, and populate current/future destination terms. School staff can correct rosters, electives and class/term grading rules, schedule conflict-checked exams, and retrieve reasoned archived report revisions/PDFs in **Academics -> Records**. Older changes to assignments made before these records existed still need register review.

HR now has private audited document uploads, configurable work calendars and holidays, annual working-day caps, leave cancellation that restores only attendance changes owned by that approval, and versioned staff-review amendments. Draft surveys can be changed and published; published questions stay fixed. Legacy approved leave without a change ledger requires HR reconciliation before cancellation. Leave is a fixed yearly cap, not an accrual calculation.

Historical intelligence datasets are school-scoped and provenance/checksum tracked. Revenue and fixed-feature support/retention evaluations use temporal holdouts and compare against simple baselines. The evaluation pipelines have synthetic test fixtures only. The user confirmed no authentic historical data exists, so real-data validation and production prediction activation are unavailable.

Last full API integration run (October 2, 2026): 48 passing tests; production build passed. Minor permission and migration review changes followed October 3; new screens have not had a dedicated browser run. Validation on external PostgreSQL and the persistent school database remains outstanding.
