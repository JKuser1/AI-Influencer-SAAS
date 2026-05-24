import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase-server";

// TODO: Replace with Lemon Squeezy webhook when payment is connected.
// Real purchases will be handled by the payment provider webhook.
// This current implementation is for testing only.

const PACK_CREDITS: Record<string, { credits: number; name: string }> = {
  "starter-pack": { credits: 200, name: "Starter Pack" },
  "creator-pack": { credits: 600, name: "Creator Pack" },
  "pro-pack": { credits: 1500, name: "Pro Pack" },
};

// POST /api/credits/purchase
export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const packId = body?.packId as string;

  if (!packId || !(packId in PACK_CREDITS)) {
    return NextResponse.json({ error: "Invalid pack" }, { status: 400 });
  }

  const pack = PACK_CREDITS[packId];

  // Fetch current profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan_name, subscription_credits, bonus_credits")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Require an active non-free plan to purchase bonus credits
  const planName = profile.plan_name ?? "basic";
  if (!planName || planName === "free") {
    return NextResponse.json(
      { error: "An active subscription is required to purchase credit packs" },
      { status: 403 }
    );
  }

  const currentBonus = profile.bonus_credits ?? 0;
  const newBonus = currentBonus + pack.credits;

  // Update bonus_credits in profiles
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ bonus_credits: newBonus })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to add credits" }, { status: 500 });
  }

  // Record in credit_packs table
  await supabase.from("credit_packs").insert({
    user_id: user.id,
    pack_name: pack.name,
    credits_amount: pack.credits,
    purchased_at: new Date().toISOString(),
  });

  const newBalance =
    (profile.subscription_credits ?? 0) + newBonus;

  return NextResponse.json({
    success: true,
    packId,
    creditsAdded: pack.credits,
    bonusCredits: newBonus,
    newBalance,
  });
}
