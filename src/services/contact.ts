import { requireSupabase } from "@/services/supabase";
import type {
  ContactEnquiry,
  ContactEnquiryInsert,
  ContactStatus,
} from "@/types/contact";

export type ContactFormValues = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

function toInsertRow(values: ContactFormValues): ContactEnquiryInsert {
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    subject: values.subject.trim(),
    message: values.message.trim(),
  };
}

export async function submitContactEnquiry(values: ContactFormValues): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from("contact_enquiries").insert(toInsertRow(values));

  if (error) {
    throw new Error(error.message || "Failed to send message.");
  }
}

export async function fetchContactEnquiries(): Promise<ContactEnquiry[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("contact_enquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to load contact enquiries.");
  }

  return data ?? [];
}

export async function updateContactStatus(
  id: string,
  status: ContactStatus,
): Promise<ContactEnquiry> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("contact_enquiries")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update contact status.");
  }

  return data;
}

export async function updateContactNotes(
  id: string,
  notes: string | null,
): Promise<ContactEnquiry> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("contact_enquiries")
    .update({ notes: notes?.trim() ? notes.trim() : null })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update contact notes.");
  }

  return data;
}
