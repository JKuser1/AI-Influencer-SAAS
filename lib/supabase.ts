import { createClient } from "@supabase/supabase-js";

// Build/CI (and local dev) may run without env; use well-formed placeholders so
// `createClient` does not throw during prerender. Set real values in production.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
) {
  console.warn(
    "[Supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set. Using placeholder; auth will not work until configured.",
  );
}
