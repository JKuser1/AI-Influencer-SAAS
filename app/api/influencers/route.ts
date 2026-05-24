import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase-server";
import { getPlanFeatures } from "@/lib/plan-access";

/** Map a raw influencers DB row to the Influencer schema expected by the frontend. */
function mapInfluencer(inf: Record<string, unknown>, imageCount = 0, videoCount = 0) {
  return {
    id: inf.id,
    userId: inf.user_id,
    name: inf.name ?? "",
    niche: inf.description ?? "",
    bodyShape: (inf.body_shape as string) ?? "",
    characteristics: (inf.characteristics as string[]) ?? [],
    style: (inf.style as string) ?? "",
    ethnicity: (inf.ethnicity as string) ?? "",
    age: (inf.age as number) ?? 25,
    avatarUrl: inf.avatar_url ?? null,
    status: (inf.status as string) ?? "generated",
    imageCount,
    videoCount,
    createdAt: inf.created_at,
    updatedAt: inf.updated_at ?? inf.created_at,
  };
}

// GET /api/influencers
export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: influencers, error } = await supabase
    .from("influencers")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Attach output counts per influencer
  const result = await Promise.all(
    (influencers ?? []).map(async (inf) => {
      const { count: imgCount } = await supabase
        .from("generation_outputs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { count: vidCount } = await supabase
        .from("generation_jobs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed")
        .or("model_id.ilike.%video%,model_id.ilike.%veo%,model_id.ilike.%sora%,model_id.ilike.%kling%,model_id.ilike.%wan%");

      return mapInfluencer(inf as Record<string, unknown>, imgCount ?? 0, vidCount ?? 0);
    })
  );

  return NextResponse.json(result);
}

// POST /api/influencers
export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check influencer limit for the user's plan
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_name")
    .eq("id", user.id)
    .single();

  const planName = profile?.plan_name ?? "basic";
  const features = getPlanFeatures(planName);

  if (features.influencers_limit !== null) {
    const { count } = await supabase
      .from("influencers")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if ((count ?? 0) >= features.influencers_limit) {
      return NextResponse.json(
        { error: `Your ${planName} plan allows a maximum of ${features.influencers_limit} influencer(s). Upgrade to create more.` },
        { status: 403 }
      );
    }
  }

  const body = await request.json().catch(() => ({}));
  const { name, niche, bodyShape, characteristics, style, ethnicity, age } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { data: influencer, error } = await supabase
    .from("influencers")
    .insert({
      user_id: user.id,
      name: name.trim(),
      description: niche ?? "",
      body_shape: bodyShape ?? "",
      characteristics: characteristics ?? [],
      style: style ?? "",
      ethnicity: ethnicity ?? "",
      age: age ?? 25,
      status: "draft",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(mapInfluencer(influencer as Record<string, unknown>), { status: 201 });
}
