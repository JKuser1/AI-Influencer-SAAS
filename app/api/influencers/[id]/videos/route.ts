import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase-server";

// GET /api/influencers/[id]/videos
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: jobs } = await supabase
    .from("generation_jobs")
    .select("id, model_id, status, credits_cost, created_at")
    .eq("user_id", user.id)
    .or("model_id.ilike.%video%,model_id.ilike.%veo%,model_id.ilike.%sora%,model_id.ilike.%kling%,model_id.ilike.%wan%")
    .order("created_at", { ascending: false });

  const jobIds = (jobs ?? []).map((j) => j.id);

  // Get outputs for these jobs
  const outputs: Record<string, string> = {};
  if (jobIds.length > 0) {
    const { data: outs } = await supabase
      .from("generation_outputs")
      .select("job_id, output_url")
      .in("job_id", jobIds);
    for (const o of outs ?? []) {
      outputs[o.job_id] = o.output_url;
    }
  }

  const videos = (jobs ?? []).map((job) => ({
    id: job.id,
    influencerId: Number(id),
    userId: user.id,
    prompt: "",
    videoUrl: outputs[job.id] ?? "",
    status: job.status ?? "pending",
    createdAt: job.created_at,
  }));

  return NextResponse.json(videos);
}

// POST /api/influencers/[id]/videos
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { prompt, modelId, creditsCost } = body;

  const { data: job, error: jobError } = await supabase
    .from("generation_jobs")
    .insert({
      user_id: user.id,
      model_id: modelId ?? "wan-video/wan-2.2-i2v-fast",
      status: "pending",
      credits_cost: creditsCost ?? 20,
    })
    .select("id, created_at")
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: jobError?.message ?? "Failed to create job" }, { status: 500 });
  }

  return NextResponse.json({
    id: job.id,
    influencerId: Number(id),
    userId: user.id,
    prompt: prompt ?? "",
    videoUrl: "",
    status: "pending",
    createdAt: job.created_at,
  }, { status: 201 });
}
