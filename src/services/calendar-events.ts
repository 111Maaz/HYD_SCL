import { getCurrentStaffProfileId } from "@/services/staff-context";
import { requireSupabase } from "@/services/supabase";
import type { CalendarEvent, CalendarEventInput } from "@/types/attendance";

export async function fetchCalendarEvents(academicYearId: string): Promise<CalendarEvent[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("calendar_events")
    .select("*")
    .eq("academic_year_id", academicYearId)
    .order("event_date", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to load calendar events.");
  }

  return data ?? [];
}

export async function fetchCalendarEventsForDate(
  academicYearId: string,
  eventDate: string,
): Promise<CalendarEvent[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("calendar_events")
    .select("*")
    .eq("academic_year_id", academicYearId)
    .eq("event_date", eventDate)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to load calendar events.");
  }

  return data ?? [];
}

export async function fetchCalendarEventForDate(
  academicYearId: string,
  eventDate: string,
): Promise<CalendarEvent | null> {
  const events = await fetchCalendarEventsForDate(academicYearId, eventDate);
  if (events.length === 0) return null;

  const holiday = events.find((event) => isHolidayEventType(event.event_type));
  return holiday ?? events[0];
}

export async function createCalendarEvent(input: CalendarEventInput): Promise<CalendarEvent> {
  const client = requireSupabase();
  const staffId = await getCurrentStaffProfileId();

  if (!input.title.trim()) {
    throw new Error("Title is required.");
  }

  const appliesToAll = input.applies_to_all ?? true;

  const { data, error } = await client
    .from("calendar_events")
    .insert({
      academic_year_id: input.academic_year_id,
      event_date: input.event_date,
      event_type: input.event_type,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      applies_to_all: appliesToAll,
      class_id: appliesToAll ? null : input.class_id ?? null,
      section_id: appliesToAll ? null : input.section_id ?? null,
      is_attendance_day: input.is_attendance_day ?? false,
      created_by: staffId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to create calendar event.");
  }

  return data;
}

export async function updateCalendarEvent(
  eventId: string,
  input: Partial<CalendarEventInput>,
): Promise<CalendarEvent> {
  const client = requireSupabase();

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.event_date !== undefined) updates.event_date = input.event_date;
  if (input.event_type !== undefined) updates.event_type = input.event_type;
  if (input.title !== undefined) updates.title = input.title.trim();
  if (input.description !== undefined) updates.description = input.description?.trim() || null;
  if (input.is_attendance_day !== undefined) updates.is_attendance_day = input.is_attendance_day;

  if (input.applies_to_all !== undefined) {
    updates.applies_to_all = input.applies_to_all;
    if (input.applies_to_all) {
      updates.class_id = null;
      updates.section_id = null;
    }
  }

  if (input.class_id !== undefined) updates.class_id = input.class_id;
  if (input.section_id !== undefined) updates.section_id = input.section_id;

  const { data, error } = await client
    .from("calendar_events")
    .update(updates)
    .eq("id", eventId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update calendar event.");
  }

  return data;
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from("calendar_events").delete().eq("id", eventId);

  if (error) {
    throw new Error(error.message || "Failed to delete calendar event.");
  }
}

export function isHolidayEventType(eventType: CalendarEvent["event_type"]): boolean {
  return eventType === "HOLIDAY" || eventType === "SCHOOL_CLOSURE";
}
