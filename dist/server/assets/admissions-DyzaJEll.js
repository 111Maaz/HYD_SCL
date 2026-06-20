import { r as requireSupabase } from "./supabase-pxAHMEVs.js";
function toInsertRow(values) {
  return {
    parent_name: values.parentName,
    email: values.email,
    phone: values.phone,
    student_name: values.studentName,
    grade: values.grade,
    message: values.message?.trim() ? values.message.trim() : null
  };
}
async function submitAdmissionEnquiry(values) {
  const client = requireSupabase();
  const { error } = await client.from("admission_enquiries").insert(toInsertRow(values));
  if (error) {
    throw new Error(error.message || "Failed to submit admission enquiry.");
  }
}
async function fetchAdmissionLeads() {
  const client = requireSupabase();
  const { data, error } = await client.from("admission_enquiries").select("*").order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message || "Failed to load admission leads.");
  }
  return data ?? [];
}
async function updateAdmissionStatus(id, status) {
  const client = requireSupabase();
  const { data, error } = await client.from("admission_enquiries").update({ status }).eq("id", id).select().single();
  if (error) {
    throw new Error(error.message || "Failed to update lead status.");
  }
  return data;
}
async function updateAdmissionNotes(id, notes) {
  const client = requireSupabase();
  const { data, error } = await client.from("admission_enquiries").update({ notes: notes?.trim() ? notes.trim() : null }).eq("id", id).select().single();
  if (error) {
    throw new Error(error.message || "Failed to update lead notes.");
  }
  return data;
}
export {
  updateAdmissionNotes as a,
  fetchAdmissionLeads as f,
  submitAdmissionEnquiry as s,
  updateAdmissionStatus as u
};
