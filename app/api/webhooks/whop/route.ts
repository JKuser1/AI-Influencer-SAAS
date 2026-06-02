import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { WHOP_PLAN_ID_MAP } from "@/lib/whop";
import { PLAN_CREDITS } from "@/lib/supabase-server";

/**
 * Verify a Whop webhook signature using HMAC-SHA256.
 * This lives here (server-only route) so Node's crypto module is never
 * bundled into client-side code.
 */
function verifyWhopWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader) return false;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody);
  const expected = `sha256=${hmac.digest("hex")}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}

// Whop product ID → plan mapping (used by membership.went_valid event)
const PRODUCT_PLAN_MAP: Record<string, { plan: string; credits: number }> = {
  "plan_D5ZUinMIB5DyW": { plan: "basic",   credits: 300  },
  "plan_0Ci43RCmPMOW4": { plan: "starter", credits: 800  },
  "plan_ivBQT0voqG3BI": { plan: "pro",     credits: 2500 },
};

// Credit pack metadata → credit amount mapping (mirrors /api/credits/purchase)
const PACK_CREDITS: Record<string, { credits: number; name: string }> = {
  "starter-pack": { credits: 200,  name: "Starter Pack" },
  "creator-pack": { credits: 600,  name: "Creator Pack" },
  "pro-pack":     { credits: 1500, name: "Pro Pack" },
};

/**
 * Supabase admin client (service role key bypasses RLS so the webhook can
 * write to any user's row without a session token).
 */
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, { auth: { persistSession: false } });
}

// POST /api/webhooks/whop
export async function POST(request: Request) {
  const secret = process.env.WHOP_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[whop-webhook] WHOP_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Misconfigured" }, { status: 500 });
  }

  // Read raw body (needed for signature verification)
  const rawBody = await request.text();
  const signature = request.headers.get("whop-signature");

  if (!verifyWhopWebhookSignature(rawBody, signature, secret)) {
    console.warn("[whop-webhook] Invalid signature — rejected");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: Record<string, any>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const webhookId = request.headers.get("webhook-id") ?? event?.id ?? null;
  const eventType: string = event?.action ?? event?.type ?? "";
  const data = event?.data ?? {};

  // Always return 200 immediately so Whop doesn't time out or retry prematurely.
  // Process the event asynchronously below.
  const response = NextResponse.json({ received: true }, { status: 200 });

  // ── Async fulfillment ────────────────────────────────────────────────────
  ;(async () => {
    try {
      const supabase = createAdminClient();

      // ── Idempotency check ──────────────────────────────────────────────
      if (webhookId) {
        const { data: existing } = await supabase
          .from("processed_webhooks")
          .select("id")
          .eq("id", webhookId)
          .single();

        if (existing) {
          console.log(`[whop-webhook] Already processed webhook ${webhookId} — skipping`);
          return;
        }
      }

      // ── Handle events ──────────────────────────────────────────────────
      if (eventType === "payment.succeeded") {
        await handlePaymentSucceeded(supabase, data);
      } else if (eventType === "membership.went_valid") {
        await handleMembershipWentValid(supabase, data);
      } else if (eventType === "membership.deactivated") {
        await handleMembershipDeactivated(supabase, data);
      } else {
        console.log(`[whop-webhook] Unhandled event type: ${eventType}`);
      }

      // Mark webhook as processed (idempotency record)
      if (webhookId) {
        await supabase
          .from("processed_webhooks")
          .insert({ id: webhookId, processed_at: new Date().toISOString() })
          .throwOnError();
      }
    } catch (err) {
      console.error("[whop-webhook] Processing error:", err);
    }
  })();

  return response;
}

// ─── payment.succeeded ────────────────────────────────────────────────────────
async function handlePaymentSucceeded(
  supabase: ReturnType<typeof createAdminClient>,
  data: Record<string, any>
) {
  const metadata: Record<string, string> = data?.metadata ?? {};
  const userId = metadata["userId"];
  const packId  = metadata["packId"];
  const whopPlanId: string = data?.plan_id ?? data?.planId ?? "";

  if (!userId) {
    console.warn("[whop-webhook] payment.succeeded missing userId metadata");
    return;
  }

  // ── Credit pack purchase ──────────────────────────────────────────────────
  if (packId) {
    const pack = PACK_CREDITS[packId];
    if (!pack) {
      console.warn(`[whop-webhook] Unknown packId in metadata: ${packId}`);
      return;
    }

    // Read current bonus credits
    const { data: profile } = await supabase
      .from("profiles")
      .select("bonus_credits")
      .eq("id", userId)
      .single();

    const currentBonus = profile?.bonus_credits ?? 0;
    const newBonus = currentBonus + pack.credits;

    await supabase
      .from("profiles")
      .update({ bonus_credits: newBonus })
      .eq("id", userId)
      .throwOnError();

    await supabase.from("credit_packs").insert({
      user_id:        userId,
      pack_name:      pack.name,
      credits_amount: pack.credits,
      purchased_at:   new Date().toISOString(),
    });

    console.log(`[whop-webhook] Added ${pack.credits} bonus credits to user ${userId}`);
    return;
  }

  // ── Plan subscription ─────────────────────────────────────────────────────
  const internalPlan = WHOP_PLAN_ID_MAP[whopPlanId];
  if (!internalPlan) {
    console.warn(`[whop-webhook] Unknown Whop plan ID: ${whopPlanId}`);
    return;
  }

  const creditsToAssign = PLAN_CREDITS[internalPlan] ?? 0;

  await supabase
    .from("profiles")
    .update({
      plan_name:             internalPlan,
      subscription_credits:  creditsToAssign,
    })
    .eq("id", userId)
    .throwOnError();

  await supabase
    .from("subscriptions")
    .upsert(
      { user_id: userId, plan_name: internalPlan, status: "active" },
      { onConflict: "user_id" }
    );

  console.log(`[whop-webhook] Activated plan "${internalPlan}" for user ${userId}`);
}

// ─── membership.went_valid ────────────────────────────────────────────────────
// Triggered by the Whop embedded checkout on successful payment.
// Looks up the user by email (since no userId metadata is available here).
async function handleMembershipWentValid(
  supabase: ReturnType<typeof createAdminClient>,
  data: Record<string, any>
) {
  const productId: string = data?.product_id ?? data?.product?.id ?? "";
  const userEmail: string = data?.user?.email ?? "";

  const entry = PRODUCT_PLAN_MAP[productId];
  if (!entry) {
    console.warn(`[whop-webhook] membership.went_valid — unknown product: ${productId}`);
    return;
  }

  if (!userEmail) {
    console.warn("[whop-webhook] membership.went_valid — missing user email");
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", userEmail)
    .single();

  if (!profile) {
    console.warn(`[whop-webhook] membership.went_valid — no profile for email: ${userEmail}`);
    return;
  }

  await supabase
    .from("profiles")
    .update({
      plan_name:            entry.plan,
      subscription_credits: entry.credits,
      subscription_status:  "active",
      updated_at:           new Date().toISOString(),
    })
    .eq("id", profile.id)
    .throwOnError();

  console.log(`[whop-webhook] Activated plan "${entry.plan}" for ${userEmail} via membership.went_valid`);
}

// ─── membership.deactivated ───────────────────────────────────────────────────
async function handleMembershipDeactivated(
  supabase: ReturnType<typeof createAdminClient>,
  data: Record<string, any>
) {
  const metadata: Record<string, string> = data?.metadata ?? {};
  const userId = metadata["userId"];

  if (!userId) {
    console.warn("[whop-webhook] membership.deactivated missing userId metadata");
    return;
  }

  await supabase
    .from("profiles")
    .update({ plan_name: "free", subscription_credits: 0 })
    .eq("id", userId)
    .throwOnError();

  await supabase
    .from("subscriptions")
    .update({ status: "inactive" })
    .eq("user_id", userId);

  console.log(`[whop-webhook] Deactivated plan for user ${userId}`);
}
