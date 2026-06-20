import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import process from "node:process";
import { i as isSupabaseConfigured, s as supabaseUrl, a as supabaseAnonKey } from "./env-6VBUsO0V.js";
import { s as setCookie, g as getCookies } from "./server-CTgP5hRF.js";
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
function getServerConfig() {
  return {
    nodeEnv: process.env.NODE_ENV,
    supabaseUrl: process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  };
}
const serverRealtimeOptions = {
  realtime: {
    transport: ws
  }
};
function createSupabaseServerClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
    );
  }
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({
          name,
          value
        }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          setCookie(name, value, options);
        });
      }
    },
    ...serverRealtimeOptions
  });
}
function createSupabaseAdminClient() {
  const config = getServerConfig();
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error(
      "Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it to your .env file to provision faculty accounts."
    );
  }
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    ...serverRealtimeOptions
  });
}
export {
  createSupabaseAdminClient,
  createSupabaseServerClient
};
