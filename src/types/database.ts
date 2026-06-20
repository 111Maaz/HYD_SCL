export const ADMISSION_STATUSES = [
  "New",
  "Contacted",
  "Visit Scheduled",
  "Enrolled",
  "Rejected",
] as const;

export type AdmissionStatus = (typeof ADMISSION_STATUSES)[number];

export type Database = {
  public: {
    Tables: {
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
      faculty_members: {
        Row: {
          id: string;
          name: string;
          role: string;
          bio: string | null;
          photo_url: string | null;
          initials: string | null;
          accent: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          name: string;
          role: string;
          bio?: string | null;
          photo_url?: string | null;
          initials?: string | null;
          accent?: string | null;
          display_order?: number;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          role?: string;
          bio?: string | null;
          photo_url?: string | null;
          initials?: string | null;
          accent?: string | null;
          display_order?: number;
          is_active?: boolean;
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
      users: {
        Row: {
          id: string;
          email: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role: UserRole;
        };
        Update: {
          email?: string;
          role?: UserRole;
        };
        Relationships: [];
      };
      faculty_profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          role: string;
          bio: string | null;
          photo_url: string | null;
          assigned_class: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          role: string;
          bio?: string | null;
          photo_url?: string | null;
          assigned_class: number;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          role?: string;
          bio?: string | null;
          photo_url?: string | null;
          assigned_class?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
};

export type UserRole = "admin" | "faculty";

export type AdmissionEnquiry = Database["public"]["Tables"]["admission_enquiries"]["Row"];
export type AdmissionEnquiryInsert = Database["public"]["Tables"]["admission_enquiries"]["Insert"];
export type FacultyMember = Database["public"]["Tables"]["faculty_members"]["Row"];
export type GalleryImage = Database["public"]["Tables"]["gallery_images"]["Row"];
export type UserProfile = Database["public"]["Tables"]["users"]["Row"];
export type ClassMaterialRow = Database["public"]["Tables"]["class_materials"]["Row"];
export type FacultyProfile = Database["public"]["Tables"]["faculty_profiles"]["Row"];
