import { NextResponse } from "next/server";
import { getAuthenticatedUser, PLAN_CREDITS } from "@/lib/supabase-server";

// TODO: Replace with Lemon Squeezy webhook when payment is connected.
// The webhook will handle plan assignment automatically for real paying users.
// This current implementation is for testing only.

// POST /api/plans/subscribe
export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const planId = body?.planId as string;

  if (!planId || !(planId in PLAN_CREDITS)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const creditsToAssign = PLAN_CREDITS[planId];

  // 1. Update plan_name and reset subscription_credits in profiles
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      plan_name: planId,
      subscription_credits: creditsToAssign,
    })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
  }

  // 2. Upsert a row in the subscriptions table for record-keeping
  await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: user.id,
        plan_name: planId,
        status: "active",
      },
      { onConflict: "user_id" }
    );

  // 3. Fetch updated profile to build response
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, plan_name, subscription_credits, bonus_credits, created_at")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    id: profile?.id ?? user.id,
    email: profile?.email ?? user.email ?? "",
    name: user.user_metadata?.name ?? profile?.email?.split("@")[0] ?? "",
    plan: planId,
    plan_name: planId,
    subscription_credits: creditsToAssign,
    creditsAssigned: creditsToAssign,
  });
}
