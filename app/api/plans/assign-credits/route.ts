import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// TODO: Replace with Lemon Squeezy webhook when payment is connected.
// The webhook will handle plan assignment automatically for real paying users.
// This current implementation is for testing only.

const PLAN_CREDITS: Record<string, number> = {
  basic: 300,
  starter: 800,
  pro: 2500,
  free: 0,
};

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

export async function POST(request: Request) {
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
      .select("plan_name, subscription_credits")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const planName = profile?.plan_name ?? "free";
    const creditsToAssign = PLAN_CREDITS[planName] ?? 0;
    const currentCredits = profile?.subscription_credits ?? 0;

    // Only assign if credits are 0 or null and plan has credits
    if ((currentCredits === 0 || currentCredits === null) && creditsToAssign > 0) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ subscription_credits: creditsToAssign })
        .eq("id", user.id);

      if (updateError) {
        return NextResponse.json({ error: "Failed to assign credits" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        plan: planName,
        creditsAdded: creditsToAssign,
        newBalance: creditsToAssign,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Credits already assigned",
      creditsAdded: 0,
      currentCredits,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
