import { NextResponse } from "next/server";
import { getAuthenticatedUser, PLAN_CREDITS } from "@/lib/supabase-server";

// TODO: Replace with Lemon Squeezy webhook when payment is connected.
// This endpoint auto-assigns credits to users who have an active plan but 0 subscription credits.
// This is for testing only.

// POST /api/plans/assign-credits
export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan_name, subscription_credits")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const planName = profile.plan_name ?? "basic";
  const creditsToAssign = PLAN_CREDITS[planName] ?? 0;
  const currentCredits = profile.subscription_credits ?? 0;

  // Only assign if the user has 0 subscription credits but a paying plan
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
}
