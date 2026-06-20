const supabaseUrl = "https://ejitwihwpridtemzcjhu.supabase.co";
const supabaseAnonKey = "sb_publishable_ug5hVXVch09xLx-N1G1KUQ_Apq9X8xr";
function isSupabaseConfigured() {
  return Boolean(supabaseUrl?.trim() && supabaseAnonKey?.trim());
}
export {
  supabaseAnonKey as a,
  isSupabaseConfigured as i,
  supabaseUrl as s
};
