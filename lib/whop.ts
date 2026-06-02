import crypto from "crypto";

// ─── Whop Plan ID → internal plan name mapping ───────────────────────────────
// These are the Whop plan IDs extracted from the checkout link paths.
export const WHOP_PLAN_ID_MAP: Record<string, string> = {
  "plan_D5ZUinMIB5DyW": "basic",
  "plan_0Ci43RCmPMOW4": "starter",
  "plan_ivBQT0voqG3BI": "pro",
};

// ─── Whop checkout URLs ───────────────────────────────────────────────────────
// Credit pack links should be added once you've created them in Whop.
export const WHOP_CHECKOUT_URLS: Record<string, string | null> = {
  // Plans
  basic:   "https://whop.com/checkout/plan_D5ZUinMIB5DyW",
  starter: "https://whop.com/checkout/plan_0Ci43RCmPMOW4",
  pro:     "https://whop.com/checkout/plan_ivBQT0voqG3BI",
  // Credit packs — add URLs once created in Whop
  "starter-pack": null,
  "creator-pack": null,
  "pro-pack":     null,
};

/**
 * Build a Whop checkout URL, appending the user ID and redirect URL as
 * metadata so the webhook can match the payment back to the correct user.
 *
 * Whop echoes metadata back in the webhook payload exactly as passed here.
 */
export function buildCheckoutUrl({
  baseUrl,
  userId,
  redirectUrl,
  extraMetadata = {},
}: {
  baseUrl: string;
  userId: string;
  redirectUrl: string;
  extraMetadata?: Record<string, string>;
}): string {
  const url = new URL(baseUrl);
  url.searchParams.set("metadata[userId]", userId);
  url.searchParams.set("redirect_url", redirectUrl);
  for (const [k, v] of Object.entries(extraMetadata)) {
    url.searchParams.set(`metadata[${k}]`, v);
  }
  return url.toString();
}

/**
 * Verify a Whop webhook signature using HMAC-SHA256.
 * Returns true if the signature matches.
 *
 * Whop signs the raw request body with the secret you set in the dashboard.
 * Header name: "whop-signature"  (format: "sha256=<hex>")
 */
export function verifyWhopWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader) return false;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody);
  const expected = `sha256=${hmac.digest("hex")}`;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signatureHeader)
    );
  } catch {
    return false;
  }
}
