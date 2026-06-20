import { createBrowserClient } from "@supabase/ssr";
import { i as isSupabaseConfigured, s as supabaseUrl, a as supabaseAnonKey } from "./env-6VBUsO0V.js";
let browserClient = null;
function createSupabaseBrowserClient() {
  if (typeof window === "undefined") {
    throw new Error("createSupabaseBrowserClient() must only be called in the browser.");
  }
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
    );
  }
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
}
function getSupabaseBrowserClient() {
  if (typeof window === "undefined" || !isSupabaseConfigured()) {
    return null;
  }
  return createSupabaseBrowserClient();
}
class AuthError extends Error {
  constructor(message) {
    super(message);
    this.name = "AuthError";
  }
}
async function fetchUserProfile(supabase, userId) {
  const { data, error } = await supabase.from("users").select("id, email, role, created_at").eq("id", userId).maybeSingle();
  if (error) {
    throw new AuthError(error.message);
  }
  return data;
}
async function getAuthStateFromSession(supabase, session) {
  if (!session?.user) {
    return null;
  }
  const profile = await fetchUserProfile(supabase, session.user.id);
  if (!profile) {
    return null;
  }
  return {
    userId: profile.id,
    email: profile.email,
    role: profile.role
  };
}
async function signIn(email, password, selectedRole) {
  if (!isSupabaseConfigured()) {
    throw new AuthError("Supabase is not configured.");
  }
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) {
    throw new AuthError(error.message);
  }
  const profile = await fetchUserProfile(supabase, data.user.id);
  if (!profile) {
    await supabase.auth.signOut();
    throw new AuthError("No user profile found. Contact your administrator.");
  }
  if (profile.role !== selectedRole) {
    await supabase.auth.signOut();
    throw new AuthError(
      `This account is registered as ${profile.role}. Select the correct role to continue.`
    );
  }
  if (profile.role === "faculty") {
    const { assertFacultyPortalAccess } = await import("./faculty-portal-DwDCZHH7.js");
    try {
      await assertFacultyPortalAccess(supabase, data.user.id);
    } catch (error2) {
      await supabase.auth.signOut();
      throw error2 instanceof AuthError ? error2 : new AuthError("Unable to verify faculty portal access.");
    }
  }
  return {
    userId: profile.id,
    email: profile.email,
    role: profile.role
  };
}
async function signOut() {
  if (!isSupabaseConfigured()) {
    return;
  }
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new AuthError(error.message);
  }
}
function getDashboardPath(role) {
  return role === "admin" ? "/admin/dashboard" : "/faculty/portal/profile";
}
export {
  AuthError as A,
  signOut as a,
  getDashboardPath as b,
  createSupabaseBrowserClient as c,
  getSupabaseBrowserClient as d,
  getAuthStateFromSession as g,
  signIn as s
};
