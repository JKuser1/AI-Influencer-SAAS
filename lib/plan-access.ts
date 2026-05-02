export type PlanName = "basic" | "starter" | "pro" | "free";

interface PlanFeatures {
  influencers_limit: number | null;
  nsfw_enabled: boolean;
  motion_control_access: boolean;
  allowed_image_models: string[];
  allowed_video_models: string[];
  allowed_motion_models: string[];
}

export function getPlanFeatures(planName: string): PlanFeatures {
  const plans: Record<string, PlanFeatures> = {
    basic: {
      influencers_limit: 1,
      nsfw_enabled: false,
      motion_control_access: false,
      allowed_image_models: [
        "google/nano-banana",
        "bytedance/seedream-4.5",
        "qwen/qwen-image-edit-plus",
        "qwen/qwen-image",
      ],
      allowed_video_models: [
        "wan-video/wan-2.2-i2v-fast",
        "wan-video/wan-2.6-i2v",
        "kwaivgi/kling-v3-video",
      ],
      allowed_motion_models: [],
    },
    starter: {
      influencers_limit: 3,
      nsfw_enabled: true,
      motion_control_access: true,
      allowed_image_models: [
        "google/nano-banana",
        "bytedance/seedream-4.5",
        "qwen/qwen-image-edit-plus",
        "qwen/qwen-image",
        "google/nano-banana-2",
        "openai/gpt-image-1.5",
      ],
      allowed_video_models: [
        "wan-video/wan-2.2-i2v-fast",
        "wan-video/wan-2.6-i2v",
        "kwaivgi/kling-v3-video",
        "google/veo-3.1",
        "openai/sora-2",
      ],
      allowed_motion_models: [
        "kwaivgi/kling-v3-motion-control",
        "kwaivgi/kling-v2.6-motion-control",
      ],
    },
    pro: {
      influencers_limit: null,
      nsfw_enabled: true,
      motion_control_access: true,
      allowed_image_models: ["ALL"],
      allowed_video_models: ["ALL"],
      allowed_motion_models: ["ALL"],
    },
  };
  return plans[planName] ?? plans["basic"];
}

export function canAccessModel(planName: string, modelId: string, type: "image" | "video" | "motion" = "image"): boolean {
  const features = getPlanFeatures(planName);
  const key = type === "motion" ? "allowed_motion_models" : type === "video" ? "allowed_video_models" : "allowed_image_models";
  if (features[key].includes("ALL")) return true;
  return features[key].includes(modelId);
}

export function canAccessMotion(planName: string): boolean {
  return getPlanFeatures(planName).motion_control_access;
}

export function canCreateInfluencer(planName: string, currentCount: number): boolean {
  const limit = getPlanFeatures(planName).influencers_limit;
  if (limit === null) return true;
  return currentCount < limit;
}

export function isNSFWEnabled(planName: string): boolean {
  return getPlanFeatures(planName).nsfw_enabled;
}

export function getInfluencerLimit(planName: string): number | null {
  return getPlanFeatures(planName).influencers_limit;
}

export function getPlanThatUnlocks(modelId: string, type: "image" | "video" | "motion"): "starter" | "pro" {
  if (canAccessModel("starter", modelId, type)) return "starter";
  return "pro";
}
