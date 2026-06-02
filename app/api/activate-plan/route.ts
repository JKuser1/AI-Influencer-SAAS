import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase-server";

const PLAN_CREDITS: Record<string, number> = {
  basic:   300,
  starter: 800,
  pro:     2500,
};

export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planName } = await request.json();

  if (!PLAN_CREDITS[planName]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const credits = PLAN_CREDITS[planName];

  const { error } = await supabase
    .from("profiles")
    .update({
      plan_name:            planName,
      subscription_credits: credits,
      subscription_status:  "active",
      updated_at:           new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, plan: planName, credits });
}
