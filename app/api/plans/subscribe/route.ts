import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// TODO: Replace with Lemon Squeezy webhook when payment is connected.
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

    const body = await request.json();
    const planId = body?.planId as string;

    if (!planId || !PLAN_CREDITS.hasOwnProperty(planId)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const creditsToAssign = PLAN_CREDITS[planId];

    // Update plan and reset subscription_credits to 0 so assign-credits can set the correct amount
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        plan_name: planId,
        subscription_credits: 0,
      })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
    }

    // Immediately assign the plan credits
    if (creditsToAssign > 0) {
      await supabase
        .from("profiles")
        .update({ subscription_credits: creditsToAssign })
        .eq("id", user.id);
    }

    // Fetch updated profile to return user-like response
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, plan_name, subscription_credits, bonus_credits, name, email")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      id: profile?.id ?? user.id,
      email: profile?.email ?? user.email,
      name: profile?.name ?? "",
      plan: planId,
      plan_name: planId,
      subscription_credits: creditsToAssign,
      creditsAssigned: creditsToAssign,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
