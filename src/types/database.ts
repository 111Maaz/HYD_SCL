export const ADMISSION_STATUSES = [
  "New",
  "Contacted",
  "Visit Scheduled",
  "Enrolled",
  "Rejected",
] as const;

export type AdmissionStatus = (typeof ADMISSION_STATUSES)[number];

export const STAFF_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED", "LEFT"] as const;
export type StaffStatus = (typeof STAFF_STATUSES)[number];

export type Database = {
  public: {
    Tables: {
      enrollment_progression_maps: {
        Row: {
          id: string;
          from_year_id: string;
          to_year_id: string;
          action: "PROMOTED" | "REPEATED";
          source_class_year_id: string;
          source_section_id: string;
          target_class_year_id: string;
          target_section_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          from_year_id: string;
          to_year_id: string;
          action: "PROMOTED" | "REPEATED";
          source_class_year_id: string;
          source_section_id: string;
          target_class_year_id: string;
          target_section_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["enrollment_progression_maps"]["Insert"]>;
        Relationships: [];
      };
      admission_enquiries: {
        Row: {
          id: string;
          parent_name: string;
          email: string;
          phone: string;
          student_name: string;
          grade: string;
          message: string | null;
          status: AdmissionStatus;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          parent_name: string;
          email: string;
          phone: string;
          student_name: string;
          grade: string;
          message?: string | null;
        };
        Update: {
          parent_name?: string;
          email?: string;
          phone?: string;
          student_name?: string;
          grade?: string;
          message?: string | null;
          status?: AdmissionStatus;
          notes?: string | null;
        };
        Relationships: [];
      };
      staff_profiles: {
        Row: {
          id: string;
          auth_user_id: string | null;
          employee_number: string | null;
          first_name: string;
          last_name: string | null;
          phone: string | null;
          email: string | null;
          designation: string | null;
          status: StaffStatus;
          joined_date: string | null;
          leaving_date: string | null;
          bio: string | null;
          photo_url: string | null;
          initials: string | null;
          accent: string | null;
          display_order: number;
          is_public: boolean;
          assigned_class: number | null;
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          auth_user_id?: string | null;
          first_name: string;
          last_name?: string | null;
          email?: string | null;
          designation?: string | null;
          status?: StaffStatus;
          bio?: string | null;
          photo_url?: string | null;
          initials?: string | null;
          accent?: string | null;
          display_order?: number;
          is_public?: boolean;
          assigned_class?: number | null;
        };
        Update: {
          first_name?: string;
          last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          designation?: string | null;
          status?: StaffStatus;
          bio?: string | null;
          photo_url?: string | null;
          initials?: string | null;
          accent?: string | null;
          display_order?: number;
          is_public?: boolean;
          assigned_class?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      gallery_images: {
        Row: {
          id: string;
          image_url: string;
          caption: string;
          span_class: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          image_url: string;
          caption: string;
          span_class?: string | null;
          display_order?: number;
          is_active?: boolean;
        };
        Update: {
          image_url?: string;
          caption?: string;
          span_class?: string | null;
          display_order?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      class_materials: {
        Row: {
          id: string;
          class_number: number;
          title: string;
          subject: string;
          description: string;
          file_url: string;
          file_name: string;
          uploaded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          class_number: number;
          title: string;
          subject: string;
          description?: string;
          file_url: string;
          file_name: string;
          uploaded_by?: string | null;
        };
        Update: {
          class_number?: number;
          title?: string;
          subject?: string;
          description?: string;
          file_url?: string;
          file_name?: string;
          uploaded_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      run_year_end_transition: {
        Args: {
          p_from_year_id: string;
          p_to_year_id: string | null;
          p_action: string;
          p_enrollment_ids: string[];
          p_overrides?: Record<string, string>;
          p_close_source?: boolean;
          p_commit?: boolean;
        };
        Returns: {
          selected: number;
          eligible: number;
          processed: number;
          skipped: number;
          blocked: boolean;
          rows: Array<{
            enrollmentId: string;
            studentId: string | null;
            sourceSectionId: string | null;
            targetSectionId: string | null;
            status: "ELIGIBLE" | "ERROR";
            reason: string | null;
          }>;
        };
      };
      get_app_role: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      get_staff_role_key: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      get_my_staff_role_keys: {
        Args: Record<string, never>;
        Returns: string[];
      };
    };
  };
};

export type UserRole = "admin" | "faculty" | "parent";

export type AdmissionEnquiry = Database["public"]["Tables"]["admission_enquiries"]["Row"];
export type AdmissionEnquiryInsert = Database["public"]["Tables"]["admission_enquiries"]["Insert"];
export type StaffProfile = Database["public"]["Tables"]["staff_profiles"]["Row"];
export type GalleryImage = Database["public"]["Tables"]["gallery_images"]["Row"];
export type ClassMaterialRow = Database["public"]["Tables"]["class_materials"]["Row"];

/** @deprecated Use StaffProfile */
export type FacultyMember = StaffProfile;
/** @deprecated Use StaffProfile */
export type FacultyProfile = StaffProfile;
/** @deprecated Auth no longer uses public.users */
export type UserProfile = {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
};

export function getStaffDisplayName(staff: {
  first_name: string;
  last_name?: string | null;
}): string {
  return [staff.first_name, staff.last_name].filter(Boolean).join(" ").trim();
}

export function isStaffPortalActive(staff: Pick<StaffProfile, "status">): boolean {
  return staff.status === "ACTIVE";
}

export function isStaffPubliclyVisible(staff: Pick<StaffProfile, "is_public" | "status">): boolean {
  return staff.is_public && staff.status === "ACTIVE";
}

/** Staff shown on the public website directory (excludes portal-only accounts). */
export function isStaffDirectoryEntry(
  staff: Pick<StaffProfile, "auth_user_id" | "is_public">,
): boolean {
  return staff.auth_user_id === null || staff.is_public;
}
