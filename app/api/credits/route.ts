import { NextResponse } from "next/server";
import { getAuthenticatedUser, PLAN_CREDITS } from "@/lib/supabase-server";

// GET /api/credits
// Returns subscription_credits + bonus_credits from the profiles table.
export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan_name, subscription_credits, bonus_credits")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({
      creditsBalance: 0,
      subscriptionCredits: 0,
      bonusCredits: 0,
      planMonthlyAllowance: 0,
    });
  }

  const planName = profile.plan_name ?? "basic";
  const subscriptionCredits = profile.subscription_credits ?? 0;
  const bonusCredits = profile.bonus_credits ?? 0;
  const creditsBalance = subscriptionCredits + bonusCredits;
  const planMonthlyAllowance = PLAN_CREDITS[planName] ?? 0;

  return NextResponse.json({
    creditsBalance,
    subscriptionCredits,
    bonusCredits,
    planMonthlyAllowance,
  });
}
