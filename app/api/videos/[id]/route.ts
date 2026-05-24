import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase-server";

// DELETE /api/videos/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Delete the generation job (and its outputs via cascade if configured, or separately)
  const { error } = await supabase
    .from("generation_jobs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new Response(null, { status: 204 });
}
