import { NextResponse } from "next/server";
import { getAuthenticatedUser, PLAN_CREDITS } from "@/lib/supabase-server";
import { getPlanFeatures } from "@/lib/plan-access";

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_name, subscription_credits, bonus_credits")
    .eq("id", user.id)
    .single();

  const planName = profile?.plan_name ?? "basic";
  const planFeatures = getPlanFeatures(planName);

  // Total influencer count
  const { count: totalInfluencers } = await supabase
    .from("influencers")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Total images (generation_outputs linked to jobs owned by this user)
  const { count: totalImages } = await supabase
    .from("generation_outputs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Total videos: generation_jobs of type video that are completed
  const { count: totalVideos } = await supabase
    .from("generation_jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "completed")
    .or("model_id.ilike.%video%,model_id.ilike.%veo%,model_id.ilike.%sora%,model_id.ilike.%kling%,model_id.ilike.%wan%");

  // Recent influencers (last 4)
  const { data: rawInfluencers } = await supabase
    .from("influencers")
    .select("id, user_id, name, description, avatar_url, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(4);

  // Build recent influencer items with per-influencer image/video counts
  const recentInfluencers = await Promise.all(
    (rawInfluencers ?? []).map(async (inf) => {
      const { count: imgCount } = await supabase
        .from("generation_outputs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Use generation_jobs for video count per influencer (if model_id stored)
      const { count: vidCount } = await supabase
        .from("generation_jobs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed")
        .or("model_id.ilike.%video%,model_id.ilike.%veo%,model_id.ilike.%sora%,model_id.ilike.%kling%,model_id.ilike.%wan%");

      return {
        id: inf.id,
        userId: inf.user_id,
        name: inf.name ?? "",
        niche: inf.description ?? "",
        bodyShape: "",
        characteristics: [],
        style: "",
        ethnicity: "",
        age: 25,
        avatarUrl: inf.avatar_url ?? null,
        status: "generated" as const,
        imageCount: imgCount ?? 0,
        videoCount: vidCount ?? 0,
        createdAt: inf.created_at,
        updatedAt: inf.updated_at ?? inf.created_at,
      };
    })
  );

  // Calculate remaining limits based on plan
  const influencerLimit = planFeatures.influencers_limit;
  const influencersRemaining =
    influencerLimit === null ? -1 : Math.max(0, influencerLimit - (totalInfluencers ?? 0));

  const monthlyCredits = PLAN_CREDITS[planName] ?? 0;
  // Use credits as a proxy for remaining image/video budget
  const currentCredits =
    (profile?.subscription_credits ?? 0) + (profile?.bonus_credits ?? 0);

  // Approximate remaining images (5 credits each) and videos (20 credits each)
  const imagesRemaining = monthlyCredits === 0 ? -1 : Math.floor(currentCredits / 5);
  const videosRemaining = monthlyCredits === 0 ? -1 : Math.floor(currentCredits / 20);

  return NextResponse.json({
    totalInfluencers: totalInfluencers ?? 0,
    totalImages: totalImages ?? 0,
    totalVideos: totalVideos ?? 0,
    recentInfluencers,
    plan: planName,
    imagesRemaining,
    videosRemaining,
    influencersRemaining,
  });
}
