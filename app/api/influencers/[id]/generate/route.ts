import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase-server";

// POST /api/influencers/[id]/generate
// Triggers avatar generation for an influencer. 
// For now, marks the influencer as "generated" and returns the updated record.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: influencer, error } = await supabase
    .from("influencers")
    .update({ status: "generated", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error || !influencer) {
    return NextResponse.json({ error: "Influencer not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: influencer.id,
    userId: influencer.user_id,
    name: influencer.name ?? "",
    niche: influencer.description ?? "",
    bodyShape: influencer.body_shape ?? "",
    characteristics: influencer.characteristics ?? [],
    style: influencer.style ?? "",
    ethnicity: influencer.ethnicity ?? "",
    age: influencer.age ?? 25,
    avatarUrl: influencer.avatar_url ?? null,
    status: influencer.status ?? "generated",
    imageCount: 0,
    videoCount: 0,
    createdAt: influencer.created_at,
    updatedAt: influencer.updated_at ?? influencer.created_at,
  });
}
