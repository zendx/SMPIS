import nodemailer from "nodemailer";
import { rows } from "./db.js";
import { refreshAlerts } from "./services.js";
import { localClock } from "./security.js";
import { refreshOperationAlerts } from "./operations-service.js";
export async function runJobs(db) {
  for (const school of await rows(db, "SELECT * FROM schools")) {
    await refreshAlerts(db, school.id);
    await refreshOperationAlerts(db, school.id);
    const today = localClock(school.timezone).date;
    const reminderDays = (process.env.FEE_REMINDER_DAYS || "7,14,30")
      .split(",")
      .map(Number)
      .filter((n) => Number.isInteger(n) && n > 0);
    const overdue = await rows(
      db,
      "SELECT i.*,s.parent_user_id,s.guardian_email FROM student_invoices i JOIN students s ON s.id=i.student_id WHERE i.school_id=$1 AND NOT i.waived AND i.total_cents>i.paid_cents AND ($2::date-i.due_date)=ANY($3::int[])",
      [school.id, today, reminderDays],
    );
    for (const i of overdue)
      await db.query(
        "INSERT INTO notifications(school_id,user_id,email,title,body,dedupe_key) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(school_id,dedupe_key) DO NOTHING",
        [
          school.id,
          i.parent_user_id,
          i.guardian_email,
          "Overdue school fee reminder",
          `Invoice ${i.invoice_number} has ${school.currency_code} ${((Number(i.total_cents) - Number(i.paid_cents)) / 100).toFixed(2)} outstanding. Please contact the school finance office.`,
          `scheduled-reminder:${i.id}:${today}`,
        ],
      );
    const lowAttendance = await rows(
      db,
      "SELECT a.*,c.teacher_user_id FROM alerts a JOIN students s ON s.id=a.entity_id AND s.school_id=a.school_id LEFT JOIN classes c ON c.id=s.class_id WHERE a.school_id=$1 AND a.category='ATTENDANCE' AND a.status='ACTIVE'",
      [school.id],
    );
    for (const a of lowAttendance) {
      const recipients = await rows(
        db,
        "SELECT id,email FROM users WHERE school_id=$1 AND status='ACTIVE' AND (role='PRINCIPAL' OR id=$2)",
        [school.id, a.teacher_user_id],
      );
      for (const u of recipients)
        await db.query(
          "INSERT INTO notifications(school_id,user_id,email,title,body,dedupe_key) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(school_id,dedupe_key) DO NOTHING",
          [
            school.id,
            u.id,
            u.email,
            "Student attendance needs attention",
            a.message,
            `attendance-alert:${a.id}:${u.id}:${today}`,
          ],
        );
    }
  }
  if (!process.env.SMTP_URL) return;
  const transport = nodemailer.createTransport(process.env.SMTP_URL);
  for (const n of await rows(
    db,
    "SELECT * FROM notifications WHERE delivery_status='PENDING' AND attempts<5 AND email<>'' ORDER BY created_at LIMIT 50",
  )) {
    try {
      await transport.sendMail({
        from: process.env.MAIL_FROM,
        to: n.email,
        subject: n.title,
        text: n.body,
      });
      await db.query(
        "UPDATE notifications SET delivery_status='SENT',sent_at=now() WHERE id=$1",
        [n.id],
      );
    } catch {
      await db.query(
        "UPDATE notifications SET attempts=attempts+1,delivery_status=CASE WHEN attempts>=4 THEN 'FAILED' ELSE 'PENDING' END WHERE id=$1",
        [n.id],
      );
    }
  }
}
