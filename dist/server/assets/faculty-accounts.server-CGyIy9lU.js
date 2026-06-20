import { T as TSS_SERVER_FUNCTION, a as createServerFn } from "./server-CTgP5hRF.js";
import { z } from "zod";
import { A as AuthError } from "./auth-D8LBsNTn.js";
import { createSupabaseAdminClient, createSupabaseServerClient } from "./supabase.server-m-8IXvnR.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "react";
import "@tanstack/react-router";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
import "@supabase/ssr";
import "./env-6VBUsO0V.js";
import "@supabase/supabase-js";
import "ws";
import "node:process";
var createServerRpc = (serverFnMeta, splitImportFn) => {
  const url = "/_serverFn/" + serverFnMeta.id;
  return Object.assign(splitImportFn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const createFacultyAccountSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  name: z.string().trim().min(2).max(100),
  role: z.string().trim().min(2).max(100),
  bio: z.string().trim().max(1e3).optional(),
  assignedClass: z.number().int().min(1).max(10)
});
const updateFacultyAccountSchema = z.object({
  profileId: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
  role: z.string().trim().min(2).max(100),
  bio: z.string().trim().max(1e3).optional(),
  assignedClass: z.number().int().min(1).max(10)
});
async function requireAdminOnServer() {
  const supabase = createSupabaseServerClient();
  const {
    data: {
      user
    },
    error: authError
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new AuthError("You must be signed in as an administrator.");
  }
  const {
    data: profile,
    error: profileError
  } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  if (profileError) {
    throw new AuthError(profileError.message);
  }
  if (!profile || profile.role !== "admin") {
    throw new AuthError("Only administrators can create faculty accounts.");
  }
  return user;
}
const createFacultyAccountFn_createServerFn_handler = createServerRpc({
  id: "33b996b78531eefef8ec57723034c1a97c5aa086a7830a59161b7409824c2f0c",
  name: "createFacultyAccountFn",
  filename: "src/lib/api/faculty-accounts.server.ts"
}, (opts) => createFacultyAccountFn.__executeServer(opts));
const createFacultyAccountFn = createServerFn({
  method: "POST"
}).validator(createFacultyAccountSchema).handler(createFacultyAccountFn_createServerFn_handler, async ({
  data
}) => {
  await requireAdminOnServer();
  let adminClient;
  try {
    adminClient = createSupabaseAdminClient();
  } catch (error) {
    throw new AuthError(error instanceof Error ? error.message : "Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it to your environment to provision faculty accounts.");
  }
  const {
    data: authData,
    error: createError
  } = await adminClient.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      role: "faculty",
      name: data.name
    }
  });
  if (createError || !authData.user) {
    throw new AuthError(createError?.message ?? "Failed to create faculty auth account.");
  }
  const {
    data: profile,
    error: profileError
  } = await adminClient.from("faculty_profiles").insert({
    user_id: authData.user.id,
    name: data.name,
    role: data.role,
    bio: data.bio?.trim() ? data.bio.trim() : null,
    assigned_class: data.assignedClass
  }).select().single();
  if (profileError) {
    await adminClient.auth.admin.deleteUser(authData.user.id);
    throw new AuthError(profileError.message ?? "Failed to create faculty profile.");
  }
  return profile;
});
const listFacultyProfilesFn_createServerFn_handler = createServerRpc({
  id: "b86643597b5a0294163b92bbc87d868831b3f7ce1807f17d35cffa90c12daf72",
  name: "listFacultyProfilesFn",
  filename: "src/lib/api/faculty-accounts.server.ts"
}, (opts) => listFacultyProfilesFn.__executeServer(opts));
const listFacultyProfilesFn = createServerFn({
  method: "GET"
}).handler(listFacultyProfilesFn_createServerFn_handler, async () => {
  await requireAdminOnServer();
  const supabase = createSupabaseServerClient();
  const {
    data,
    error
  } = await supabase.from("faculty_profiles").select("*").order("name", {
    ascending: true
  });
  if (error) {
    throw new AuthError(error.message ?? "Failed to load faculty accounts.");
  }
  return data ?? [];
});
const updateFacultyAccountFn_createServerFn_handler = createServerRpc({
  id: "69ae95ec14be7f2ae1c1c73f62e03de987970a0bb9e933871d7e4b425d3be20d",
  name: "updateFacultyAccountFn",
  filename: "src/lib/api/faculty-accounts.server.ts"
}, (opts) => updateFacultyAccountFn.__executeServer(opts));
const updateFacultyAccountFn = createServerFn({
  method: "POST"
}).validator(updateFacultyAccountSchema).handler(updateFacultyAccountFn_createServerFn_handler, async ({
  data
}) => {
  await requireAdminOnServer();
  const supabase = createSupabaseServerClient();
  const {
    data: existing,
    error: existingError
  } = await supabase.from("faculty_profiles").select("user_id").eq("id", data.profileId).single();
  if (existingError || !existing) {
    throw new AuthError(existingError?.message ?? "Faculty account not found.");
  }
  const {
    data: profile,
    error
  } = await supabase.from("faculty_profiles").update({
    name: data.name,
    role: data.role,
    bio: data.bio?.trim() ? data.bio.trim() : null,
    assigned_class: data.assignedClass,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", data.profileId).select().single();
  if (error) {
    throw new AuthError(error.message ?? "Failed to update faculty account.");
  }
  try {
    const adminClient = createSupabaseAdminClient();
    const {
      error: authUpdateError
    } = await adminClient.auth.admin.updateUserById(existing.user_id, {
      user_metadata: {
        role: "faculty",
        name: data.name
      }
    });
    if (authUpdateError) {
      console.warn("Faculty profile updated but auth metadata sync failed:", authUpdateError.message);
    }
  } catch {
  }
  return profile;
});
const setFacultyAccountActiveSchema = z.object({
  profileId: z.string().uuid(),
  isActive: z.boolean()
});
const setFacultyAccountActiveFn_createServerFn_handler = createServerRpc({
  id: "82d6c29553d24ad7ed16aba161b29fbaf1d5ce58f395bab1cb92b38cfb8f9da4",
  name: "setFacultyAccountActiveFn",
  filename: "src/lib/api/faculty-accounts.server.ts"
}, (opts) => setFacultyAccountActiveFn.__executeServer(opts));
const setFacultyAccountActiveFn = createServerFn({
  method: "POST"
}).validator(setFacultyAccountActiveSchema).handler(setFacultyAccountActiveFn_createServerFn_handler, async ({
  data
}) => {
  await requireAdminOnServer();
  let adminClient;
  try {
    adminClient = createSupabaseAdminClient();
  } catch (error2) {
    throw new AuthError(error2 instanceof Error ? error2.message : "Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it to your environment to manage faculty accounts.");
  }
  const {
    data: profile,
    error
  } = await adminClient.from("faculty_profiles").update({
    is_active: data.isActive,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", data.profileId).select().single();
  if (error) {
    throw new AuthError(error.message ?? "Failed to update faculty account status.");
  }
  return profile;
});
export {
  createFacultyAccountFn_createServerFn_handler,
  listFacultyProfilesFn_createServerFn_handler,
  setFacultyAccountActiveFn_createServerFn_handler,
  updateFacultyAccountFn_createServerFn_handler
};
