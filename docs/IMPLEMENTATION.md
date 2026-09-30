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

Nine new academic integration groups bring the suite to 25 tests. The separate academic Chrome workflow exercises management, teacher and parent journeys. See [Phase 2 coverage](PHASE2-COVERAGE.md) for requirement mapping and material limitations, including current-roster report generation. Phase 1 follow-ups, Phase 3, Phase 4 and external deployment/integrations remain outstanding; Phase 2 authorization does not imply they are complete.
