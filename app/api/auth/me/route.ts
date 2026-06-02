import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json(null, { status: 200 });
  }

  // Fetch profile from profiles table
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, plan_name, subscription_credits, bonus_credits, created_at")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    // Profile may not exist yet on first login — return minimal user data
    return NextResponse.json({
      id: user.id,
      email: user.email ?? "",
      name: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "",
      plan: "basic",
      imagesUsed: 0,
      videosUsed: 0,
      influencersUsed: 0,
      createdAt: user.created_at,
    });
  }

  // Count influencers owned by user
  const { count: influencerCount } = await supabase
    .from("influencers")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Count image and video generation jobs
  const { count: imageCount } = await supabase
    .from("generation_jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "completed")
    .or("model_id.ilike.%image%,model_id.ilike.%nano-banana%,model_id.ilike.%qwen%,model_id.ilike.%gpt-image%,model_id.ilike.%seedream%");

  const { count: videoCount } = await supabase
    .from("generation_jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "completed")
    .or("model_id.ilike.%video%,model_id.ilike.%veo%,model_id.ilike.%sora%,model_id.ilike.%kling%,model_id.ilike.%wan%");

  const planName = profile.plan_name ?? "basic";

  return NextResponse.json({
    id: profile.id,
    email: profile.email ?? user.email ?? "",
    name: user.user_metadata?.name ?? profile.email?.split("@")[0] ?? "",
    plan: planName,
    imagesUsed: imageCount ?? 0,
    videosUsed: videoCount ?? 0,
    influencersUsed: influencerCount ?? 0,
    createdAt: profile.created_at,
  });
}
