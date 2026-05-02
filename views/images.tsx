"use client";

import { useState, useRef, useEffect, useCallback, DragEvent, ChangeEvent } from "react";
import { AppLayout, AuthGuard } from "@/components/layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles, Download, X, Loader2, Plus, Minus, ChevronDown, Trash2, Upload, Check,
  LayoutGrid, Palette, User, Lock,
} from "lucide-react";
import { useGetInfluencers, useGetMe } from "@workspace/api-client-react";
import { canAccessModel, getPlanThatUnlocks } from "@/lib/plan-access";

// ─── Design tokens (light theme) ─────────────────────────────────────────────
const C = {
  bg: "#F8F8FC",
  panel: "#FFFFFF",
  border: "#EBEBF5",
  primary: "#7C5CFC",
  secondary: "#6D4FF0",
  textPrimary: "#0F0F1A",
  textSecondary: "#6B6B8A",
  green: "#10B981",
  red: "#EF4444",
  amber: "#F59E0B",
  blue: "#3B82F6",
  black: "#0F0F1A",
} as const;

// ─── Style presets ────────────────────────────────────────────────────────────
interface StylePreset {
  id: string; name: string; triggerWord: string;
  bg: string; textColor: string; previewUrl?: string;
}

const STYLE_PRESETS: StylePreset[] = [
  { id: "default",   name: "Default",    triggerWord: "",                   bg: "linear-gradient(135deg, #EDE9FE, #DDD6FE)", textColor: "#7C5CFC" },
  { id: "nsfw",      name: "NSFW",       triggerWord: "NSFW",               bg: "linear-gradient(135deg, #1A0A2E, #2D1B69)", textColor: "#C084FC" },
  { id: "blklght",   name: "BLKLGHT",    triggerWord: "BLKLGHT style",      bg: "linear-gradient(135deg, #08081A, #200020)", textColor: "#FF00FF" },
  { id: "r3dcma",    name: "r3dcma",     triggerWord: "r3dcma style",       bg: "linear-gradient(135deg, #140505, #2D0A0A)", textColor: "#FF4444" },
  { id: "ghibsky",   name: "GHIBSKY",    triggerWord: "GHIBSKY style",      bg: "linear-gradient(135deg, #87CEEB, #FFF3CD)", textColor: "#1D6FA4" },
  { id: "tok",       name: "TOK",        triggerWord: "TOK style",          bg: "linear-gradient(135deg, #FF6EC7, #FFE566)", textColor: "#222" },
  { id: "bstyle004", name: "B Style004", triggerWord: "B Style004 style",   bg: "linear-gradient(135deg, #061006, #0A1E0A)", textColor: "#4ADE80" },
];

// ─── Model definitions ────────────────────────────────────────────────────────
type ResolutionOption = { id: string; label: string; credits: number };
type SelectOption = { id: string; label: string };
interface ExtraOption {
  key: string; type: "toggle" | "select"; label: string;
  default: string | boolean; options?: SelectOption[];
}
interface ModelDef {
  id: string; replicateId: string; name: string; displayName: string;
  badge: string; badgeColor: string; badgeBg: string;
  description: string; creditHint: string;
  resolutions?: ResolutionOption[]; customSize?: boolean;
  aspectRatios: string[];
  maxRefImages: number; refRequired?: boolean;
  maxOutputs: number; extras: ExtraOption[]; nsfw: boolean;
}

const MODELS: ModelDef[] = [
  {
    id: "nano-banana-pro", replicateId: "google/nano-banana-pro",
    name: "Nano Banana Pro", displayName: "Nano Banana Pro (Best for SFW)", badge: "Best SFW",
    badgeColor: C.secondary, badgeBg: "rgba(124,92,252,0.15)",
    description: "Google • 18 credits • 12s",
    creditHint: "6–32 cr",
    resolutions: [{ id: "1k", label: "1K", credits: 6 }, { id: "2k", label: "2K", credits: 18 }, { id: "4k", label: "4K", credits: 32 }],
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"],
    maxRefImages: 14, maxOutputs: 4, nsfw: false,
    extras: [
      { key: "allow_fallback", type: "toggle", label: "Allow Fallback Model", default: true },
      { key: "safety_level", type: "select", label: "Safety Level", default: "normal", options: [{ id: "strict", label: "Strict" }, { id: "normal", label: "Normal" }, { id: "permissive", label: "Permissive" }] },
    ],
  },
  {
    id: "qwen-image", replicateId: "qwen/qwen-image",
    name: "Qwen Image 2.0 Pro", displayName: "Qwen Image 2.0 Pro Edit (Best for NSFW)", badge: "NSFW ✓",
    badgeColor: C.red, badgeBg: "rgba(239,68,68,0.15)",
    description: "Alibaba • 6 credits • 12s",
    creditHint: "6 cr / image",
    customSize: true,
    aspectRatios: ["1:1", "16:9", "9:16", "3:4", "4:3"],
    maxRefImages: 0, maxOutputs: 4, nsfw: true, extras: [],
  },
  {
    id: "qwen-edit", replicateId: "qwen/qwen-image-edit-plus",
    name: "Qwen Edit Plus", displayName: "Qwen Image Edit Plus (Best for NSFW)", badge: "NSFW Edit ✓",
    badgeColor: C.red, badgeBg: "rgba(239,68,68,0.15)",
    description: "Alibaba • 6 credits • 16s",
    creditHint: "6 cr flat",
    aspectRatios: ["1:1", "16:9", "9:16"],
    maxRefImages: 1, refRequired: true, maxOutputs: 1, nsfw: true, extras: [],
  },
  {
    id: "nano-banana", replicateId: "google/nano-banana",
    name: "Nano Banana", displayName: "Nano Banana", badge: "Fast & Cheap",
    badgeColor: C.green, badgeBg: "rgba(16,185,129,0.15)",
    description: "Google • 5 credits • 10s",
    creditHint: "2–10 cr",
    resolutions: [{ id: "512", label: "512px", credits: 2 }, { id: "1k", label: "1K", credits: 5 }, { id: "2k", label: "2K", credits: 10 }],
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4"],
    maxRefImages: 14, maxOutputs: 4, nsfw: false,
    extras: [
      { key: "safety_level", type: "select", label: "Safety Level", default: "normal", options: [{ id: "strict", label: "Strict" }, { id: "normal", label: "Normal" }, { id: "permissive", label: "Permissive" }] },
    ],
  },
  {
    id: "seedream-45", replicateId: "bytedance/seedream-4.5",
    name: "Seedream 4.5", displayName: "Seedream 4.5", badge: "Cinematic",
    badgeColor: C.amber, badgeBg: "rgba(245,158,11,0.15)",
    description: "ByteDance • 6 credits • 16s",
    creditHint: "6–20 cr",
    resolutions: [{ id: "1024", label: "1K", credits: 6 }, { id: "2048", label: "2K", credits: 12 }, { id: "4096", label: "4K", credits: 20 }],
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "2:1", "1:2"],
    maxRefImages: 14, maxOutputs: 4, nsfw: true,
    extras: [{ key: "enhance_prompt", type: "toggle", label: "Enhance Prompt", default: true }],
  },
  {
    id: "nano-banana-2", replicateId: "google/nano-banana-2",
    name: "Nano Banana 2", displayName: "Nano Banana 2", badge: "Fast & Smart",
    badgeColor: C.blue, badgeBg: "rgba(59,130,246,0.15)",
    description: "Google • 8–28 credits • 10s",
    creditHint: "8–28 cr",
    resolutions: [{ id: "1k", label: "1K", credits: 8 }, { id: "2k", label: "2K", credits: 16 }, { id: "4k", label: "4K", credits: 28 }],
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"],
    maxRefImages: 14, maxOutputs: 4, nsfw: false,
    extras: [
      { key: "safety_tolerance", type: "select", label: "Safety Tolerance", default: "normal", options: [{ id: "strict", label: "Strict" }, { id: "normal", label: "Normal" }, { id: "permissive", label: "Permissive" }] },
    ],
  },
  {
    id: "gpt-image-15", replicateId: "openai/gpt-image-1.5",
    name: "GPT Image 1.5", displayName: "GPT Image 1.5", badge: "OpenAI",
    badgeColor: C.black, badgeBg: "rgba(0,0,0,0.08)",
    description: "OpenAI • 12–20 credits • 30s",
    creditHint: "12–20 cr",
    aspectRatios: ["1:1", "16:9", "9:16"],
    maxRefImages: 3, maxOutputs: 4, nsfw: false,
    extras: [
      { key: "quality", type: "select", label: "Quality", default: "standard", options: [{ id: "standard", label: "Standard (12 cr)" }, { id: "hd", label: "HD (20 cr)" }] },
    ],
  },
];

function getDefaultState(model: ModelDef) {
  const extraDefaults: Record<string, string | boolean> = {};
  for (const e of model.extras) extraDefaults[e.key] = e.default;
  return {
    resolution: model.resolutions?.[model.resolutions.length > 1 ? 1 : 0]?.id ?? "1024",
    aspectRatio: model.aspectRatios[0],
    numOutputs: 1, nsfwEnabled: false,
    customWidth: 1024, customHeight: 1024,
    extras: extraDefaults,
  };
}

function getCreditCost(model: ModelDef, resolution: string, numOutputs: number, extras?: Record<string, string | boolean>): number {
  if (model.id === "gpt-image-15") {
    const quality = (extras?.quality as string) ?? "standard";
    return (quality === "hd" ? 20 : 12) * numOutputs;
  }
  if (model.resolutions) {
    const res = model.resolutions.find((r) => r.id === resolution);
    return (res?.credits ?? model.resolutions[0].credits) * numOutputs;
  }
  if (model.replicateId === "qwen/qwen-image") return 6 * numOutputs;
  if (model.replicateId === "qwen/qwen-image-edit-plus") return 6;
  return 6 * numOutputs;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ color: C.textSecondary, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>
      {children}
    </p>
  );
}

function Divider() {
  return <div style={{ height: 1, background: C.border, margin: "4px 0" }} />;
}

function ActivePill({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button" onClick={onClick}
      style={{
        padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
        border: `1px solid ${active ? C.primary : C.border}`,
        background: active ? `linear-gradient(135deg, ${C.primary}33, ${C.secondary}22)` : "transparent",
        color: active ? C.secondary : C.textSecondary,
        cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap",
        boxShadow: active ? `0 0 10px ${C.primary}40` : "none",
      }}
    >
      {children}
    </button>
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
    <div
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
      className="text-left text-[8px]">
      {ratios.map((r) => {
        const active = value === r;
        const { w, h } = aspectIcon(r);
        return (
          <button key={r} type="button" onClick={() => onChange(r)} style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "12px 8px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
            border: `1.5px solid ${active ? C.primary : C.border}`,
            background: active ? `${C.primary}10` : C.panel,
            transition: "all .15s", gap: 8,
          }}>
            <div style={{ width: 40, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{
                width: w, height: h, borderRadius: 3,
                border: `2px solid ${active ? C.primary : C.textSecondary}`,
                background: active ? `${C.primary}18` : "transparent",
              }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: active ? C.primary : C.textSecondary }}>{r}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Upgrade Modal ────────────────────────────────────────────────────────────
function UpgradeModal({ onClose, targetPlan }: { onClose: () => void; targetPlan: "starter" | "pro" }) {
  const planLabels: Record<string, { name: string; price: string; benefits: string[] }> = {
    starter: {
      name: "Starter", price: "$24/mo",
      benefits: ["3 AI influencers", "6 image models incl. GPT Image 1.5 & Nano Banana 2", "5 video models incl. Veo 3.1 & Sora 2", "NSFW content enabled", "Full motion control access"],
    },
    pro: {
      name: "Pro", price: "$68/mo",
      benefits: ["Unlimited influencers", "All models including Nano Banana Pro", "All video models including Sora 2 Pro", "Kling V3.0 Pro access", "Priority support"],
    },
  };
  const plan = planLabels[targetPlan];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 32, maxWidth: 400, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${C.primary}12`, padding: "4px 10px", borderRadius: 999, marginBottom: 10 }}>
              <Lock size={12} style={{ color: C.primary }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: C.primary }}>UPGRADE REQUIRED</span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.textPrimary }}>Unlock This Feature</h2>
            <p style={{ fontSize: 14, color: C.textSecondary, marginTop: 4 }}>Available on <strong>{plan.name}</strong> — {plan.price}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><X size={18} style={{ color: C.textSecondary }} /></button>
        </div>
        <div style={{ marginBottom: 24 }}>
          {plan.benefits.map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: `${C.primary}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <Check size={11} style={{ color: C.primary }} />
              </div>
              <span style={{ fontSize: 14, color: C.textPrimary, lineHeight: 1.4 }}>{b}</span>
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
function ModelDropdown({ selectedId, onChange, userPlan, onLockedClick }: {
  selectedId: string; onChange: (id: string) => void;
  userPlan: string; onLockedClick: (targetPlan: "starter" | "pro") => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const model = MODELS.find((m) => m.id === selectedId)!;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button" onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px", borderRadius: 12, cursor: "pointer",
          border: `1px solid ${open ? C.primary : C.border}`,
          background: C.panel, transition: "all .15s",
        }}
      >
        <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{model.displayName}</p>
          <p style={{ fontSize: 12, color: C.textSecondary, marginTop: 2, lineHeight: 1.4 }}>{model.description}</p>
        </div>
        <ChevronDown size={15} style={{ color: C.textSecondary, flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </button>

      {open && (
        <div className="model-dropdown-panel" style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 100,
          background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14,
          overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,0.08)",
        }}>
          {MODELS.map((m) => {
            const locked = !canAccessModel(userPlan, m.replicateId, "image");
            const targetPlan = locked ? getPlanThatUnlocks(m.replicateId, "image") : null;
            return (
              <button
                key={m.id} type="button"
                onClick={() => {
                  if (locked) { setOpen(false); onLockedClick(targetPlan!); return; }
                  onChange(m.id); setOpen(false);
                }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 14px", cursor: "pointer", textAlign: "left",
                  background: locked ? "#FAFAFA" : selectedId === m.id ? `${C.primary}12` : "transparent",
                  borderLeft: `3px solid ${selectedId === m.id && !locked ? C.primary : "transparent"}`,
                  opacity: locked ? 0.72 : 1,
                  transition: "background .12s",
                }}
                onMouseEnter={(e) => { if (selectedId !== m.id && !locked) (e.currentTarget as HTMLButtonElement).style.background = "#F4F4FB"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = locked ? "#FAFAFA" : selectedId === m.id ? `${C.primary}12` : "transparent"; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <p style={{ color: locked ? C.textSecondary : C.textPrimary, fontWeight: 700, fontSize: 13 }}>{m.displayName}</p>
                    {locked && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, color: "#fff", background: "#9CA3AF", padding: "1px 6px", borderRadius: 999 }}>
                        <Lock size={8} />LOCKED
                      </span>
                    )}
                  </div>
                  <p style={{ color: C.textSecondary, fontSize: 12, lineHeight: 1.4 }}>{locked ? `Upgrade to ${targetPlan} to unlock` : m.description}</p>
                </div>
                {!locked && selectedId === m.id && <Check size={14} style={{ color: C.primary, flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── File Upload Dropzone ─────────────────────────────────────────────────────
function RefImageDropzone({
  images, maxImages, required, onChange,
}: { images: string[]; maxImages: number; required?: boolean; onChange: (imgs: string[]) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = maxImages - images.length;
    const toRead = Array.from(files).slice(0, remaining);
    toRead.forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) onChange([...images, dataUrl]);
      };
      reader.readAsDataURL(file);
    });
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false);
    readFiles(e.dataTransfer.files);
  };

  const canAdd = images.length < maxImages;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <SectionLabel>
          Reference Image{maxImages > 1 ? "s" : ""}
        </SectionLabel>
        {required && <span style={{ color: C.red, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>*</span>}
        {!required && <span style={{ color: C.textSecondary, fontSize: 11, marginBottom: 8 }}>(optional)</span>}
      </div>

      {/* Thumbnails */}
      {images.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {images.map((src, i) => (
            <div key={i} style={{ position: "relative", width: 64, height: 64 }}>
              <img src={src} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", border: `1px solid ${C.border}` }} />
              <button
                type="button"
                onClick={() => onChange(images.filter((_, j) => j !== i))}
                style={{
                  position: "absolute", top: -5, right: -5, width: 18, height: 18, borderRadius: "50%",
                  background: C.red, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <X size={10} style={{ color: "#fff" }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      {canAdd && (
        <>
          <input ref={inputRef} type="file" accept="image/*" multiple={maxImages > 1} style={{ display: "none" }}
            onChange={(e: ChangeEvent<HTMLInputElement>) => readFiles(e.target.files)} />
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? C.primary : C.border}`,
              borderRadius: 12, padding: "18px 12px", textAlign: "center",
              cursor: "pointer", transition: "all .15s",
              background: dragging ? `${C.primary}0A` : "transparent",
            }}
          >
            <Upload size={18} style={{ color: dragging ? C.primary : C.textSecondary, margin: "0 auto 6px" }} />
            <p style={{ color: dragging ? C.secondary : C.textSecondary, fontSize: 12, fontWeight: 500 }}>
              {dragging ? "Drop to add" : "Drag & drop or click to upload"}
            </p>
            <p style={{ color: C.textSecondary, fontSize: 11, marginTop: 2 }}>
              {maxImages === 1 ? "1 image max" : `Up to ${maxImages} images`}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Generated Image Card ─────────────────────────────────────────────────────
function GeneratedImage({ url, onDelete }: { url: string; onDelete?: () => void }) {
  const [lightbox, setLightbox] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = url; a.download = `influenceai-${Date.now()}.png`; a.target = "_blank"; a.click();
  };

  return (
    <>
      <div
        className="group"
        style={{ position: "relative", borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}`, cursor: "zoom-in", background: "#111" }}
        onClick={() => setLightbox(true)}
      >
        <img src={url} alt="Generated" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }} loading="lazy" />
        <div className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.75) 0%, transparent 50%)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 10 }}>
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <button onClick={handleDownload} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,.2)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Download size={14} style={{ color: "#fff" }} />
            </button>
            {onDelete && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(239,68,68,.2)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Trash2 size={14} style={{ color: C.red }} />
              </button>
            )}
          </div>
        </div>
      </div>

      {lightbox && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.95)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setLightbox(false)}>
          <button onClick={() => setLightbox(false)} style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={18} style={{ color: "#fff" }} />
          </button>
          <img src={url} alt="Generated" style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: 16, objectFit: "contain" }} onClick={(e) => e.stopPropagation()} />
          <button onClick={handleDownload} style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 10, background: "rgba(255,255,255,.12)", border: "none", cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: 600 }}>
            <Download size={15} /> Download
          </button>
        </div>
      )}
    </>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 340, textAlign: "center" }}>
      <Sparkles size={48} strokeWidth={1.2} style={{ color: "#D0D0E0", marginBottom: 18 }} />
      <p style={{ color: C.textPrimary, fontSize: 17, fontWeight: 700, marginBottom: 6 }}>No images generated yet</p>
      <p style={{ color: C.textSecondary, fontSize: 13 }}>Use the controls below to generate your first AI image</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GenerateImages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedModelId, setSelectedModelId] = useState(MODELS[0].id);
  const [prompt, setPrompt] = useState("");
  const [state, setState] = useState(() => getDefaultState(MODELS[0]));
  const [refImages, setRefImages] = useState<string[]>([]);
  const [sessionImages, setSessionImages] = useState<string[]>([]);
  const [showInfluencerPicker, setShowInfluencerPicker] = useState(false);
  const [selectedStyleId, setSelectedStyleId] = useState("default");
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState<"starter" | "pro" | null>(null);

  const { data: influencers } = useGetInfluencers();
  const { data: meData } = useGetMe();
  const userPlan = meData?.plan ?? "basic";
  const selectedStyle = STYLE_PRESETS.find((s) => s.id === selectedStyleId) ?? STYLE_PRESETS[0];

  const model = MODELS.find((m) => m.id === selectedModelId)!;
  const creditCost = getCreditCost(model, state.resolution, state.numOutputs, state.extras);

  const { data: credits } = useQuery<{ creditsBalance: number }>({
    queryKey: ["credits"],
    queryFn: async () => {
      const r = await fetch("/api/credits");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    staleTime: 10_000,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const inputPayload: Record<string, unknown> = {
        prompt: (() => {
          const base = prompt.trim();
          const styleSuffix = selectedStyle.triggerWord ? `, ${selectedStyle.triggerWord}` : "";
          return model.nsfw && state.nsfwEnabled ? `${base}, explicit, NSFW${styleSuffix}` : `${base}${styleSuffix}`;
        })(),
        num_outputs: state.numOutputs,
      };
      if (model.id === "gpt-image-15") {
        const sizeMap: Record<string, string> = { "1:1": "1024x1024", "16:9": "1536x1024", "9:16": "1024x1536" };
        inputPayload.size = sizeMap[state.aspectRatio] ?? "1024x1024";
      } else if (model.customSize) {
        inputPayload.width = state.customWidth;
        inputPayload.height = state.customHeight;
        inputPayload.aspect_ratio = state.aspectRatio;
      } else if (model.resolutions) {
        inputPayload.resolution = state.resolution;
        inputPayload.aspect_ratio = state.aspectRatio;
      } else {
        inputPayload.aspect_ratio = state.aspectRatio;
      }
      if (model.maxRefImages > 0 && refImages.length > 0) {
        if (model.refRequired || model.maxRefImages === 1) inputPayload.image_input = refImages[0];
        else inputPayload.image_urls = refImages.slice(0, model.maxRefImages);
      }
      for (const [k, v] of Object.entries(state.extras)) inputPayload[k] = v;

      const r = await fetch("/api/generate-image", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: model.replicateId, input: inputPayload }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Generation failed");
      return data as { images: string[]; creditsUsed: number; creditsRemaining: number };
    },
    onSuccess: (data) => {
      setSessionImages((prev) => [...data.images, ...prev]);
      queryClient.invalidateQueries({ queryKey: ["credits"] });
      toast({ title: `${data.images.length} image${data.images.length !== 1 ? "s" : ""} generated! (${data.creditsUsed} credits)` });
    },
    onError: (err: Error) => toast({ title: err.message, variant: "destructive" }),
  });

  const handleModelChange = useCallback((id: string) => {
    const m = MODELS.find((m) => m.id === id)!;
    setSelectedModelId(id);
    setState(getDefaultState(m));
    setRefImages([]);
  }, []);

  const handleGenerate = () => {
    if (!prompt.trim()) { toast({ title: "Please enter a prompt", variant: "destructive" }); return; }
    if (model.refRequired && refImages.length === 0) { toast({ title: "This model requires a reference image", variant: "destructive" }); return; }
    generateMutation.mutate();
  };

  const patchExtras = (key: string, val: string | boolean) =>
    setState((s) => ({ ...s, extras: { ...s.extras, [key]: val } }));

  const isGenerating = generateMutation.isPending;
  const hasImages = sessionImages.length > 0;
  const insufficient = credits !== undefined && credits.creditsBalance < creditCost;

  const uploadRef = useRef<HTMLInputElement>(null);
  const [showAspectPopup, setShowAspectPopup] = useState(false);
  const aspectPopupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showAspectPopup) return;
    const handler = (e: MouseEvent) => {
      if (aspectPopupRef.current && !aspectPopupRef.current.contains(e.target as Node)) setShowAspectPopup(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showAspectPopup]);

  const handleRefUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) setRefImages([dataUrl]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const { w: arW, h: arH } = aspectIcon(state.aspectRatio);

  return (
    <AuthGuard>
      <AppLayout>
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg, fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>

          {/* ── Gallery ── */}
          <div className="scrollbar-none" style={{ flex: 1, overflowY: "auto", padding: "32px 32px 0", display: "flex", flexDirection: "column" }}>
            {!hasImages && !isGenerating ? (
              <EmptyState />
            ) : (
              <>
                {hasImages && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                    <button type="button" onClick={() => setSessionImages([])}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 7, background: "transparent", border: `1px solid ${C.border}`, cursor: "pointer", color: C.textSecondary, fontSize: 12, fontFamily: "inherit" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = C.red)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = C.textSecondary)}
                    >
                      <Trash2 size={12} /> Clear all
                    </button>
                  </div>
                )}
                <div style={{
                  display: "grid", gap: 12,
                  gridTemplateColumns: (sessionImages.length + (isGenerating ? state.numOutputs : 0)) === 1
                    ? "minmax(0, 480px)"
                    : "repeat(auto-fill, minmax(220px, 1fr))",
                }}>
                  {isGenerating && Array.from({ length: state.numOutputs }).map((_, i) => (
                    <div key={`sk-${i}`} style={{ borderRadius: 14, background: "#111", border: `1px solid ${C.border}`, aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Loader2 size={24} style={{ color: C.textSecondary }} className="animate-spin" />
                    </div>
                  ))}
                  {sessionImages.map((url, i) => (
                    <GeneratedImage key={`${url}-${i}`} url={url} onDelete={() => setSessionImages((prev) => prev.filter((_, j) => j !== i))} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Bottom toolbar ── */}
          <div style={{ padding: "12px 24px 20px", flexShrink: 0 }}>
            <div style={{
              background: C.panel, borderRadius: 20,
              boxShadow: "0 4px 32px rgba(0,0,0,0.07)",
              border: `1px solid ${C.border}`,
              padding: "14px 16px 12px",
            }}>

              {/* Prompt textarea */}
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your image or paste an image to edit…"
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                rows={2}
                style={{
                  width: "100%", borderRadius: 10, padding: "8px 4px",
                  background: "transparent", border: "none",
                  color: C.textPrimary, fontSize: 14, lineHeight: 1.6,
                  resize: "none", outline: "none", fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />

              {/* Divider */}
              <div style={{ height: 1, background: C.border, margin: "8px 0" }} />

              {/* Controls row */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

                {/* Left: selectors + pills */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>

                  {/* Row 1: Model + Resolution dropdowns */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {/* Model dropdown with lock support */}
                    <div style={{ minWidth: 220 }}>
                      <ModelDropdown
                        selectedId={selectedModelId}
                        onChange={handleModelChange}
                        userPlan={userPlan}
                        onLockedClick={(plan) => setUpgradeModal(plan)}
                      />
                    </div>

                    {/* Resolution compact select */}
                    {model.resolutions && (
                      <div style={{ position: "relative" }}>
                        <select
                          value={state.resolution}
                          onChange={(e) => setState((s) => ({ ...s, resolution: e.target.value }))}
                          style={{
                            appearance: "none", padding: "6px 28px 6px 10px", borderRadius: 8,
                            border: `1px solid ${C.border}`, background: C.panel,
                            color: C.textPrimary, fontSize: 12, fontWeight: 600,
                            fontFamily: "inherit", cursor: "pointer", outline: "none",
                          }}
                          onFocus={(e) => (e.target.style.borderColor = C.primary)}
                          onBlur={(e) => (e.target.style.borderColor = C.border)}
                        >
                          {model.resolutions.map((r) => <option key={r.id} value={r.id}>{r.label} Resolution · {r.credits} credits</option>)}
                        </select>
                        <ChevronDown size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: C.textSecondary, pointerEvents: "none" }} />
                      </div>
                    )}
                  </div>

                  {/* Row 2: Library, Upload, Aspect ratio, Count */}
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>

                    {/* Library btn */}
                    {model.maxRefImages > 0 && refImages.length > 0 && (
                      <button type="button" onClick={() => setRefImages([])}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, border: `1.5px dashed ${C.border}`, background: "transparent", color: C.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                        <X size={12} /> Clear ref
                      </button>
                    )}
                    {model.maxRefImages > 0 && (
                      <>
                        <input ref={uploadRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleRefUpload} />
                        <button type="button" onClick={() => uploadRef.current?.click()}
                          style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, border: `1.5px dashed ${C.border}`, background: "transparent", color: C.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                          <LayoutGrid size={12} /> Library
                        </button>
                        <button type="button" onClick={() => uploadRef.current?.click()}
                          style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, border: `1.5px dashed ${C.border}`, background: "transparent", color: C.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                          <Upload size={12} /> Upload
                        </button>
                      </>
                    )}

                    {/* Aspect ratio pill button + popup */}
                    <div ref={aspectPopupRef} style={{ position: "relative" }}>
                      <button type="button" onClick={() => setShowAspectPopup((v) => !v)}
                        style={{
                          display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8,
                          border: `1.5px solid ${showAspectPopup ? C.primary : C.border}`,
                          background: showAspectPopup ? `${C.primary}08` : "transparent",
                          color: C.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                        }}>
                        <div style={{ width: arW * 0.55, height: arH * 0.55, borderRadius: 2, border: `1.5px solid ${C.textSecondary}`, flexShrink: 0 }} />
                        {state.aspectRatio}
                      </button>
                      {showAspectPopup && (
                        <div style={{
                          position: "absolute", bottom: "calc(100% + 8px)", left: 0, zIndex: 200,
                          background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14,
                          boxShadow: "0 8px 32px rgba(0,0,0,0.10)", padding: 10, width: 220,
                        }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Aspect Ratio</p>
                          <AspectRatioPicker
                            ratios={model.aspectRatios}
                            value={state.aspectRatio}
                            onChange={(r) => { setState((s) => ({ ...s, aspectRatio: r })); setShowAspectPopup(false); }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Count stepper */}
                    {model.maxOutputs > 1 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button type="button" disabled={state.numOutputs <= 1}
                          onClick={() => setState((s) => ({ ...s, numOutputs: Math.max(1, s.numOutputs - 1) }))}
                          style={{ width: 26, height: 26, borderRadius: 7, background: C.bg, border: `1px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: state.numOutputs <= 1 ? 0.4 : 1 }}>
                          <Minus size={11} style={{ color: C.textPrimary }} />
                        </button>
                        <span style={{ color: C.textPrimary, fontWeight: 700, fontSize: 13, minWidth: 28, textAlign: "center" }}>{state.numOutputs}/{model.maxOutputs}</span>
                        <button type="button" disabled={state.numOutputs >= model.maxOutputs}
                          onClick={() => setState((s) => ({ ...s, numOutputs: Math.min(model.maxOutputs, s.numOutputs + 1) }))}
                          style={{ width: 26, height: 26, borderRadius: 7, background: C.bg, border: `1px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: state.numOutputs >= model.maxOutputs ? 0.4 : 1 }}>
                          <Plus size={11} style={{ color: C.textPrimary }} />
                        </button>
                      </div>
                    )}

                    {/* NSFW toggle */}
                    {model.nsfw && (
                      <button type="button" onClick={() => setState((s) => ({ ...s, nsfwEnabled: !s.nsfwEnabled }))}
                        style={{
                          padding: "5px 10px", borderRadius: 8, border: `1.5px solid ${state.nsfwEnabled ? C.red : C.border}`,
                          background: state.nsfwEnabled ? "rgba(239,68,68,.08)" : "transparent",
                          color: state.nsfwEnabled ? C.red : C.textSecondary, fontSize: 12, fontWeight: 700,
                          cursor: "pointer", fontFamily: "inherit",
                        }}>
                        NSFW {state.nsfwEnabled ? "ON" : "OFF"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Right: Influencer thumb + Choose Style + Generate */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>

                  {/* Influencer / ref image thumb */}
                  {model.maxRefImages > 0 && (
                    <div style={{ textAlign: "center" }}>
                      <button type="button" onClick={() => setShowInfluencerPicker(true)}
                        style={{
                          width: 72, height: 72, borderRadius: 12, overflow: "hidden",
                          border: `1.5px dashed ${refImages[0] ? C.primary : C.border}`,
                          background: C.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          position: "relative",
                        }}>
                        {refImages[0] ? (
                          <img src={refImages[0]} alt="ref" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <User size={20} style={{ color: C.textSecondary }} />
                        )}
                        {refImages[0] && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); setRefImages([]); }}
                            style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, borderRadius: "50%", background: C.red, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <X size={9} style={{ color: "#fff" }} />
                          </button>
                        )}
                      </button>
                      <p style={{ fontSize: 9, fontWeight: 700, color: C.textSecondary, marginTop: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>Influencer</p>
                    </div>
                  )}

                  {/* Choose Style */}
                  <div style={{ textAlign: "center" }}>
                    <button type="button" onClick={() => setShowStylePicker(true)}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0,
                        width: 72, height: 72, borderRadius: 12, border: `1.5px solid ${selectedStyleId !== "default" ? C.primary : C.border}`,
                        background: selectedStyle.bg, cursor: "pointer", fontFamily: "inherit", overflow: "hidden", position: "relative",
                      }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: selectedStyle.textColor, letterSpacing: "0.04em", textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>{selectedStyle.name}</span>
                    </button>
                    <p style={{ fontSize: 9, fontWeight: 700, color: C.textSecondary, marginTop: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>Style</p>
                  </div>

                  {/* Generate button */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    {credits !== undefined && (
                      <span style={{ fontSize: 11, color: insufficient ? C.red : C.textSecondary }}>
                        {credits.creditsBalance} cr left
                      </span>
                    )}
                    <button
                      type="button" onClick={handleGenerate}
                      disabled={isGenerating || !prompt.trim() || (model.refRequired && refImages.length === 0) || insufficient}
                      style={{
                        height: 46, padding: "0 24px", borderRadius: 12, border: "none",
                        cursor: isGenerating ? "wait" : "pointer",
                        background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                        color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "inherit",
                        display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
                        opacity: (isGenerating || !prompt.trim() || (model.refRequired && refImages.length === 0) || insufficient) ? 0.5 : 1,
                        transition: "opacity .15s",
                        boxShadow: isGenerating ? "none" : `0 0 20px ${C.primary}40`,
                      }}
                    >
                      {isGenerating ? (
                        <><Loader2 size={16} className="animate-spin" /> Generating…</>
                      ) : (
                        <><Sparkles size={16} /> Generate</>
                      )}
                    </button>
                    {insufficient && (
                      <span style={{ fontSize: 11, color: C.red }}>Insufficient credits</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </AppLayout>

      {/* ─── Style Picker Modal ──────────────────────────────────────────── */}
      {showStylePicker && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setShowStylePicker(false)}
        >
          <div
            style={{ background: C.panel, borderRadius: 20, width: "100%", maxWidth: 480, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 14px", borderBottom: `1px solid ${C.border}` }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 16, color: C.textPrimary }}>Choose Style</p>
                <p style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>Select a visual style to apply to your generation</p>
              </div>
              <button type="button" onClick={() => setShowStylePicker(false)}
                style={{ width: 32, height: 32, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={15} style={{ color: C.textSecondary }} />
              </button>
            </div>

            {/* Body */}
            <div style={{ overflowY: "auto", padding: 16, flex: 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {STYLE_PRESETS.map((style) => {
                  const isSelected = selectedStyleId === style.id;
                  return (
                    <button
                      key={style.id} type="button"
                      onClick={() => { setSelectedStyleId(style.id); setShowStylePicker(false); }}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        height: 110, borderRadius: 14, cursor: "pointer",
                        border: `2.5px solid ${isSelected ? C.primary : "transparent"}`,
                        background: style.bg, position: "relative", overflow: "hidden",
                        boxShadow: isSelected ? `0 0 0 1px ${C.primary}` : "0 2px 8px rgba(0,0,0,0.12)",
                        transition: "all .15s", fontFamily: "inherit",
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 800, color: style.textColor, letterSpacing: "0.05em", textShadow: "0 1px 4px rgba(0,0,0,0.4)", textAlign: "center", padding: "0 8px" }}>
                        {style.name}
                      </span>
                      {isSelected && (
                        <div style={{ position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: "50%", background: C.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Check size={11} style={{ color: "#fff" }} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowStylePicker(false)}
                style={{ padding: "8px 20px", borderRadius: 10, background: C.primary, color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Influencer Picker Modal ─────────────────────────────────────── */}
      {showInfluencerPicker && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setShowInfluencerPicker(false)}
        >
          <div
            style={{ background: C.panel, borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 14px", borderBottom: `1px solid ${C.border}` }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 16, color: C.textPrimary }}>Select Influencer</p>
                <p style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>Choose a profile to use as reference</p>
              </div>
              <button type="button" onClick={() => setShowInfluencerPicker(false)}
                style={{ width: 32, height: 32, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={15} style={{ color: C.textSecondary }} />
              </button>
            </div>

            {/* Body */}
            <div style={{ overflowY: "auto", padding: 16, flex: 1 }}>
              {!influencers || influencers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 16px" }}>
                  <User size={40} strokeWidth={1.2} style={{ color: "#D0D0E0", margin: "0 auto 12px" }} />
                  <p style={{ fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>No influencers yet</p>
                  <p style={{ fontSize: 13, color: C.textSecondary }}>Create an influencer profile first, then come back to select one here.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 }}>
                  {influencers.map((inf) => {
                    const isSelected = refImages[0] === inf.avatarUrl;
                    return (
                      <button
                        key={inf.id} type="button"
                        onClick={() => {
                          if (inf.avatarUrl) {
                            setRefImages([inf.avatarUrl]);
                            setShowInfluencerPicker(false);
                          }
                        }}
                        disabled={!inf.avatarUrl}
                        style={{
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                          padding: 10, borderRadius: 14, cursor: inf.avatarUrl ? "pointer" : "default",
                          border: `2px solid ${isSelected ? C.primary : C.border}`,
                          background: isSelected ? `${C.primary}10` : C.bg,
                          transition: "all .15s", opacity: inf.avatarUrl ? 1 : 0.5,
                          fontFamily: "inherit",
                        }}
                        onMouseEnter={(e) => { if (inf.avatarUrl && !isSelected) (e.currentTarget as HTMLButtonElement).style.borderColor = C.primary; }}
                        onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; }}
                      >
                        <div style={{ width: 80, height: 80, borderRadius: 12, overflow: "hidden", background: C.border, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {inf.avatarUrl ? (
                            <img src={inf.avatarUrl} alt={inf.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <User size={28} style={{ color: C.textSecondary }} />
                          )}
                        </div>
                        <div style={{ textAlign: "center", width: "100%" }}>
                          <p style={{ fontWeight: 700, fontSize: 12, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inf.name}</p>
                          {!inf.avatarUrl && (
                            <p style={{ fontSize: 10, color: C.textSecondary, marginTop: 2 }}>No avatar</p>
                          )}
                          {isSelected && (
                            <p style={{ fontSize: 10, color: C.primary, fontWeight: 700, marginTop: 2 }}>Selected</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button type="button" onClick={() => { setRefImages([]); setShowInfluencerPicker(false); }}
                style={{ fontSize: 13, color: C.textSecondary, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                Clear selection
              </button>
              <button type="button" onClick={() => setShowInfluencerPicker(false)}
                style={{ padding: "8px 20px", borderRadius: 10, background: C.primary, color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {upgradeModal && <UpgradeModal targetPlan={upgradeModal} onClose={() => setUpgradeModal(null)} />}
    </AuthGuard>
  );
}
