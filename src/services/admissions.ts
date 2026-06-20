import { requireSupabase } from "@/services/supabase";
import type { AdmissionEnquiry, AdmissionEnquiryInsert, AdmissionStatus } from "@/types/database";

export type AdmissionFormValues = {
  parentName: string;
  email: string;
  phone: string;
  studentName: string;
  grade: string;
  message?: string;
};

function toInsertRow(values: AdmissionFormValues): AdmissionEnquiryInsert {
  return {
    parent_name: values.parentName,
    email: values.email,
    phone: values.phone,
    student_name: values.studentName,
    grade: values.grade,
    message: values.message?.trim() ? values.message.trim() : null,
  };
}

export async function submitAdmissionEnquiry(values: AdmissionFormValues): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from("admission_enquiries").insert(toInsertRow(values));

  if (error) {
    throw new Error(error.message || "Failed to submit admission enquiry.");
  }
}

export async function fetchAdmissionLeads(): Promise<AdmissionEnquiry[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("admission_enquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to load admission leads.");
  }

  return data ?? [];
}

export async function updateAdmissionStatus(
  id: string,
  status: AdmissionStatus,
): Promise<AdmissionEnquiry> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("admission_enquiries")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update lead status.");
  }

  return data;
}

export async function updateAdmissionNotes(
  id: string,
  notes: string | null,
): Promise<AdmissionEnquiry> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("admission_enquiries")
    .update({ notes: notes?.trim() ? notes.trim() : null })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update lead notes.");
  }

  return data;
}
