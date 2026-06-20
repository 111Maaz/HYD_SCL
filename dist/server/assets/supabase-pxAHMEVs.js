import { d as getSupabaseBrowserClient, c as createSupabaseBrowserClient } from "./auth-D8LBsNTn.js";
function getSupabase() {
  return getSupabaseBrowserClient();
}
function requireSupabase() {
  return createSupabaseBrowserClient();
}
export {
  getSupabase as g,
  requireSupabase as r
};
