import { NextResponse } from "next/server";
import { PLAN_CREDITS } from "@/lib/supabase-server";

// GET /api/plans — returns the available plans
export async function GET() {
  const plans = [
    {
      id: "basic",
      name: "Basic",
      price: 9,
      interval: "month",
      influencerLimit: 1,
      imageLimit: Math.floor(PLAN_CREDITS["basic"] / 5),
      videoLimit: Math.floor(PLAN_CREDITS["basic"] / 20),
      features: [
        "1 AI influencer",
        `${PLAN_CREDITS["basic"]} credits/month`,
        "4 image models",
        "3 video models",
        "Community support",
      ],
    },
    {
      id: "starter",
      name: "Starter",
      price: 24,
      interval: "month",
      influencerLimit: 3,
      imageLimit: Math.floor(PLAN_CREDITS["starter"] / 5),
      videoLimit: Math.floor(PLAN_CREDITS["starter"] / 20),
      features: [
        "3 AI influencers",
        `${PLAN_CREDITS["starter"]} credits/month`,
        "6 image models incl. GPT Image 1.5",
        "5 video models incl. Veo 3.1 & Sora 2",
        "NSFW content enabled",
        "Motion control access",
        "Priority support",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: 68,
      interval: "month",
      influencerLimit: -1,
      imageLimit: -1,
      videoLimit: -1,
      features: [
        "Unlimited AI influencers",
        `${PLAN_CREDITS["pro"]} credits/month`,
        "All image models incl. Nano Banana Pro",
        "All video models incl. Sora 2 Pro",
        "Kling V3.0 Pro access",
        "NSFW content enabled",
        "Full motion control access",
        "Priority support",
      ],
    },
  ];

  return NextResponse.json(plans);
}
