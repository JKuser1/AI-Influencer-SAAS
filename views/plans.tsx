"use client";

import { useEffect } from "react";
import { AppLayout } from "@/components/layout";
import { useGetMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Check, X, Zap, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";


const C = {
  primary: "#7C5CFC",
  border: "#EBEBF5",
  bg: "#F8F8FC",
  panel: "#FFFFFF",
  text: "#0F0F1A",
  muted: "#6B6B8A",
};

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: 9,
    highlight: false,
    badge: null,
    cta: "Get Started",
  },
  {
    id: "starter",
    name: "Starter",
    price: 24,
    highlight: true,
    badge: "Most Popular",
    cta: "Upgrade Now",
  },
  {
    id: "pro",
    name: "Pro",
    price: 68,
    highlight: false,
    badge: null,
    cta: "Go Pro",
  },
];

type CellValue = string | boolean;

interface ComparisonRow {
  label: string;
  basic: CellValue;
  starter: CellValue;
  pro: CellValue;
  group?: string;
}

const ROWS: ComparisonRow[] = [
  { label: "Credits / month", basic: "300 cr", starter: "800 cr", pro: "2,500 cr", group: "Credits" },
  { label: "~Images", basic: "~60 images", starter: "~160 images", pro: "~500 images", group: "Credits" },
  { label: "~Short videos", basic: "~20 videos", starter: "~32 videos", pro: "~100 videos", group: "Credits" },
  { label: "AI Influencers", basic: "1", starter: "3", pro: "Unlimited", group: "Core" },
  { label: "Image Models", basic: "4 models", starter: "6 models", pro: "All models", group: "Core" },
  { label: "Video Models", basic: "3 models", starter: "5 models", pro: "All models", group: "Core" },
  { label: "Motion Control", basic: false, starter: true, pro: true, group: "Features" },
  { label: "NSFW Content", basic: false, starter: true, pro: true, group: "Features" },
  { label: "Nano Banana Pro", basic: false, starter: false, pro: true, group: "Premium Models" },
  { label: "Kling V3.0 Pro", basic: false, starter: false, pro: true, group: "Premium Models" },
  { label: "Sora 2 Pro", basic: false, starter: false, pro: true, group: "Premium Models" },
];

function Cell({ value }: { value: CellValue }) {
  if (typeof value === "boolean") {
    return value
      ? <Check size={18} style={{ color: C.primary, margin: "0 auto", display: "block" }} />
      : <X size={18} style={{ color: "#D1D1E0", margin: "0 auto", display: "block" }} />;
  }
  return <span style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{value}</span>;
}

export default function Plans() {
  const { data: user } = useGetMe();
  const { toast } = useToast();
  const router = useRouter();

  const openCheckout = (planName: string) => {
    const checkoutUrls: Record<string, string> = {
      basic:   "https://whop.com/checkout/plan_D5ZUinMIB5DyW",
      starter: "https://whop.com/checkout/plan_0Ci43RCmPMOW4",
      pro:     "https://whop.com/checkout/plan_ivBQT0voqG3BI",
    };

    const url = checkoutUrls[planName];
    if (!url) return;

    if (!user) {
      localStorage.setItem("intended_plan", planName);
      router.push("/login?redirect=/plans");
      return;
    }

    // Remove existing overlay if any
    const existing = document.getElementById("whop-overlay");
    if (existing) document.body.removeChild(existing);

    // Create overlay
    const overlay = document.createElement("div");
    overlay.id = "whop-overlay";
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.85); z-index: 9999;
      display: flex; align-items: center; justify-content: center;
    `;

    // Create modal
    const modal = document.createElement("div");
    modal.style.cssText = `
      position: relative;
      width: 90%;
      max-width: 480px;
      height: 80vh;
      max-height: 700px;
      border-radius: 16px;
      overflow: hidden;
      background: white;
      box-shadow: 0 25px 60px rgba(0,0,0,0.4);
    `;

    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "&#x2715;";
    closeBtn.style.cssText = `
      position: absolute; top: 12px; right: 12px;
      background: rgba(0,0,0,0.6); color: white;
      border: none; border-radius: 50%;
      width: 36px; height: 36px; font-size: 16px;
      cursor: pointer; z-index: 10;
      display: flex; align-items: center; justify-content: center;
    `;
    closeBtn.onclick = () => document.body.removeChild(overlay);

    // Iframe
    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.style.cssText = "width: 100%; height: 100%; border: none;";
    iframe.setAttribute("allow", "payment *");

    modal.appendChild(closeBtn);
    modal.appendChild(iframe);
    overlay.appendChild(modal);
    overlay.onclick = (e) => {
      if (e.target === overlay) document.body.removeChild(overlay);
    };
    document.body.appendChild(overlay);
  };

  // After login, auto-open checkout if user came from a plan button click
  useEffect(() => {
    if (user) {
      const intendedPlan = localStorage.getItem("intended_plan");
      if (intendedPlan) {
        localStorage.removeItem("intended_plan");
        setTimeout(() => openCheckout(intendedPlan), 500);
      }
    }
  }, [user]);

  const currentPlan = user?.plan ?? "basic";

  const groups = Array.from(new Set(ROWS.map(r => r.group)));

  return (
    <AppLayout withSidebar={!!user}>
      <div style={{ minHeight: "100vh", background: C.bg, padding: "40px 16px 80px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 999,
                background: `${C.primary}12`, border: `1px solid ${C.primary}30`,
                marginBottom: 20,
              }}
            >
              <Zap size={14} style={{ color: C.primary }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.primary }}>Simple, Transparent Pricing</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              style={{ fontSize: 36, fontWeight: 800, color: C.text, marginBottom: 12, letterSpacing: -0.5 }}
            >
              Scale Your Digital Empire
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              style={{ fontSize: 16, color: C.muted, maxWidth: 480, margin: "0 auto" }}
            >
              Choose the tier that fits your creative ambitions. Upgrade or downgrade anytime.
            </motion.p>
          </div>

          {/* Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ background: C.panel, borderRadius: 20, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}
          >
            {/* Plan headers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ padding: "24px 20px" }} />
              {PLANS.map((plan) => {
                const isCurrentPlan = currentPlan === plan.id || (currentPlan === "free" && plan.id === "basic");
                return (
                  <div key={plan.id} style={{
                    padding: "24px 16px", textAlign: "center",
                    background: plan.highlight ? `${C.primary}06` : "transparent",
                    borderLeft: `1px solid ${C.border}`,
                    position: "relative",
                  }}>
                    {plan.badge && (
                      <div style={{
                        fontSize: 10, fontWeight: 700, color: "#fff", background: C.primary,
                        padding: "2px 10px", borderRadius: 999, display: "inline-block", marginBottom: 8, letterSpacing: "0.06em",
                      }}>
                        {plan.badge.toUpperCase()}
                      </div>
                    )}
                    <p style={{ fontWeight: 800, fontSize: 16, color: C.text, marginBottom: 4 }}>{plan.name}</p>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 2, marginBottom: 16 }}>
                      <span style={{ fontSize: 28, fontWeight: 800, color: C.text }}>${plan.price}</span>
                      <span style={{ fontSize: 13, color: C.muted }}>/mo</span>
                    </div>
                    <Button
                      onClick={() => openCheckout(plan.id)}
                      disabled={isCurrentPlan}
                      style={{
                        width: "100%", height: 36, fontSize: 13, fontWeight: 700,
                        background: plan.highlight && !isCurrentPlan ? C.primary : "transparent",
                        color: plan.highlight && !isCurrentPlan ? "#fff" : isCurrentPlan ? C.muted : C.primary,
                        border: isCurrentPlan ? `1px solid ${C.border}` : plan.highlight && !isCurrentPlan ? "none" : `1px solid ${C.primary}`,
                        borderRadius: 10, cursor: isCurrentPlan ? "default" : "pointer",
                        boxShadow: plan.highlight && !isCurrentPlan ? `0 0 16px ${C.primary}40` : "none",
                      }}
                    >
                      {isCurrentPlan ? "Current Plan" : plan.cta}
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Feature rows */}
            {groups.map((group) => {
              const groupRows = ROWS.filter(r => r.group === group);
              return (
                <div key={group}>
                  <div style={{ padding: "10px 20px 6px", background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{group}</span>
                  </div>
                  {groupRows.map((row, ri) => (
                    <div
                      key={row.label}
                      style={{
                        display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
                        borderBottom: ri < groupRows.length - 1 ? `1px solid ${C.border}` : "none",
                      }}
                    >
                      <div style={{ padding: "14px 20px", display: "flex", alignItems: "center" }}>
                        <span style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{row.label}</span>
                      </div>
                      {(["basic", "starter", "pro"] as const).map((planId, pi) => (
                        <div key={planId} style={{
                          padding: "14px 16px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center",
                          background: PLANS[pi].highlight ? `${C.primary}04` : "transparent",
                          borderLeft: `1px solid ${C.border}`,
                        }}>
                          <Cell value={row[planId]} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Bottom CTA row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", borderTop: `1px solid ${C.border}`, background: C.bg }}>
              <div style={{ padding: "20px" }} />
              {PLANS.map((plan, pi) => {
                const isCurrentPlan = currentPlan === plan.id || (currentPlan === "free" && plan.id === "basic");
                return (
                  <div key={plan.id} style={{
                    padding: "20px 16px", textAlign: "center",
                    background: PLANS[pi].highlight ? `${C.primary}04` : "transparent",
                    borderLeft: `1px solid ${C.border}`,
                  }}>
                    <Button
                      onClick={() => openCheckout(plan.id)}
                      disabled={isCurrentPlan}
                      style={{
                        width: "100%", height: 36, fontSize: 13, fontWeight: 700,
                        background: plan.highlight && !isCurrentPlan ? C.primary : "transparent",
                        color: plan.highlight && !isCurrentPlan ? "#fff" : isCurrentPlan ? C.muted : C.primary,
                        border: isCurrentPlan ? `1px solid ${C.border}` : plan.highlight && !isCurrentPlan ? "none" : `1px solid ${C.primary}`,
                        borderRadius: 10, cursor: isCurrentPlan ? "default" : "pointer",
                        boxShadow: plan.highlight && !isCurrentPlan ? `0 0 16px ${C.primary}40` : "none",
                      }}
                    >
                      {isCurrentPlan ? "Current Plan" : plan.cta}
                    </Button>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Note */}
          <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: C.muted }}>
            <Lock size={12} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
            Credits reset monthly with your plan. Unused credits do not carry over. Upgrade anytime.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
