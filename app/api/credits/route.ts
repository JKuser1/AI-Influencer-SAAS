import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// TODO: Replace with server-side Supabase client using service role key when available
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: token ? { headers: { Authorization: `Bearer ${token}` } } : {},
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token ?? undefined);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("subscription_credits, bonus_credits")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ creditsBalance: 0, subscriptionCredits: 0, bonusCredits: 0 });
    }

    const subscriptionCredits = profile?.subscription_credits ?? 0;
    const bonusCredits = profile?.bonus_credits ?? 0;
    const creditsBalance = subscriptionCredits + bonusCredits;

    return NextResponse.json({ creditsBalance, subscriptionCredits, bonusCredits });
  } catch {
    return NextResponse.json({ creditsBalance: 0, subscriptionCredits: 0, bonusCredits: 0 });
  }
}
