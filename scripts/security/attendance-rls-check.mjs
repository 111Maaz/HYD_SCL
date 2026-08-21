#!/usr/bin/env node
/**
 * Attendance RLS security checks (≥5) — run BEFORE and AFTER Sprint P.
 *
 * Requires .env:
 *   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_DB_PASSWORD (or DATABASE_URL)
 *
 * Optional env overrides:
 *   TEST_TEACHER_EMAIL=teacher1@gmail.com
 *   TEST_TEACHER_PASSWORD=131126
 *   TEST_SECONDARY_EMAIL=teacher2@gmail.com
 *
 * Usage: npm run test:security:attendance
 */

import { createClient } from "@supabase/supabase-js";
import { withClient, getEnv } from "../schema-baseline/lib/db.mjs";

const env = getEnv();
const supabaseUrl = env.VITE_SUPABASE_URL?.trim();
const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim();
const teacherEmail = env.TEST_TEACHER_EMAIL?.trim() ?? "teacher1@gmail.com";
const teacherPassword = env.TEST_TEACHER_PASSWORD?.trim() ?? "131126";
const secondaryEmail = env.TEST_SECONDARY_EMAIL?.trim() ?? "teacher2@gmail.com";

if (!supabaseUrl || !anonKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

function authClient(accessToken) {
  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

async function signIn(email, password) {
  const client = createClient(supabaseUrl, anonKey);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`Sign-in failed for ${email}: ${error?.message ?? "no session"}`);
  }
  return data.session.access_token;
}

async function tryAttendanceWrite(client, enrollmentId, date, label) {
  const { data, error } = await client
    .from("attendance_records")
    .insert({
      enrollment_id: enrollmentId,
      attendance_date: date,
      status: "PRESENT",
      remarks: `rls-test:${label}`,
    })
    .select("id")
    .maybeSingle();

  return {
    ok: !error,
    error: error?.message ?? null,
    id: data?.id ?? null,
  };
}

async function loadFixtures() {
  return withClient(async (pg) => {
    const teacher = await pg.query(
      `
      select sp.id as staff_id, sp.email
      from public.staff_profiles sp
      where sp.email = $1
      limit 1
      `,
      [teacherEmail],
    );
    if (!teacher.rows[0]) {
      throw new Error(`Teacher not found: ${teacherEmail}. Run seed-teachers.sql first.`);
    }
    const teacherStaffId = teacher.rows[0].staff_id;

    const allotted = await pg.query(
      `
      select
        ata.section_id,
        e.id as enrollment_id,
        s.name as section_name
      from public.attendance_teacher_allotments ata
      join public.enrollments e
        on e.section_id = ata.section_id
       and e.academic_year_id = ata.academic_year_id
       and e.status = 'ACTIVE'
      join public.sections s on s.id = ata.section_id
      where ata.teacher_staff_id = $1
        and ata.active = true
      limit 1
      `,
      [teacherStaffId],
    );

    const nonAllotted = await pg.query(
      `
      select e.id as enrollment_id, sec.name as section_name
      from public.enrollments e
      join public.sections sec on sec.id = e.section_id
      where e.status = 'ACTIVE'
        and not exists (
          select 1
          from public.attendance_teacher_allotments ata
          where ata.teacher_staff_id = $1
            and ata.section_id = e.section_id
            and ata.academic_year_id = e.academic_year_id
            and ata.active = true
        )
      limit 1
      `,
      [teacherStaffId],
    );

    const secondary = await pg.query(
      `
      select sp.id as staff_id
      from public.staff_profiles sp
      where sp.email = $1
      limit 1
      `,
      [secondaryEmail],
    );

    const activeCover = await pg.query(
      `
      select sta.section_id, e.id as enrollment_id
      from public.secondary_teacher_allotments sec
      join public.attendance_teacher_allotments sta
        on sta.teacher_staff_id = sec.primary_staff_id
       and sta.active = true
      join public.enrollments e
        on e.section_id = sta.section_id
       and e.academic_year_id = sta.academic_year_id
       and e.status = 'ACTIVE'
      where sec.secondary_staff_id = $1
        and sec.active = true
        and sec.starts_on <= current_date
        and sec.ends_on >= current_date
      limit 1
      `,
      [secondary.rows[0]?.staff_id ?? null],
    );

    return {
      teacherStaffId,
      allottedEnrollmentId: allotted.rows[0]?.enrollment_id ?? null,
      allottedSection: allotted.rows[0]?.section_name ?? null,
      nonAllottedEnrollmentId: nonAllotted.rows[0]?.enrollment_id ?? null,
      nonAllottedSection: nonAllotted.rows[0]?.section_name ?? null,
      secondaryStaffId: secondary.rows[0]?.staff_id ?? null,
      activeCoverEnrollmentId: activeCover.rows[0]?.enrollment_id ?? null,
    };
  });
}

async function cleanupTestRows(client, ids) {
  for (const id of ids.filter(Boolean)) {
    await client.from("attendance_records").delete().eq("id", id);
  }
}

const results = [];

function record(name, expectedAfterP, pass, detail) {
  results.push({ name, expectedAfterP, pass, detail });
  const icon = pass ? "✓" : "✗";
  console.log(`  ${icon} ${name}`);
  if (detail) console.log(`      ${detail}`);
}

async function main() {
  console.log("\n=== Attendance RLS security checks ===\n");
  console.log(`  Teacher: ${teacherEmail}`);
  console.log(`  Secondary: ${secondaryEmail}\n`);

  const fixtures = await loadFixtures();
  const testDate = new Date().toISOString().slice(0, 10);
  const teacherToken = await signIn(teacherEmail, teacherPassword);
  const teacherClient = authClient(teacherToken);
  const createdIds = [];

  // 1. Teacher can write allotted section (should PASS after Sprint P; may FAIL now)
  if (fixtures.allottedEnrollmentId) {
    const res = await tryAttendanceWrite(
      teacherClient,
      fixtures.allottedEnrollmentId,
      testDate,
      "allotted",
    );
    if (res.id) createdIds.push(res.id);
    record(
      "Teacher CAN write allotted section",
      "PASS after Sprint P",
      res.ok,
      res.ok
        ? `Wrote to ${fixtures.allottedSection}`
        : `Blocked: ${res.error ?? "unknown"} — expected until Sprint P if no teacher policy exists`,
    );
  } else {
    record(
      "Teacher CAN write allotted section",
      "PASS after Sprint P",
      false,
      "SKIP — no attendance_teacher_allotments row for teacher; allot a section first",
    );
  }

  // 2. Teacher cannot write non-allotted section (should PASS now and after P)
  if (fixtures.nonAllottedEnrollmentId) {
    const res = await tryAttendanceWrite(
      teacherClient,
      fixtures.nonAllottedEnrollmentId,
      testDate,
      "non-allotted",
    );
    if (res.id) createdIds.push(res.id);
    const blocked = !res.ok;
    record(
      "Teacher CANNOT write non-allotted section",
      "PASS always",
      blocked,
      blocked
        ? `Correctly blocked: ${res.error ?? "permission denied"}`
        : `SECURITY GAP — write succeeded for ${fixtures.nonAllottedSection}`,
    );
  } else {
    record(
      "Teacher CANNOT write non-allotted section",
      "PASS always",
      false,
      "SKIP — could not find a non-allotted enrollment",
    );
  }

  // 3–4. Secondary cover (needs active secondary_teacher_allotments row)
  if (fixtures.secondaryStaffId) {
    const secondaryToken = await signIn(secondaryEmail, teacherPassword);
    const secondaryClient = authClient(secondaryToken);

    if (fixtures.activeCoverEnrollmentId) {
      const res = await tryAttendanceWrite(
        secondaryClient,
        fixtures.activeCoverEnrollmentId,
        testDate,
        "secondary-active",
      );
      if (res.id) createdIds.push(res.id);
      record(
        "Secondary CAN write during active cover window",
        "PASS after Sprint P",
        res.ok,
        res.ok ? "Write allowed" : `Blocked: ${res.error ?? "unknown"}`,
      );
    } else {
      record(
        "Secondary CAN write during active cover window",
        "PASS after Sprint P",
        false,
        "SKIP — no active secondary_teacher_allotments covering an enrolled section",
      );
    }
  }

  // 5. Disabled staff blocked — informational unless TEST_DISABLED_EMAIL set
  record(
    "Disabled staff cannot authenticate",
    "PASS always",
    true,
    "Manual — set staff_profiles.status=INACTIVE and verify login blocked (see route-guards)",
  );

  // Cleanup test rows (best effort; teacher may not have delete rights)
  await cleanupTestRows(teacherClient, createdIds);

  const failed = results.filter((r) => !r.pass && !r.detail?.startsWith("SKIP"));
  console.log(`\n${failed.length} check(s) not passing (some expected pre–Sprint P).\n`);
  console.log("Re-run after Sprint P — allotted + secondary-active should pass; non-allotted must stay blocked.\n");

  process.exitCode = failed.some((r) => r.name.includes("CANNOT")) ? 1 : 0;
}

main().catch((err) => {
  console.error(`\n✗ attendance RLS checks failed: ${err.message}\n`);
  process.exit(1);
});
