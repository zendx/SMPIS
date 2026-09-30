# Phase 2: academics and curriculum

This extends the existing React + Node.js application following the user's instruction to proceed to Phase 2. It does not complete both source documents: the Phase 1 follow-ups in [PHASE1-COVERAGE.md](PHASE1-COVERAGE.md), Phase 3, Phase 4 and external integrations remain separate work.

## Requirements coverage

| Source             | Implemented behavior                                                                                                                                                                                                     | Verification                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SRS §9; US-15      | Subjects, class/teacher assignments, credits; assignments, tests, CA, practicals, projects and exams; weighted scores and configurable grades; score bounds, missing-score handling, term locks and administrator unlock | API tests cover invalid weights/dates/scores, atomic batch entry, teacher scope, weighted totals, GPA, tied ranks and closed terms; Chrome covers teacher entry |
| SRS §9; US-16      | Class, subject and teacher averages/pass rates, incomplete counts, finalized term trends and student subject results; class/subject/teacher filters                                                                      | API tests cover calculations, filters and role restrictions; Chrome checks analytics                                                                            |
| SRS §9, §16; US-17 | Rule-based repeated failure, grade decline and low attendance with poor performance; evaluated on finalization/reopening; principal and homeroom-teacher access; resolution note                                         | API tests cover all three reasons, visibility and resolution; Chrome checks a flagged student                                                                   |
| SRS §9; US-18      | Draft generation, teacher/principal comments, finalization, separate publication, versioned reopening; linked parents/students see published reports and downloadable PDFs                                               | API tests cover school/family isolation, immutable snapshots and publication withdrawal; Chrome covers publication and parent PDF download                      |
| SRS §10; US-19     | Subject/term curriculum topics, planned week and sequence; CSV upload/paste with atomic validation                                                                                                                       | API tests cover quoting, duplicate rejection and rollback; Chrome uploads a CSV                                                                                 |
| SRS §10; US-20     | Teaching date, duration, completion status, required reason for incomplete topics and log history                                                                                                                        | API tests cover dates, reasons, teacher scope and latest teaching-date calculation; Chrome logs completion                                                      |
| SRS §10; US-21     | Planned versus completed topic counts, completion percentage, teacher/subject/department comparisons and configurable delay threshold                                                                                    | API tests cover coverage aggregation and delay; Chrome checks coverage                                                                                          |
| SRS §15, §22       | Academic/coverage dashboard cards; class, subject, teacher and curriculum CSV/Excel/PDF exports with permission checks and audit records                                                                                 | API tests validate real file formats and permissions; Chrome downloads Excel                                                                                    |

## How to use it

1. Select the correct term in the header. Ensure classes and teacher accounts exist in Administration.
2. Open **Academics → Setup**. Create subjects, assign a teacher and credits to each class/subject, and review the school grading policy.
3. In **Assessments**, create the assessments for each subject. Their weights must total exactly 100% before a complete result can be calculated. Assigned subject teachers can create assessments and enter scores.
4. Review **Gradebook**. Blank scores are unrecorded, not zero; missing scores or an incomplete weight plan prevent report generation.
5. In **Report Cards**, generate drafts, review comments, then finalize. Principal/admin publishing permissions are required to publish; a vice-principal can generate/finalize. A homeroom teacher can review class reports and add teacher comments while drafts remain editable.
6. Parents linked through student profiles see only their child's published reports. Administrators may link a student login to its student record through academic setup.
7. In **Curriculum**, add topics or import CSV with headers `topic_name,planned_week,sequence_order`, then record teaching. **Coverage** compares progress.
8. Review **Analytics** and support flags. Resolve flags with a note. Exports use the selected term and the user's authorized scope.

## Calculation and editing rules

- Approved defaults: A ≥70, B ≥60, C ≥50, D ≥45, E ≥40, F <40; pass mark 50%. Letter grade and pass status are independent, so a D/E can still be below the school's pass mark.
- Ranking and GPA start disabled. Default grade points are A=5, B=4, C=3, D=2, E=1, F=0; these are editable with the grade scale. Credits default to 1. GPA and overall average are credit weighted; subject scores use each assessment's weight. Results round to two decimal places. Optional ranks use competition ranking: 1, 1, 3.
- Teachers see their assigned subjects in score entry and academic comparisons. Full report cards and support flags require homeroom assignment. Proprietor views contain aggregate academic/coverage information, without individual student results.
- A past term or explicitly closed term blocks score/assessment edits. An administrator can grant a dated unlock with a reason. Finalized/published results also require reopening before edits; only a publishing officer can withdraw a published batch. Reopening immediately removes parent/student access until republication.
- Finalization rebuilds the report from current scores. Published snapshots preserve assessment details, grading policy, class/student labels and attendance. Later school policy changes do not rewrite them. Reopening increments the batch revision and is audited.
- Default risk rules: two consecutive available finalized reports below the pass mark; a decline of at least 10 percentage points from the preceding finalized report; or below-pass results plus attendance below 80%, with at least three attendance records. Present/Late count as attended. Resolved flags retain their notes; an automatically cleared flag may reopen if the condition recurs.
- Curriculum completion uses the latest teaching date (then latest entry for same-date ties). Incomplete topics are behind when current term week minus planned week exceeds the configured lag, initially two weeks. Reports count topics equally; partial coverage is not fractional completion.

## Boundaries and follow-up

- Report generation uses the current enrolled/suspended class roster. There is no term-specific enrollment or subject-elective history. Generate/finalize reports before moving students between classes; historical reconstruction after transfers needs a roster-history extension.
- School-wide grading policy and class-wide subject assignments are supported. Separate grading policies per programme, optional student subject selections, examination timetabling and external examination-board integrations are not implemented.
- Academic alerts are deterministic rules, not trained predictive models. Curriculum percentage measures topic completion, not learning outcomes or instructional quality.
- Revision numbers and audit events record reopening; there is no separate UI to retrieve every superseded PDF snapshot.
- External PostgreSQL server operation, concurrent production load, mail delivery, hosting and device/provider integrations still require their own validation. The local database and tests use PGlite.

## Evidence

`tests/academics.test.js` adds nine integration groups to the existing sixteen. `tests/academic-browser.mjs` exercises the real Chrome workflow with an isolated database and writes desktop/mobile screenshots to `test-results/`. No test records are inserted into the actual school database. Run the commands listed in [README.md](../README.md) to repeat verification.
