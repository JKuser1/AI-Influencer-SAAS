import { createClient, SupabaseClient, User } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

/** Create a Supabase client that authenticates with the request's Bearer token. */
export function createServerClient(token?: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : {},
    auth: { persistSession: false },
  });
}

/** Extract the Bearer token from the Authorization header. */
export function extractToken(request: Request): string | undefined {
  return request.headers.get("authorization")?.replace("Bearer ", "") || undefined;
}

/**
 * Authenticate the request and return both the Supabase client and the
 * authenticated user. Returns null for the user if auth fails.
 */
export async function getAuthenticatedUser(request: Request): Promise<{
  supabase: SupabaseClient;
  user: User | null;
}> {
  const token = extractToken(request);
  const supabase = createServerClient(token);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token ?? undefined);

  if (error || !user) {
    return { supabase, user: null };
  }
  return { supabase, user };
}

/** Plan → monthly subscription credit allowance mapping. */
export const PLAN_CREDITS: Record<string, number> = {
  free: 0,
  basic: 300,
  starter: 800,
  pro: 2500,
};
