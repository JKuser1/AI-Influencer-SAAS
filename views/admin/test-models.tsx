"use client";

import { useState, useEffect } from "react";
import { AppLayout, AuthGuard } from "@/components/layout";
import { Loader2, CheckCircle2, XCircle, Circle, Play, RefreshCw, ShieldCheck, ShieldX } from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#F8F8FC",
  panel: "#FFFFFF",
  border: "#EBEBF5",
  primary: "#7C5CFC",
  text: "#0F0F1A",
  label: "#6B6B8A",
  green: "#10B981",
  red: "#EF4444",
  pending: "#9090B0",
};

// ─── Model registry ───────────────────────────────────────────────────────────
type Category = "Image" | "Video" | "Motion Control";
interface ModelEntry { name: string; replicateId: string; category: Category }

const MODELS: ModelEntry[] = [
  { name: "Nano Banana Pro", replicateId: "google/nano-banana-pro", category: "Image" },
  { name: "Nano Banana", replicateId: "google/nano-banana", category: "Image" },
  { name: "Seedream 4.5", replicateId: "bytedance/seedream-4.5", category: "Image" },
  { name: "Qwen Image 2.0 Pro", replicateId: "qwen/qwen-image", category: "Image" },
  { name: "Qwen Image Edit Plus", replicateId: "qwen/qwen-image-edit-plus", category: "Image" },
  { name: "Kling V3.0 Pro", replicateId: "kwaivgi/kling-v3-video", category: "Video" },
  { name: "Kling V3.0", replicateId: "kwaivgi/kling-v3-video", category: "Video" },
  { name: "Wan 2.6", replicateId: "wan-video/wan-2.6-i2v", category: "Video" },
  { name: "Wan 2.2", replicateId: "wan-video/wan-2.2-i2v-fast", category: "Video" },
  { name: "Veo 3.1", replicateId: "google/veo-3.1", category: "Video" },
  { name: "Sora 2", replicateId: "openai/sora-2", category: "Video" },
  { name: "Kling 3.0 Motion", replicateId: "kwaivgi/kling-v3-motion-control", category: "Motion Control" },
  { name: "Kling 2.6 Motion", replicateId: "kwaivgi/kling-v2.6-motion-control", category: "Motion Control" },
];

type Status = "pending" | "testing" | "success" | "failed";

interface TestResult {
  status: Status;
  responseTime?: number;
  error?: string;
}

// ─── Status dot ───────────────────────────────────────────────────────────────
function StatusDot({ status }: { status: Status }) {
  if (status === "pending") return <Circle size={16} style={{ color: C.pending, flexShrink: 0 }} />;
  if (status === "testing") return <Loader2 size={16} style={{ color: C.primary, flexShrink: 0 }} className="animate-spin" />;
  if (status === "success") return <CheckCircle2 size={16} style={{ color: C.green, flexShrink: 0 }} />;
  return <XCircle size={16} style={{ color: C.red, flexShrink: 0 }} />;
}

// ─── Category badge ───────────────────────────────────────────────────────────
const CAT_COLORS: Record<Category, { bg: string; color: string }> = {
  "Image": { bg: "rgba(124,92,252,0.12)", color: C.primary },
  "Video": { bg: "rgba(16,185,129,0.12)", color: C.green },
  "Motion Control": { bg: "rgba(245,158,11,0.12)", color: "#F59E0B" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function runTest(replicateId: string): Promise<TestResult> {
  const r = await fetch(`/api/admin/test-model?modelId=${encodeURIComponent(replicateId)}`);
  const data = await r.json();
  return {
    status: data.status,
    responseTime: data.responseTime,
    error: data.error,
  };
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminTestModels() {
  const [results, setResults] = useState<Record<string, TestResult>>(() =>
    Object.fromEntries(MODELS.map((m) => [m.replicateId, { status: "pending" as Status }]))
  );
  const [runningAll, setRunningAll] = useState(false);
  const [tokenFound, setTokenFound] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/token-status")
      .then((r) => r.json())
      .then((d) => setTokenFound(d.found))
      .catch(() => setTokenFound(false));
  }, []);

  const patchResult = (id: string, patch: Partial<TestResult>) =>
    setResults((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const testOne = async (replicateId: string) => {
    patchResult(replicateId, { status: "testing", error: undefined, responseTime: undefined });
    const result = await runTest(replicateId);
    patchResult(replicateId, result);
  };

  const runAll = async () => {
    setRunningAll(true);
    setResults(Object.fromEntries(MODELS.map((m) => [m.replicateId, { status: "pending" as Status }])));
    for (const model of MODELS) {
      await testOne(model.replicateId);
    }
    setRunningAll(false);
  };

  const successCount = Object.values(results).filter((r) => r.status === "success").length;
  const failedCount = Object.values(results).filter((r) => r.status === "failed").length;
  const totalTested = successCount + failedCount;

  const categories: Category[] = ["Image", "Video", "Motion Control"];

  return (
    <AuthGuard>
      <AppLayout>
        <div style={{ minHeight: "100%", background: C.bg, fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', padding: "32px 24px" }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>

            {/* Header */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 4 }}>Model Connection Test</h1>
                  <p style={{ fontSize: 14, color: C.label }}>Verify all AI models are correctly connected to Replicate</p>
                </div>
                <button
                  type="button"
                  onClick={runAll}
                  disabled={runningAll}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
                    borderRadius: 10, border: "none", cursor: runningAll ? "wait" : "pointer",
                    background: `linear-gradient(135deg, ${C.primary}, #6D4FF0)`,
                    color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "inherit",
                    opacity: runningAll ? 0.7 : 1, transition: "opacity .15s",
                    boxShadow: `0 0 18px ${C.primary}40`,
                  }}
                >
                  {runningAll
                    ? <><Loader2 size={15} className="animate-spin" /> Testing…</>
                    : <><Play size={15} /> Run All Tests</>
                  }
                </button>
              </div>

              {/* Summary bar */}
              <div style={{
                marginTop: 16, padding: "12px 16px", borderRadius: 12,
                background: C.panel, border: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
              }}>
                {/* Token status */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {tokenFound === null
                    ? <Loader2 size={14} className="animate-spin" style={{ color: C.label }} />
                    : tokenFound
                      ? <ShieldCheck size={16} style={{ color: C.green }} />
                      : <ShieldX size={16} style={{ color: C.red }} />
                  }
                  <span style={{ fontSize: 13, fontWeight: 600, color: tokenFound === false ? C.red : tokenFound ? C.green : C.label }}>
                    {tokenFound === null ? "Checking token…" : tokenFound ? "Replicate token found" : "Token missing"}
                  </span>
                </div>

                <div style={{ width: 1, height: 20, background: C.border }} />

                {/* Counts */}
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontSize: 13, color: C.label }}>
                    <strong style={{ color: C.text }}>{successCount}</strong> / {MODELS.length} connected
                  </span>
                  {failedCount > 0 && (
                    <span style={{ fontSize: 13, color: C.red, fontWeight: 600 }}>
                      {failedCount} failed
                    </span>
                  )}
                  {totalTested > 0 && totalTested < MODELS.length && (
                    <span style={{ fontSize: 13, color: C.primary, fontWeight: 600 }}>
                      {MODELS.length - totalTested} remaining
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                {totalTested > 0 && (
                  <div style={{ flex: 1, minWidth: 120, height: 6, borderRadius: 3, background: C.border, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 3,
                      background: failedCount > 0 ? `linear-gradient(90deg, ${C.green}, ${C.red})` : C.green,
                      width: `${(totalTested / MODELS.length) * 100}%`,
                      transition: "width .3s ease",
                    }} />
                  </div>
                )}
              </div>
            </div>

            {/* Model groups */}
            {categories.map((cat) => {
              const models = MODELS.filter((m) => m.category === cat);
              const cc = CAT_COLORS[cat];
              return (
                <div key={cat} style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                      background: cc.bg, color: cc.color, textTransform: "uppercase", letterSpacing: "0.07em",
                    }}>
                      {cat}
                    </span>
                    <span style={{ fontSize: 12, color: C.label }}>
                      {models.filter((m) => results[m.replicateId]?.status === "success").length} / {models.length} OK
                    </span>
                  </div>

                  <div style={{
                    background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden",
                  }}>
                    {models.map((model, idx) => {
                      const r = results[model.replicateId];
                      return (
                        <div
                          key={model.replicateId}
                          style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "14px 16px",
                            borderTop: idx > 0 ? `1px solid ${C.border}` : "none",
                            background: r.status === "success" ? "rgba(16,185,129,0.03)"
                              : r.status === "failed" ? "rgba(239,68,68,0.03)"
                              : C.panel,
                          }}
                        >
                          <StatusDot status={r.status} />

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{model.name}</span>
                              <code style={{ fontSize: 11, color: C.label, fontFamily: "monospace", background: C.bg, padding: "1px 6px", borderRadius: 4 }}>
                                {model.replicateId}
                              </code>
                            </div>
                            {r.status === "failed" && r.error && (
                              <p style={{ fontSize: 12, color: C.red, marginTop: 3 }}>{r.error}</p>
                            )}
                          </div>

                          {r.responseTime !== undefined && (
                            <span style={{
                              fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
                              background: r.status === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                              color: r.status === "success" ? C.green : C.red,
                              flexShrink: 0,
                            }}>
                              {r.responseTime}ms
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => testOne(model.replicateId)}
                            disabled={r.status === "testing" || runningAll}
                            style={{
                              display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                              borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg,
                              color: C.label, fontSize: 12, fontWeight: 600, cursor: "pointer",
                              fontFamily: "inherit", flexShrink: 0,
                              opacity: (r.status === "testing" || runningAll) ? 0.5 : 1,
                              transition: "all .15s",
                            }}
                            onMouseEnter={(e) => { if (r.status !== "testing" && !runningAll) { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; } }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.label; }}
                          >
                            {r.status === "testing"
                              ? <Loader2 size={12} className="animate-spin" />
                              : <RefreshCw size={12} />
                            }
                            Test
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
