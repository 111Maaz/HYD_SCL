import { requireSupabase } from "@/services/supabase";
import type { YearEndAction } from "@/services/enrollments";

export type ProgressionMap = {
  id: string;
  from_year_id: string;
  to_year_id: string;
  action: "PROMOTED" | "REPEATED";
  source_class_year_id: string;
  source_section_id: string;
  target_class_year_id: string;
  target_section_id: string;
};

export type TransitionRow = {
  enrollmentId: string;
  studentId: string | null;
  sourceSectionId: string | null;
  targetSectionId: string | null;
  status: "ELIGIBLE" | "ERROR";
  reason: string | null;
};

export type TransitionResult = {
  selected: number;
  eligible: number;
  processed: number;
  skipped: number;
  blocked: boolean;
  rows: TransitionRow[];
};

export async function fetchProgressionMaps(
  fromYearId: string,
  toYearId: string,
  action: "PROMOTED" | "REPEATED",
) {
  const { data, error } = await requireSupabase()
    .from("enrollment_progression_maps")
    .select("*")
    .eq("from_year_id", fromYearId)
    .eq("to_year_id", toYearId)
    .eq("action", action);
  if (error) throw new Error(error.message);
  return (data ?? []) as ProgressionMap[];
}

export async function saveProgressionMap(input: Omit<ProgressionMap, "id">) {
  const { error } = await requireSupabase()
    .from("enrollment_progression_maps")
    .upsert(input, { onConflict: "from_year_id,to_year_id,action,source_section_id" });
  if (error) throw new Error(error.message);
}

export async function removeProgressionMap(id: string) {
  const { error } = await requireSupabase()
    .from("enrollment_progression_maps")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export type TransitionInput = {
  fromYearId: string;
  toYearId: string | null;
  action: YearEndAction;
  enrollmentIds: string[];
  overrides: Record<string, string>;
  closeSource: boolean;
};

export async function runYearEndTransition(
  input: TransitionInput,
  commit: boolean,
): Promise<TransitionResult> {
  const { data, error } = await requireSupabase().rpc("run_year_end_transition", {
    p_from_year_id: input.fromYearId,
    p_to_year_id: input.toYearId,
    p_action: input.action,
    p_enrollment_ids: input.enrollmentIds,
    p_overrides: input.overrides,
    p_close_source: input.closeSource,
    p_commit: commit,
  });
  if (error) throw new Error(error.message);
  return data as TransitionResult;
}
