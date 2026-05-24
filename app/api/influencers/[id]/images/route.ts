import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase-server";

// GET /api/influencers/[id]/images
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Fetch jobs for this influencer to get linked outputs
  const { data: jobs } = await supabase
    .from("generation_jobs")
    .select("id, model_id, created_at")
    .eq("user_id", user.id)
    .not("model_id", "ilike", "%video%")
    .not("model_id", "ilike", "%veo%")
    .not("model_id", "ilike", "%sora%")
    .not("model_id", "ilike", "%kling%")
    .not("model_id", "ilike", "%wan%")
    .order("created_at", { ascending: false });

  const jobIds = (jobs ?? []).map((j) => j.id);

  if (jobIds.length === 0) return NextResponse.json([]);

  const { data: outputs } = await supabase
    .from("generation_outputs")
    .select("id, job_id, user_id, output_url, created_at")
    .eq("user_id", user.id)
    .in("job_id", jobIds)
    .order("created_at", { ascending: false });

  const images = (outputs ?? []).map((out) => ({
    id: out.id,
    influencerId: Number(id),
    userId: out.user_id,
    prompt: "",
    imageUrl: out.output_url,
    style: null,
    createdAt: out.created_at,
  }));

  return NextResponse.json(images);
}

// POST /api/influencers/[id]/images — create a generation job for an image
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { prompt, style, modelId, creditsCost } = body;

  // Create a generation job
  const { data: job, error: jobError } = await supabase
    .from("generation_jobs")
    .insert({
      user_id: user.id,
      model_id: modelId ?? "google/nano-banana",
      status: "completed",
      credits_cost: creditsCost ?? 5,
    })
    .select("id, created_at")
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: jobError?.message ?? "Failed to create job" }, { status: 500 });
  }

  // For now return a placeholder image response — real generation happens externally
  return NextResponse.json({
    id: job.id,
    influencerId: Number(id),
    userId: user.id,
    prompt: prompt ?? "",
    imageUrl: "",
    style: style ?? null,
    createdAt: job.created_at,
  }, { status: 201 });
}
