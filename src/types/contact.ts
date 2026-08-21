export const CONTACT_STATUSES = ["New", "Contacted", "Resolved"] as const;

export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export type ContactEnquiry = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactStatus;
  notes: string | null;
  created_at: string;
};

export type ContactEnquiryInsert = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  New: "New",
  Contacted: "Contacted",
  Resolved: "Resolved",
};
