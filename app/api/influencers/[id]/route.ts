import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase-server";

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

// GET /api/influencers/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: influencer, error } = await supabase
    .from("influencers")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !influencer) {
    return NextResponse.json({ error: "Influencer not found" }, { status: 404 });
  }

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

  return NextResponse.json(mapInfluencer(influencer as Record<string, unknown>, imgCount ?? 0, vidCount ?? 0));
}

// PATCH /api/influencers/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { name, niche, bodyShape, characteristics, style, ethnicity, age } = body;

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (niche !== undefined) updates.description = niche;
  if (bodyShape !== undefined) updates.body_shape = bodyShape;
  if (characteristics !== undefined) updates.characteristics = characteristics;
  if (style !== undefined) updates.style = style;
  if (ethnicity !== undefined) updates.ethnicity = ethnicity;
  if (age !== undefined) updates.age = age;
  updates.updated_at = new Date().toISOString();

  const { data: influencer, error } = await supabase
    .from("influencers")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error || !influencer) {
    return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 404 });
  }

  return NextResponse.json(mapInfluencer(influencer as Record<string, unknown>));
}

// DELETE /api/influencers/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { error } = await supabase
    .from("influencers")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new Response(null, { status: 204 });
}
