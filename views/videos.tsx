"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AppLayout, AuthGuard } from "@/components/layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  Sparkles, Download, Trash2, X, Loader2, Upload,
  Video, Clapperboard, Zap, ChevronDown, Check,
  AlertTriangle, Film, Play, Lock,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useGetMe } from "@workspace/api-client-react";
import { canAccessModel, canAccessMotion, getPlanThatUnlocks } from "@/lib/plan-access";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#F8F8FC",
  panel: "#FFFFFF",
  border: "#EBEBF5",
  pill: "#DDDDF0",
  pillBg: "#F0F0FA",
  pillTxt: "#6B6B8A",
  label: "#9090B0",
  text: "#0F0F1A",
  primary: "#7C5CFC",
  primaryLight: "#A78BFA",
  hoverBg: "#EEE8FF",
  selectedBg: "#F3EEFF",
  red: "#EF4444",
  amber: "#F59E0B",
  green: "#10B981",
  blue: "#3B82F6",
  indigo: "#6366F1",
  rose: "#F43F5E",
} as const;

// ─── Model definitions ────────────────────────────────────────────────────────
interface AnimModel {
  id: string; replicateId: string; name: string; displayName: string;
  badge: string; badgeColor: string; badgeBg: string;
  desc: string; creditHint: string; group: "premium" | "standard";
  supportsImage: boolean;
  durations: { id: string; label: string; credits: number }[];
  resolutions?: string[];
  aspectRatios: string[];
  hasModeToggle: boolean;
  klingMode?: "standard" | "pro";
  hasNegPrompt: boolean; hasNsfw: boolean;
  hasAudioUpload?: boolean; hasNativeAudio?: boolean;
  etaLabel: string;
}

const MODELS: AnimModel[] = [
  {
    id: "kling-v3-pro", replicateId: "kwaivgi/kling-v3-video",
    name: "Kling V3.0 Pro", displayName: "Premium (Kling v3.0 Pro)", badge: "Best Quality",
    badgeColor: C.primary, badgeBg: "rgba(124,92,252,0.12)",
    desc: "3-15s, Sound, I2V + T2V, No NSFW", creditHint: "95–280 cr",
    group: "premium", supportsImage: true,
    durations: [{ id: "5", label: "5s", credits: 95 }, { id: "10", label: "10s", credits: 185 }, { id: "15", label: "15s", credits: 280 }],
    resolutions: ["1080p"], aspectRatios: ["16:9", "9:16", "1:1"],
    hasModeToggle: false, klingMode: "pro", hasNegPrompt: true, hasNsfw: false, etaLabel: "2–4 min",
  },
  {
    id: "veo-31", replicateId: "google/veo-3.1",
    name: "Veo 3.1", displayName: "Ultra Realistic (VEO 3.1)", badge: "Cinema Grade",
    badgeColor: C.indigo, badgeBg: "rgba(99,102,241,0.12)",
    desc: "4-8 seconds, Ultra-realistic, Optional audio", creditHint: "110–165 cr",
    group: "premium", supportsImage: false,
    durations: [{ id: "5", label: "5s", credits: 110 }, { id: "8", label: "8s", credits: 165 }],
    resolutions: ["4K"], aspectRatios: ["16:9", "9:16"],
    hasModeToggle: false, hasNegPrompt: false, hasNsfw: false, hasNativeAudio: true, etaLabel: "3–5 min",
  },
  {
    id: "sora-2", replicateId: "openai/sora-2",
    name: "Sora 2", displayName: "Sora 2", badge: "Physics Realism",
    badgeColor: C.rose, badgeBg: "rgba(244,63,94,0.12)",
    desc: "With synced audio, No NSFW", creditHint: "135–660 cr",
    group: "premium", supportsImage: false,
    durations: [{ id: "5", label: "5s", credits: 135 }, { id: "10", label: "10s", credits: 265 }, { id: "20", label: "20s", credits: 530 }, { id: "25", label: "25s", credits: 660 }],
    resolutions: ["1080p"], aspectRatios: ["16:9", "9:16", "1:1"],
    hasModeToggle: false, hasNegPrompt: true, hasNsfw: false, etaLabel: "3–6 min",
  },
  {
    id: "sora-2-pro", replicateId: "openai/sora-2-pro",
    name: "Sora 2 Pro", displayName: "Sora 2 Pro", badge: "Highest Quality",
    badgeColor: "#000000", badgeBg: "rgba(0,0,0,0.12)",
    desc: "OpenAI's most powerful video model, best physics & realism, No NSFW", creditHint: "330–1300 cr",
    group: "premium", supportsImage: false,
    durations: [{ id: "5", label: "5s", credits: 330 }, { id: "10", label: "10s", credits: 650 }, { id: "20", label: "20s", credits: 1300 }],
    resolutions: ["1080p"], aspectRatios: ["16:9", "9:16", "1:1"],
    hasModeToggle: false, hasNegPrompt: false, hasNsfw: false, etaLabel: "5–10 min",
  },
  {
    id: "kling-v3", replicateId: "kwaivgi/kling-v3-video",
    name: "Kling V3.0", displayName: "Great Quality (Kling v3.0)", badge: "Fast",
    badgeColor: C.green, badgeBg: "rgba(16,185,129,0.12)",
    desc: "3-15s, Sound, I2V + T2V, Affordable, No NSFW", creditHint: "60–175 cr",
    group: "standard", supportsImage: true,
    durations: [{ id: "5", label: "5s", credits: 60 }, { id: "10", label: "10s", credits: 115 }],
    resolutions: ["720p", "1080p"], aspectRatios: ["16:9", "9:16", "1:1"],
    hasModeToggle: false, klingMode: "standard", hasNegPrompt: true, hasNsfw: false, etaLabel: "1–3 min",
  },
  {
    id: "wan-26", replicateId: "wan-video/wan-2.6-i2v",
    name: "Wan 2.6", displayName: "High Quality (Wan 2.6)", badge: "Open Source",
    badgeColor: C.blue, badgeBg: "rgba(59,130,246,0.12)",
    desc: "Text-to-video, 5/10/15s, Fast & affordable, Supports NSFW (sometimes)", creditHint: "25–48 cr",
    group: "standard", supportsImage: true,
    durations: [{ id: "5", label: "5s", credits: 25 }, { id: "10", label: "10s", credits: 48 }],
    resolutions: ["720p"], aspectRatios: ["16:9", "9:16", "1:1"],
    hasModeToggle: false, hasNegPrompt: true, hasNsfw: true, hasAudioUpload: true, etaLabel: "1–2 min",
  },
  {
    id: "wan-22", replicateId: "wan-video/wan-2.2-i2v-fast",
    name: "Wan 2.2", displayName: "Spicy & Cheap (WAN 2.2)", badge: "Budget",
    badgeColor: C.amber, badgeBg: "rgba(245,158,11,0.12)",
    desc: "Expressive visuals with vivid motion, NSFW support", creditHint: "15–28 cr",
    group: "standard", supportsImage: true,
    durations: [{ id: "5", label: "5s", credits: 15 }, { id: "10", label: "10s", credits: 28 }],
    resolutions: ["720p"], aspectRatios: ["16:9", "9:16", "1:1"],
    hasModeToggle: false, hasNegPrompt: true, hasNsfw: true, etaLabel: "1–2 min",
  },
];

const MOTION_VERSIONS = [
  { id: "v3", replicateId: "kwaivgi/kling-v3-motion-control", label: "Kling 3.0 Motion", tag: "v3.0 New", credits: { standard: 28, pro: 48 } },
  { id: "v26", replicateId: "kwaivgi/kling-v2.6-motion-control", label: "Kling 2.6 Motion", tag: "v2.6 Legacy", credits: { standard: 28, pro: 48 } },
];

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function SL({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.label, marginBottom: 8 }}>{children}</p>;
}
function Div() { return <div style={{ height: 1, background: C.border, margin: "6px 0" }} />; }

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
      border: active ? "none" : `1px solid ${C.pill}`,
      background: active ? C.primary : C.pillBg,
      color: active ? "#fff" : C.pillTxt,
      transition: "all .12s", fontFamily: "inherit",
    }}>
      {children}
    </button>
  );
}

// ─── Select Box ───────────────────────────────────────────────────────────────
function SelectBox({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div style={{ position: "relative" }}>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{
        width: "100%", appearance: "none", padding: "10px 36px 10px 14px",
        borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.panel,
        color: C.text, fontSize: 14, fontWeight: 500, fontFamily: "inherit",
        cursor: "pointer", outline: "none", transition: "border-color .15s",
      }}
        onFocus={(e) => (e.target.style.borderColor = C.primary)}
        onBlur={(e) => (e.target.style.borderColor = C.border)}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={15} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.label, pointerEvents: "none" }} />
    </div>
  );
}

// ─── Aspect Ratio Picker ──────────────────────────────────────────────────────
function aspectIcon(ratio: string): { w: number; h: number } {
  const [wa, ha] = ratio.split(":").map(Number);
  const maxW = 34, maxH = 24;
  if (wa / ha >= maxW / maxH) return { w: maxW, h: Math.max(6, Math.round(maxW * ha / wa)) };
  return { w: Math.max(6, Math.round(maxH * wa / ha)), h: maxH };
}

function AspectRatioPicker({ ratios, value, onChange }: { ratios: string[]; value: string; onChange: (r: string) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {ratios.map((r) => {
        const active = value === r;
        const { w, h } = aspectIcon(r);
        return (
          <button key={r} type="button" onClick={() => onChange(r)} style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "12px 8px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
            border: `1.5px solid ${active ? C.primary : C.border}`,
            background: active ? `${C.primary}10` : "#fff",
            transition: "all .15s", gap: 8,
          }}>
            <div style={{ width: 40, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{
                width: w, height: h, borderRadius: 3,
                border: `2px solid ${active ? C.primary : C.pillTxt}`,
                background: active ? `${C.primary}18` : "transparent",
              }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: active ? C.primary : C.pillTxt }}>{r}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Upgrade Modal (Video) ────────────────────────────────────────────────────
function UpgradeModal({ onClose, targetPlan }: { onClose: () => void; targetPlan: "starter" | "pro" }) {
  const planInfo: Record<string, { name: string; price: string; benefits: string[] }> = {
    starter: {
      name: "Starter", price: "$24/mo",
      benefits: ["5 video models incl. Veo 3.1 & Sora 2", "Full motion control access", "3 AI influencers", "NSFW content enabled", "6 image models"],
    },
    pro: {
      name: "Pro", price: "$68/mo",
      benefits: ["All video models incl. Sora 2 Pro", "Kling V3.0 Pro access", "Unlimited influencers", "All image models", "Priority support"],
    },
  };
  const plan = planInfo[targetPlan];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 32, maxWidth: 400, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${C.primary}15`, padding: "4px 10px", borderRadius: 999, marginBottom: 10 }}>
              <Lock size={12} style={{ color: C.primary }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: C.primary }}>UPGRADE REQUIRED</span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Unlock This Feature</h2>
            <p style={{ fontSize: 14, color: C.label, marginTop: 4 }}>Available on <strong>{plan.name}</strong> — {plan.price}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><X size={18} style={{ color: C.label }} /></button>
        </div>
        <div style={{ marginBottom: 24 }}>
          {plan.benefits.map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: `${C.primary}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <Check size={11} style={{ color: C.primary }} />
              </div>
              <span style={{ fontSize: 14, color: C.text, lineHeight: 1.4 }}>{b}</span>
            </div>
          ))}
        </div>
        <a href="/plans" style={{ display: "block", width: "100%", padding: "13px 0", borderRadius: 12, background: C.primary, color: "#fff", fontWeight: 700, fontSize: 15, textAlign: "center", textDecoration: "none", boxShadow: `0 0 20px ${C.primary}40` }}>
          Upgrade to {plan.name}
        </a>
      </div>
    </div>
  );
}

// ─── Model Dropdown ───────────────────────────────────────────────────────────
function ModelDropdown({ modelId, onChange, userPlan, onLockedClick }: {
  modelId: string; onChange: (id: string) => void;
  userPlan: string; onLockedClick: (plan: "starter" | "pro") => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const model = MODELS.find((m) => m.id === modelId)!;

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const premiumModels = MODELS.filter((m) => m.group === "premium");
  const standardModels = MODELS.filter((m) => m.group === "standard");

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger */}
      <button type="button" onClick={() => setOpen((v) => !v)} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "11px 14px", borderRadius: 12, cursor: "pointer",
        border: `1px solid ${open ? C.primary : C.pill}`,
        background: C.panel, fontFamily: "inherit", transition: "border-color .15s",
      }}>
        <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{model.displayName}</p>
          <p style={{ fontSize: 11, color: C.label, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{model.desc}</p>
        </div>
        <ChevronDown size={15} color={C.label} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }} />
      </button>
      {/* Dropdown */}
      {open && (
        <div className="model-dropdown-panel" style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 200,
          background: C.panel, border: `1px solid ${C.pill}`, borderRadius: 14,
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)", overflow: "hidden",
        }}>
          {[{ label: "PREMIUM", items: premiumModels }, { label: "STANDARD", items: standardModels }].map((group, gi) => (
            <div key={group.label}>
              {gi > 0 && <div style={{ height: 1, background: C.border, margin: "4px 0" }} />}
              {group.items.map((m) => {
                const locked = !canAccessModel(userPlan, m.replicateId, "video");
                const targetPlan = locked ? getPlanThatUnlocks(m.replicateId, "video") : null;
                const selected = m.id === modelId;
                return (
                  <button key={m.id} type="button"
                    onClick={() => {
                      if (locked) { setOpen(false); onLockedClick(targetPlan!); return; }
                      onChange(m.id); setOpen(false);
                    }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                      cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                      background: locked ? "#FAFAFA" : selected ? C.selectedBg : "transparent",
                      borderLeft: `3px solid ${selected && !locked ? C.primary : "transparent"}`,
                      opacity: locked ? 0.72 : 1,
                      transition: "background .1s",
                    }}
                    onMouseEnter={(e) => { if (!selected && !locked) (e.currentTarget as HTMLElement).style.background = C.hoverBg; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = locked ? "#FAFAFA" : selected ? C.selectedBg : "transparent"; }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <p style={{ fontWeight: 700, fontSize: 13, color: locked ? C.label : C.text }}>{m.displayName}</p>
                        {locked && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, color: "#fff", background: "#9CA3AF", padding: "1px 6px", borderRadius: 999 }}>
                            <Lock size={8} />LOCKED
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: C.label }}>{locked ? `Upgrade to ${targetPlan} to unlock` : m.desc}</p>
                    </div>
                    {selected && !locked && <Check size={13} color={C.primary} style={{ flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Upload Zone ─────────────────────────────────────────────────────────────
function UploadZone({ label, subLabel, accept, value, onChange, onClear, icon: Icon }: {
  label: string; subLabel: string; accept: string;
  value: string | null; onChange: (v: string) => void; onClear: () => void;
  icon: React.ElementType;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const isVideo = accept.includes("video");

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => { const r = e.target?.result; if (typeof r === "string") onChange(r); };
    reader.readAsDataURL(file);
  };

  if (value) {
    return (
      <div style={{ flex: 1, borderRadius: 12, border: `2px solid ${C.primary}`, background: `${C.primary}08`, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {isVideo ? (
          <div style={{ borderRadius: 8, overflow: "hidden", background: "#000", aspectRatio: "16/9" }}>
            <video src={value} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
          </div>
        ) : (
          <img src={value} alt="" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 8 }} />
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: C.primary, fontWeight: 500 }}>{isVideo ? "Video uploaded" : "Image uploaded"}</span>
          <button type="button" onClick={onClear} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
            <X size={13} color={C.label} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1 }}>
      <input ref={ref} type="file" accept={accept} style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); e.target.value = ""; }} />
      <button type="button" onClick={() => ref.current?.click()}
        style={{
          width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 8, padding: "24px 12px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
          border: `2px dashed ${C.pill}`, background: C.bg, transition: "all .15s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.primary; (e.currentTarget as HTMLElement).style.background = C.selectedBg; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.pill; (e.currentTarget as HTMLElement).style.background = C.bg; }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 10, background: C.pillBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={18} color={C.label} />
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 3 }}>{label}</p>
          <p style={{ fontSize: 10, color: C.label }}>{subLabel}</p>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 7, background: C.pillBg, color: C.pillTxt, border: `1px solid ${C.pill}` }}>
            Library
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 7, background: C.primary, color: "#fff" }}>
            Upload
          </span>
        </div>
      </button>
    </div>
  );
}

// ─── Single file upload (small, inline) ──────────────────────────────────────
function FileUploadSmall({ label, accept, value, onChange, onClear }: {
  label: string; accept: string; value: string | null;
  onChange: (v: string) => void; onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => { const r = e.target?.result; if (typeof r === "string") onChange(r); };
    reader.readAsDataURL(file);
  };

  if (value) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: `${C.primary}0D`, border: `1px solid ${C.primary}33` }}>
        <Play size={14} color={C.primary} />
        <span style={{ flex: 1, fontSize: 12, color: C.text, fontWeight: 500 }}>File uploaded</span>
        <button type="button" onClick={onClear} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <X size={13} color={C.label} />
        </button>
      </div>
    );
  }

  return (
    <>
      <input ref={ref} type="file" accept={accept} style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); e.target.value = ""; }} />
      <button type="button" onClick={() => ref.current?.click()} style={{
        display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 13px",
        borderRadius: 10, border: `1.5px dashed ${C.pill}`, background: C.bg,
        cursor: "pointer", fontSize: 12, color: C.label, fontFamily: "inherit", transition: "all .15s",
      }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.primary; (e.currentTarget as HTMLElement).style.color = C.primary; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.pill; (e.currentTarget as HTMLElement).style.color = C.label; }}
      >
        <Upload size={14} />
        <span>{label}</span>
      </button>
    </>
  );
}

// ─── Video card ───────────────────────────────────────────────────────────────
function VideoCard({ video, onDelete }: {
  video: { id: string; videoUrl: string; prompt: string; modelId?: string; createdAt: string };
  onDelete: (id: string) => void;
}) {
  const [hover, setHover] = useState(false);
  const [lb, setLb] = useState(false);
  return (
    <>
      <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}`, background: "#111", position: "relative", cursor: "pointer" }}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={() => setLb(true)}>
        <div style={{ aspectRatio: "16/9", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <video src={video.videoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted loop playsInline
            onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
            onMouseLeave={(e) => (e.currentTarget as HTMLVideoElement).pause()} />
        </div>
        {hover && (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.85) 0%, transparent 50%)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 10 }}>
            <p style={{ color: "rgba(255,255,255,.8)", fontSize: 11, lineHeight: 1.4, marginBottom: 6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{video.prompt}</p>
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <a href={video.videoUrl} download={`influenceai-${video.id}.mp4`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                <Download size={13} color="#fff" />
              </a>
              <button onClick={(e) => { e.stopPropagation(); onDelete(video.id); }}
                style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(239,68,68,.25)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Trash2 size={13} color="#f87171" />
              </button>
            </div>
          </div>
        )}
      </div>
      {lb && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.95)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setLb(false)}>
          <button onClick={() => setLb(false)} style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={18} color="#fff" />
          </button>
          <video src={video.videoUrl} style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: 16 }} controls autoPlay loop onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

// ─── Progress indicator ───────────────────────────────────────────────────────
function GeneratingCard({ eta }: { eta: string }) {
  return (
    <div style={{ borderRadius: 16, border: `1px solid ${C.border}`, background: C.panel, padding: "40px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: `${C.primary}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={24} color={C.primary} className="animate-spin" />
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 4 }}>Generating your video…</p>
        <p style={{ fontSize: 12, color: C.label }}>Estimated time: {eta}</p>
      </div>
      <div style={{ width: "100%", height: 4, borderRadius: 4, background: C.border, overflow: "hidden" }}>
        <div className="vid-progress" style={{ height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${C.primary}, ${C.primaryLight})` }} />
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", textAlign: "center" }}>
      <div style={{ width: 80, height: 80, borderRadius: 24, background: `${C.primary}10`, border: `1px solid ${C.primary}20`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <Film size={32} color={C.primary} />
      </div>
      <p style={{ fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 8 }}>No videos yet</p>
      <p style={{ fontSize: 13, color: C.label, lineHeight: 1.6, maxWidth: 280 }}>
        Select a model and write your prompt to begin
      </p>
    </div>
  );
}

// ─── Generate button ──────────────────────────────────────────────────────────
function GenButton({ onClick, disabled, loading, credits, insufficient }: {
  onClick: () => void; disabled: boolean; loading: boolean; credits: number; insufficient: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{
      width: "100%", height: 52, borderRadius: 12, border: "none",
      background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
      color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "inherit",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
      boxShadow: disabled ? "none" : `0 0 20px ${C.primary}40`,
      transition: "opacity .15s",
    }}>
      {loading
        ? <><Loader2 size={16} className="animate-spin" /> Generating…</>
        : <><Sparkles size={16} /> Generate · {credits} cr</>}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GenerateVideos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"animated" | "motion">("animated");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "motion" || tab === "animated") setActiveTab(tab);
  }, []);

  // animated state
  const [modelId, setModelId] = useState(MODELS[0].id);
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(MODELS[0].durations[0].id);
  const [resolution, setResolution] = useState(MODELS[0].resolutions?.[0] ?? "");
  const [aspectRatio, setAspectRatio] = useState(MODELS[0].aspectRatios[0]);
  const [mode, setMode] = useState<"standard" | "pro">("standard");
  const [negPrompt, setNegPrompt] = useState("");
  const [refImage, setRefImage] = useState<string | null>(null);
  const [nsfwOn, setNsfwOn] = useState(false);
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [nativeAudio, setNativeAudio] = useState(false);

  // motion state
  const [motionVer, setMotionVer] = useState(MOTION_VERSIONS[0].id);
  const [motionMode, setMotionMode] = useState<"standard" | "pro">("standard");
  const [motionOrient, setMotionOrient] = useState<"image" | "video">("image");
  const [motionChar, setMotionChar] = useState<string | null>(null);
  const [motionVideo, setMotionVideo] = useState<string | null>(null);
  const [motionPrompt, setMotionPrompt] = useState("");

  // output
  const [eta, setEta] = useState("");
  const [latestUrl, setLatestUrl] = useState<string | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<"starter" | "pro" | null>(null);

  const { data: meData } = useGetMe();
  const userPlan = meData?.plan ?? "basic";
  const motionLocked = !canAccessMotion(userPlan);

  const model = MODELS.find((m) => m.id === modelId)!;
  const motionVersion = MOTION_VERSIONS.find((v) => v.id === motionVer)!;

  const animCost = (() => {
    const d = model.durations.find((x) => x.id === duration) ?? model.durations[0];
    return d.credits;
  })();
  const motionCost = motionMode === "pro" ? motionVersion.credits.pro : motionVersion.credits.standard;
  const currentCost = activeTab === "animated" ? animCost : motionCost;

  const { data: credits } = useQuery<{ creditsBalance: number }>({
    queryKey: ["credits"],
    queryFn: async () => { const r = await fetch("/api/credits"); if (!r.ok) throw new Error("Failed"); return r.json(); },
    staleTime: 10_000,
  });

  const { data: history, refetch: refetchHistory } = useQuery<any[]>({
    queryKey: ["video-history"],
    queryFn: async () => {
      const token = await getToken();
      const r = await fetch("/api/generate-video/history", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!r.ok) return [];
      return r.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      if (activeTab === "animated") {
        setEta(model.etaLabel);
        const input: Record<string, any> = {
          prompt: nsfwOn && model.hasNsfw ? `${prompt.trim()}, explicit, nsfw` : prompt.trim(),
          duration, aspect_ratio: aspectRatio,
        };
        if (model.klingMode) input.mode = model.klingMode;
        if (resolution) input.resolution = resolution;
        if (negPrompt.trim()) input.negative_prompt = negPrompt.trim();
        if (refImage && model.supportsImage) input.image = refImage;
        if (model.hasAudioUpload && audioFile) input.audio = audioFile;
        if (model.hasNativeAudio) input.native_audio = nativeAudio;
        const r = await fetch("/api/generate-video", { method: "POST", headers, body: JSON.stringify({ modelId: model.replicateId, type: "animated", input }) });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Generation failed");
        return data as { videoUrl: string; creditsUsed: number; creditsRemaining: number };
      } else {
        setEta("1–3 min");
        const input: Record<string, any> = { prompt: motionPrompt.trim(), mode: motionMode, orientation: motionOrient, image: motionChar, motion_video: motionVideo };
        const r = await fetch("/api/generate-video", { method: "POST", headers, body: JSON.stringify({ modelId: motionVersion.replicateId, type: "motion", input }) });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Generation failed");
        return data as { videoUrl: string; creditsUsed: number; creditsRemaining: number };
      }
    },
    onSuccess: (data) => {
      if (data.videoUrl) setLatestUrl(data.videoUrl);
      queryClient.invalidateQueries({ queryKey: ["credits"] });
      refetchHistory();
      toast({ title: `Video generated! (${data.creditsUsed} credits used)` });
    },
    onError: (err: Error) => toast({ title: err.message, variant: "destructive" }),
  });

  const handleModelChange = useCallback((id: string) => {
    const m = MODELS.find((x) => x.id === id)!;
    setModelId(id);
    setDuration(m.durations[0].id);
    setResolution(m.resolutions?.[0] ?? "");
    setAspectRatio(m.aspectRatios[0]);
    setMode("standard");
    setNegPrompt(""); setRefImage(null); setNsfwOn(false); setAudioFile(null); setNativeAudio(false);
    setLatestUrl(null);
  }, []);

  const handleGenerate = () => {
    if (activeTab === "animated" && !prompt.trim()) { toast({ title: "Please enter a prompt", variant: "destructive" }); return; }
    if (activeTab === "motion") {
      if (!motionChar) { toast({ title: "Character image is required", variant: "destructive" }); return; }
      if (!motionVideo) { toast({ title: "Reference video is required", variant: "destructive" }); return; }
    }
    mutation.mutate();
  };

  const isLoading = mutation.isPending;
  const insufficient = credits !== undefined && credits.creditsBalance < currentCost;
  const reversedHistory = [...(history ?? [])].reverse();

  const tabs = [
    { id: "animated", label: "Animated", icon: Clapperboard },
    { id: "motion", label: "Motion", icon: Zap },
  ] as const;

  return (
    <AuthGuard>
      <AppLayout>
        <style>{`
          @keyframes vidProgress { 0%{width:0%} 15%{width:18%} 50%{width:52%} 80%{width:78%} 100%{width:91%} }
          .vid-progress { animation: vidProgress 180s ease-out forwards; }
        `}</style>

        <div className="gen-layout" style={{ background: C.bg, fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>

          {/* ═══ LEFT PANEL ═══ */}
          <div className="gen-left-panel" style={{ borderRight: `1px solid ${C.border}`, background: C.panel }}>

            {/* Tab switcher */}
            <div style={{ padding: "14px 16px 0", flexShrink: 0 }}>
              <div style={{ display: "flex", padding: 4, borderRadius: 12, background: C.bg, border: `1px solid ${C.border}` }}>
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button key={id} type="button" onClick={() => setActiveTab(id)} style={{
                    flex: 1, height: 34, borderRadius: 9, border: "none", cursor: "pointer",
                    background: activeTab === id ? C.primary : "transparent",
                    color: activeTab === id ? "#fff" : C.label,
                    fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all .15s",
                  }}>
                    <Icon size={12} /> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable form */}
            <div className="scrollbar-none" style={{ flex: 1, overflowY: "auto", padding: "16px 16px", display: "flex", flexDirection: "column", gap: 14 }}>

              {/* ── ANIMATED ── */}
              {activeTab === "animated" && (
                <>
                  <div>
                    <SL>Model</SL>
                    <ModelDropdown modelId={modelId} onChange={handleModelChange} userPlan={userPlan} onLockedClick={(plan) => setUpgradeModal(plan)} />
                  </div>

                  <Div />

                  <div>
                    <SL>Prompt</SL>
                    <textarea rows={5} value={prompt} onChange={(e) => setPrompt(e.target.value)}
                      placeholder={`Describe your video with ${model.name}…`}
                      style={{ width: "100%", borderRadius: 10, padding: "10px 12px", background: C.bg, border: `1px solid ${C.pill}`, color: C.text, fontSize: 13, resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box", transition: "border-color .15s" }}
                      onFocus={(e) => (e.target.style.borderColor = C.primary)}
                      onBlur={(e) => (e.target.style.borderColor = C.pill)} />
                  </div>

                  {model.supportsImage && (
                    <div>
                      <SL>Reference Image <span style={{ textTransform: "none", fontWeight: 400, letterSpacing: 0 }}>(optional)</span></SL>
                      <FileUploadSmall label="Upload image for Image-to-Video" accept="image/*" value={refImage} onChange={setRefImage} onClear={() => setRefImage(null)} />
                    </div>
                  )}

                  <div>
                    <SL>Duration</SL>
                    <SelectBox
                      value={duration}
                      onChange={setDuration}
                      options={model.durations.map((d) => ({ value: d.id, label: `${d.id} seconds · ${d.credits} credits` }))}
                    />
                  </div>

                  {model.resolutions && model.resolutions.length > 1 && (
                    <div>
                      <SL>Resolution</SL>
                      <SelectBox
                        value={resolution}
                        onChange={setResolution}
                        options={model.resolutions.map((r) => ({ value: r, label: r }))}
                      />
                    </div>
                  )}

                  <div>
                    <SL>Aspect Ratio</SL>
                    <SelectBox
                      value={aspectRatio}
                      onChange={setAspectRatio}
                      options={model.aspectRatios.map((r) => ({ value: r, label: r }))}
                    />
                  </div>


                  {model.hasNativeAudio && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: C.text }}>Generate Native Audio</p>
                        <p style={{ fontSize: 11, color: C.label }}>Synchronized audio from Veo 3.1</p>
                      </div>
                      <Switch checked={nativeAudio} onCheckedChange={setNativeAudio} />
                    </div>
                  )}

                  {model.hasNsfw && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: C.text }}>Enable NSFW</p>
                      <Switch checked={nsfwOn} onCheckedChange={setNsfwOn} />
                    </div>
                  )}

                  {model.hasNegPrompt && (
                    <div>
                      <SL>Negative Prompt <span style={{ textTransform: "none", fontWeight: 400, letterSpacing: 0 }}>(optional)</span></SL>
                      <textarea rows={2} value={negPrompt} onChange={(e) => setNegPrompt(e.target.value)}
                        placeholder="What to avoid…"
                        style={{ width: "100%", borderRadius: 10, padding: "8px 12px", background: C.bg, border: `1px solid ${C.pill}`, color: C.text, fontSize: 13, resize: "none", outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border-color .15s" }}
                        onFocus={(e) => (e.target.style.borderColor = C.primary)}
                        onBlur={(e) => (e.target.style.borderColor = C.pill)} />
                    </div>
                  )}

                  {model.hasAudioUpload && (
                    <div>
                      <SL>Audio Sync <span style={{ textTransform: "none", fontWeight: 400, letterSpacing: 0 }}>(optional)</span></SL>
                      <FileUploadSmall label="Upload mp3 for audio sync" accept="audio/*" value={audioFile} onChange={setAudioFile} onClear={() => setAudioFile(null)} />
                    </div>
                  )}
                </>
              )}

              {/* ── MOTION ── */}
              {activeTab === "motion" && (
                <div style={{ position: "relative" }}>
                  {/* Lock overlay for Basic plan */}
                  {motionLocked && (
                    <div style={{
                      position: "absolute", inset: -8, zIndex: 50, borderRadius: 16,
                      background: "rgba(248,248,252,0.92)", backdropFilter: "blur(4px)",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      gap: 12, padding: 24, textAlign: "center",
                    }}>
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${C.primary}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Lock size={22} style={{ color: C.primary }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: 16, color: C.text, marginBottom: 6 }}>Motion Control Locked</p>
                        <p style={{ fontSize: 13, color: C.label, lineHeight: 1.5 }}>Motion Control is available on<br />Starter and Pro plans</p>
                      </div>
                      <a href="/plans" style={{
                        display: "inline-block", padding: "10px 24px", borderRadius: 10,
                        background: C.primary, color: "#fff", fontWeight: 700, fontSize: 13,
                        textDecoration: "none", boxShadow: `0 0 16px ${C.primary}40`,
                      }}>Upgrade Now</a>
                    </div>
                  )}
                  <>
                  {/* Version segmented control */}
                  <div>
                    <SL>Model Version</SL>
                    <div style={{ display: "flex", padding: 3, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}` }}>
                      {MOTION_VERSIONS.map((v) => (
                        <button key={v.id} type="button" onClick={() => setMotionVer(v.id)} style={{
                          flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer",
                          background: motionVer === v.id ? C.primary : "transparent",
                          color: motionVer === v.id ? "#fff" : C.label,
                          fontSize: 12, fontWeight: 600, fontFamily: "inherit", transition: "all .15s",
                        }}>
                          {v.label}
                        </button>
                      ))}
                    </div>
                    <p style={{ fontSize: 10, color: C.label, textAlign: "center", marginTop: 5, fontWeight: 500 }}>
                      {motionVersion.tag}
                    </p>
                  </div>

                  <Div />

                  {/* Two upload zones side by side */}
                  <div>
                    <SL>Upload Files</SL>
                    <div className="motion-upload-zones" style={{ display: "flex", gap: 10 }}>
                      <UploadZone
                        label="Motion Reference" subLabel="mp4 · 3–30s · max 50MB"
                        accept="video/mp4" value={motionVideo}
                        onChange={setMotionVideo} onClear={() => setMotionVideo(null)}
                        icon={Film}
                      />
                      <UploadZone
                        label="Character Image" subLabel="jpg/png · max 10MB"
                        accept="image/jpeg,image/png" value={motionChar}
                        onChange={setMotionChar} onClear={() => setMotionChar(null)}
                        icon={Upload}
                      />
                    </div>
                  </div>

                  {/* Orientation (shown when both files uploaded) */}
                  {motionChar && motionVideo && (
                    <div>
                      <SL>Character Orientation</SL>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {[
                          { id: "image", label: "Matches Image", sub: "Character faces same direction as photo · max 10s" },
                          { id: "video", label: "Matches Video", sub: "Character follows video orientation · max 30s" },
                        ].map((opt) => (
                          <button key={opt.id} type="button" onClick={() => setMotionOrient(opt.id as "image" | "video")} style={{
                            display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10,
                            border: `1.5px solid ${motionOrient === opt.id ? C.primary : C.pill}`,
                            background: motionOrient === opt.id ? C.selectedBg : C.bg,
                            cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all .15s",
                          }}>
                            <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${motionOrient === opt.id ? C.primary : C.pill}`, background: motionOrient === opt.id ? C.primary : "transparent", flexShrink: 0 }} />
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{opt.label}</p>
                              <p style={{ fontSize: 11, color: C.label }}>{opt.sub}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <SL>Quality</SL>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Pill active={motionMode === "standard"} onClick={() => setMotionMode("standard")}>Standard 720p · {motionVersion.credits.standard}cr</Pill>
                      <Pill active={motionMode === "pro"} onClick={() => setMotionMode("pro")}>Pro 1080p · {motionVersion.credits.pro}cr</Pill>
                    </div>
                  </div>

                  <div>
                    <SL>Prompt <span style={{ textTransform: "none", fontWeight: 400, letterSpacing: 0 }}>(optional)</span></SL>
                    <textarea rows={3} value={motionPrompt} onChange={(e) => setMotionPrompt(e.target.value)}
                      placeholder="Describe additional details or mood…"
                      style={{ width: "100%", borderRadius: 10, padding: "10px 12px", background: C.bg, border: `1px solid ${C.pill}`, color: C.text, fontSize: 13, resize: "none", outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border-color .15s" }}
                      onFocus={(e) => (e.target.style.borderColor = C.primary)}
                      onBlur={(e) => (e.target.style.borderColor = C.pill)} />
                  </div>

                  <div style={{ display: "flex", gap: 8, padding: "10px 12px", borderRadius: 10, background: "#FFFBEB", border: "1px solid #FCD34D" }}>
                    <AlertTriangle size={14} color={C.amber} style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 11, color: "#92400E", lineHeight: 1.5 }}>
                      Motion control does not support NSFW content. Generations will fail and credits will not be refunded.
                    </p>
                  </div>
                  </>
                </div>
              )}
            </div>

            {/* Generate footer */}
            <div className="gen-footer" style={{ padding: "14px 16px", borderTop: `1px solid ${C.border}`, background: C.panel }}>
                {credits !== undefined && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: C.label }}>Balance</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: insufficient ? C.red : C.text }}>
                      {credits.creditsBalance} credits
                    </span>
                  </div>
                )}
                <GenButton onClick={handleGenerate} disabled={isLoading || insufficient} loading={isLoading} credits={currentCost} insufficient={insufficient} />
                {insufficient && <p style={{ fontSize: 11, color: C.red, textAlign: "center", marginTop: 6 }}>Insufficient credits</p>}
              </div>
          </div>

          {/* ═══ RIGHT PANEL ═══ */}
          <div className="gen-right-panel">
            <div className="scrollbar-none" style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px", minHeight: 300 }}>

              {/* Current generation */}
              {(isLoading || latestUrl) && (
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.label, marginBottom: 12 }}>Latest</p>
                  {isLoading ? (
                    <div style={{ maxWidth: 560 }}>
                      <GeneratingCard eta={eta} />
                    </div>
                  ) : latestUrl ? (
                    <div style={{ maxWidth: 560, borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}`, background: "#000" }}>
                      <video src={latestUrl} style={{ width: "100%", display: "block" }} controls autoPlay loop />
                      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, borderTop: `1px solid ${C.border}`, background: C.panel }}>
                        <span style={{ fontSize: 12, color: C.label }}>Model: <strong style={{ color: C.text }}>{model.name}</strong></span>
                        <span style={{ fontSize: 12, color: C.label, marginLeft: "auto" }}>
                          {animCost} credits used
                        </span>
                        <a href={latestUrl} download="influenceai-video.mp4" target="_blank" rel="noreferrer"
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, background: C.primary, color: "#fff", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                          <Download size={13} /> Download
                        </a>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* History */}
              {reversedHistory.length > 0 ? (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.label, marginBottom: 12 }}>
                    History ({reversedHistory.length})
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                    {reversedHistory.map((v: any) => (
                      <VideoCard key={v.id} video={{ id: v.id, videoUrl: v.videoUrl, prompt: v.prompt ?? "", modelId: v.modelId, createdAt: v.createdAt }}
                        onDelete={async (id) => {
                          try {
                            const token = await getToken();
                            await fetch(`/api/generate-video/history/${id}`, { method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : {} });
                          } finally { refetchHistory(); }
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : !isLoading && !latestUrl ? (
                <EmptyState />
              ) : null}
            </div>
          </div>
        </div>
      </AppLayout>
      {upgradeModal && <UpgradeModal targetPlan={upgradeModal} onClose={() => setUpgradeModal(null)} />}
    </AuthGuard>
  );
}
