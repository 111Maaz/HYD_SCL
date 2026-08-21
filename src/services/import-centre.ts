import { fetchActiveAcademicYear } from "@/services/academic-years";
import { fetchClassYearsWithDetails } from "@/services/academic-structure";
import { createEnrollment } from "@/services/enrollments";
import {
  ensureStudentGuardianLink,
  findOrCreateGuardian,
} from "@/services/guardians";
import { getCurrentStaffProfileId } from "@/services/staff-context";
import { createStudent, fetchStudentByNumber } from "@/services/students";
import { requireSupabase } from "@/services/supabase";
import {
  ADMISSIONS_CSV_HEADERS,
  GUARDIAN_LINK_CSV_HEADERS,
  type ImportJob,
  type ImportJobType,
  type ImportRow,
} from "@/types/import";

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current.trim());
  return result;
}

export function parseCsvText(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV must include a header row and at least one data row.");
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });

  return { headers, rows };
}

function rowFingerprint(raw: Record<string, string>): string {
  return JSON.stringify(
    Object.keys(raw)
      .sort()
      .reduce<Record<string, string>>((acc, key) => {
        acc[key] = raw[key] ?? "";
        return acc;
      }, {}),
  );
}

function validateAdmissionsRow(row: Record<string, string>): string | null {
  if (!row.first_name?.trim()) return "first_name is required";
  if (!row.guardian_phone?.trim() && !row.guardian_email?.trim()) {
    return "guardian_phone or guardian_email is required";
  }
  return null;
}

function validateGuardianLinkRow(row: Record<string, string>): string | null {
  if (!row.student_number?.trim()) return "student_number is required";
  if (!row.guardian_phone?.trim() && !row.guardian_email?.trim()) {
    return "guardian_phone or guardian_email is required";
  }
  return null;
}

async function findPriorCommittedRow(
  jobType: ImportJobType,
  fingerprint: string,
  excludeJobId: string,
): Promise<boolean> {
  const client = requireSupabase();
  const { data: jobs, error: jobsError } = await client
    .from("import_jobs")
    .select("id")
    .eq("job_type", jobType)
    .eq("status", "COMMITTED")
    .neq("id", excludeJobId);

  if (jobsError || !jobs?.length) return false;

  const jobIds = jobs.map((j) => j.id);
  const { data: rows, error } = await client
    .from("import_rows")
    .select("raw_data")
    .in("job_id", jobIds)
    .eq("status", "COMMITTED");

  if (error) return false;

  return (rows ?? []).some((r) => rowFingerprint(r.raw_data as Record<string, string>) === fingerprint);
}

async function resolveSectionForImport(
  academicYearId: string,
  className: string,
  sectionName: string,
): Promise<{ classYearId: string; sectionId: string } | null> {
  const classYears = await fetchClassYearsWithDetails(academicYearId);
  const normalizedClass = className.trim().toLowerCase();
  const normalizedSection = sectionName.trim().toLowerCase();

  for (const classYear of classYears) {
    const classLabel = classYear.class.class_name.trim().toLowerCase();
    if (classLabel !== normalizedClass && !classLabel.includes(normalizedClass)) continue;

    const section = classYear.sections.find(
      (s) => s.section_name.trim().toLowerCase() === normalizedSection,
    );
    if (section) {
      return { classYearId: classYear.id, sectionId: section.id };
    }
  }

  return null;
}

export async function fetchImportJobs(): Promise<ImportJob[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("import_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message || "Failed to load import jobs.");
  return (data ?? []) as ImportJob[];
}

export async function fetchImportRows(jobId: string): Promise<ImportRow[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("import_rows")
    .select("*")
    .eq("job_id", jobId)
    .order("row_number", { ascending: true });

  if (error) throw new Error(error.message || "Failed to load import rows.");
  return (data ?? []) as ImportRow[];
}

export async function createAndValidateImportJob(
  jobType: ImportJobType,
  fileName: string,
  csvText: string,
): Promise<{ job: ImportJob; rows: ImportRow[] }> {
  const client = requireSupabase();
  const staffId = await getCurrentStaffProfileId();
  const { headers, rows: parsedRows } = parseCsvText(csvText);
  const expectedHeaders =
    jobType === "GUARDIAN_LINK" ? GUARDIAN_LINK_CSV_HEADERS : ADMISSIONS_CSV_HEADERS;

  const missing = expectedHeaders.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    throw new Error(`Missing CSV columns: ${missing.join(", ")}`);
  }

  const { data: job, error: jobError } = await client
    .from("import_jobs")
    .insert({
      job_type: jobType,
      file_name: fileName,
      status: "PENDING",
      row_count: parsedRows.length,
      created_by_staff_id: staffId,
    })
    .select()
    .single();

  if (jobError || !job) throw new Error(jobError?.message || "Failed to create import job.");

  let validCount = 0;
  let errorCount = 0;
  const rowInserts = [];

  for (let index = 0; index < parsedRows.length; index++) {
    const raw = parsedRows[index];
    const fingerprint = rowFingerprint(raw);
    let errorMessage =
      jobType === "GUARDIAN_LINK"
        ? validateGuardianLinkRow(raw)
        : validateAdmissionsRow(raw);

    if (!errorMessage && (await findPriorCommittedRow(jobType, fingerprint, job.id))) {
      errorMessage = "Duplicate row — already committed in a previous import.";
    }

    if (jobType === "GUARDIAN_LINK" && !errorMessage) {
      const student = await fetchStudentByNumber(raw.student_number);
      if (!student) {
        errorMessage = `Student not found: ${raw.student_number.trim()}`;
      }
    }

    const status = errorMessage ? "ERROR" : "VALID";
    if (errorMessage) errorCount++;
    else validCount++;

    rowInserts.push({
      job_id: job.id,
      row_number: index + 1,
      raw_data: raw,
      status,
      error_message: errorMessage,
    });
  }

  const { error: rowsError } = await client.from("import_rows").insert(rowInserts);
  if (rowsError) throw new Error(rowsError.message || "Failed to save import rows.");

  const { data: updatedJob, error: updateError } = await client
    .from("import_jobs")
    .update({
      status: errorCount === parsedRows.length ? "FAILED" : "VALIDATED",
      valid_count: validCount,
      error_count: errorCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id)
    .select()
    .single();

  if (updateError) throw new Error(updateError.message || "Failed to update import job.");

  const rows = await fetchImportRows(job.id);
  return { job: updatedJob as ImportJob, rows };
}

async function commitAdmissionsRow(raw: Record<string, string>) {
  const guardian = await findOrCreateGuardian({
    first_name: raw.guardian_first_name?.trim() || "Guardian",
    last_name: raw.guardian_last_name?.trim() || null,
    phone: raw.guardian_phone?.trim() || null,
    email: raw.guardian_email?.trim() || null,
  });

  const student = await createStudent({
    first_name: raw.first_name.trim(),
    last_name: raw.last_name?.trim() || null,
    date_of_birth: raw.date_of_birth?.trim() || null,
    gender: raw.gender?.trim() || null,
    status: "ACTIVE",
  });

  await ensureStudentGuardianLink({
    student_id: student.id,
    guardian_id: guardian.id,
    is_primary: true,
    can_view_attendance: true,
    can_view_fees: true,
    can_view_academic_data: true,
  });

  const year = await fetchActiveAcademicYear();
  if (year && raw.class_name?.trim() && raw.section_name?.trim()) {
    const target = await resolveSectionForImport(
      year.id,
      raw.class_name,
      raw.section_name,
    );
    if (target) {
      await createEnrollment({
        student_id: student.id,
        academic_year_id: year.id,
        class_year_id: target.classYearId,
        section_id: target.sectionId,
      });
    }
  }

  return { student, guardian };
}

async function commitGuardianLinkRow(raw: Record<string, string>) {
  const student = await fetchStudentByNumber(raw.student_number);
  if (!student) {
    throw new Error(`Student not found: ${raw.student_number.trim()}`);
  }

  const guardian = await findOrCreateGuardian({
    first_name: raw.guardian_first_name?.trim() || "Guardian",
    last_name: raw.guardian_last_name?.trim() || null,
    phone: raw.guardian_phone?.trim() || null,
    email: raw.guardian_email?.trim() || null,
  });

  await ensureStudentGuardianLink({
    student_id: student.id,
    guardian_id: guardian.id,
    is_primary: true,
    can_view_attendance: true,
    can_view_fees: true,
    can_view_academic_data: true,
  });

  return { student, guardian };
}

export async function commitImportJob(jobId: string): Promise<ImportJob> {
  const client = requireSupabase();
  const { data: jobRow, error: jobLoadError } = await client
    .from("import_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (jobLoadError || !jobRow) {
    throw new Error(jobLoadError?.message || "Import job not found.");
  }

  if (jobRow.status === "COMMITTED") {
    return jobRow as ImportJob;
  }

  const rows = await fetchImportRows(jobId);
  const validRows = rows.filter((r) => r.status === "VALID");

  for (const row of validRows) {
    const raw = row.raw_data;
    const fingerprint = rowFingerprint(raw);

    if (await findPriorCommittedRow(jobRow.job_type as ImportJobType, fingerprint, jobId)) {
      await client
        .from("import_rows")
        .update({ status: "SKIPPED", error_message: "Already committed in a previous import." })
        .eq("id", row.id);
      continue;
    }

    try {
      const result =
        jobRow.job_type === "GUARDIAN_LINK"
          ? await commitGuardianLinkRow(raw)
          : await commitAdmissionsRow(raw);

      await client
        .from("import_rows")
        .update({
          status: "COMMITTED",
          target_student_id: result.student.id,
          target_guardian_id: result.guardian.id,
        })
        .eq("id", row.id);
    } catch (rowError) {
      await client
        .from("import_rows")
        .update({
          status: "ERROR",
          error_message: rowError instanceof Error ? rowError.message : "Commit failed",
        })
        .eq("id", row.id);
    }
  }

  const { data: job, error } = await client
    .from("import_jobs")
    .update({
      status: "COMMITTED",
      committed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .select()
    .single();

  if (error) throw new Error(error.message || "Failed to commit import job.");
  return job as ImportJob;
}
