"use client";

import { useState } from "react";
import { AppLayout, AuthGuard } from "@/components/layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useGetMe } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Crown, CheckCircle2, Zap, Star, ArrowRight, ShoppingCart, RefreshCw, Gift } from "lucide-react";
import { WHOP_CHECKOUT_URLS, buildCheckoutUrl } from "@/lib/whop";

const PACKS = [
  {
    id: "starter-pack",
    name: "Starter Pack",
    credits: 200,
    price: 7,
    regularPrice: 12,
    save: 5,
    bestValue: false,
    approxImages: "~40",
    approxVideos: "~13",
  },
  {
    id: "creator-pack",
    name: "Creator Pack",
    credits: 600,
    price: 18,
    regularPrice: 30,
    save: 12,
    bestValue: true,
    approxImages: "~120",
    approxVideos: "~40",
  },
  {
    id: "pro-pack",
    name: "Pro Pack",
    credits: 1500,
    price: 40,
    regularPrice: 70,
    save: 30,
    bestValue: false,
    approxImages: "~300",
    approxVideos: "~100",
  },
];

const PLAN_NAMES: Record<string, string> = {
  basic: "Basic",
  starter: "Starter",
  pro: "Pro",
};

interface CreditsData {
  creditsBalance: number;
  subscriptionCredits: number;
  bonusCredits: number;
  planMonthlyAllowance: number;
}

function useCredits() {
  return useQuery<CreditsData>({
    queryKey: ["credits"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const r = await fetch("/api/credits", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    staleTime: 15_000,
  });
}

export default function BuyCredits() {
  const { data: me } = useGetMe();
  const { data: credits } = useCredits();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const hasSubscription = !!(me?.plan && PLAN_NAMES[me.plan]);
  const planName = me?.plan ? (PLAN_NAMES[me.plan] ?? null) : null;

  /**
   * Redirect the user to the Whop checkout page for the chosen credit pack.
   * The user's ID and pack ID are passed as metadata so the webhook can
   * add the correct bonus credits after payment succeeds.
   */
  const handlePurchase = async (packId: string) => {
    const baseUrl = WHOP_CHECKOUT_URLS[packId];
    if (!baseUrl) {
      toast({
        title: "Coming soon",
        description: "This credit pack is not yet available for purchase. Please check back soon.",
        variant: "destructive",
      });
      return;
    }

    setPurchasing(packId);

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id ?? me?.id ?? "";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;

    const checkoutUrl = buildCheckoutUrl({
      baseUrl,
      userId,
      redirectUrl: `${appUrl}/dashboard/buy-credits?checkout=success`,
      extraMetadata: { packId },
    });

    window.location.href = checkoutUrl;
    // Note: setPurchasing(null) is intentionally omitted — the page navigates away.
  };

  const subCredits = credits?.subscriptionCredits ?? 0;
  const bonusCredits = credits?.bonusCredits ?? 0;
  const totalBalance = credits?.creditsBalance ?? 0;
  const monthlyAllowance = credits?.planMonthlyAllowance ?? 0;

  return (
    <AuthGuard>
      <AppLayout withSidebar={true}>
        <div className="p-6 md:p-8 max-w-4xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Top Up Your Credits</h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl">
              Your plan already includes monthly credits that reset each billing cycle. These packs give you extra bonus credits on top of your plan — they never expire.
            </p>
          </div>

          {/* Credits breakdown card */}
          <div
            className="rounded-2xl border p-5 mb-8"
            style={{ background: "#F8F7FF", borderColor: "#E5E0FF" }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: "#5B21B6" }}>
              Your Current Credits
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Monthly subscription credits */}
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "#EDE9FE" }}
                >
                  <RefreshCw className="w-4 h-4" style={{ color: "#7C3AED" }} />
                </div>
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: "#6B7280" }}>
                    Monthly credits {planName ? `(${planName})` : ""}
                  </p>
                  <p className="text-xl font-bold" style={{ color: "#0F0F1A" }}>
                    {subCredits.toLocaleString()} cr
                  </p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>
                    {monthlyAllowance > 0 ? `${monthlyAllowance} cr/month` : "No active plan"}
                  </p>
                </div>
              </div>
              {/* Bonus credits */}
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "#D1FAE5" }}
                >
                  <Gift className="w-4 h-4" style={{ color: "#059669" }} />
                </div>
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: "#6B7280" }}>
                    Bonus credits
                  </p>
                  <p className="text-xl font-bold" style={{ color: "#0F0F1A" }}>
                    {bonusCredits.toLocaleString()} cr
                  </p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>Never expires</p>
                </div>
              </div>
              {/* Total */}
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "#FEF3C7" }}
                >
                  <Zap className="w-4 h-4" style={{ color: "#D97706" }} />
                </div>
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: "#6B7280" }}>
                    Total balance
                  </p>
                  <p className="text-xl font-bold" style={{ color: "#0F0F1A" }}>
                    {totalBalance.toLocaleString()} cr
                  </p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>Ready to use</p>
                </div>
              </div>
            </div>
          </div>

          {/* No subscription warning */}
          {!hasSubscription && (
            <div
              className="mb-8 rounded-2xl border p-5 flex items-start gap-4"
              style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "#FEF3C7" }}
              >
                <Crown className="w-5 h-5" style={{ color: "#D97706" }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-0.5" style={{ color: "#92400E" }}>
                  Subscription Required
                </h3>
                <p className="text-sm" style={{ color: "#B45309" }}>
                  You need an active subscription to purchase bonus credit packs.
                </p>
              </div>
              <Link href="/plans">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-lg gap-1.5 shrink-0">
                  View Plans <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          )}

          {/* Section heading */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">Bonus Credit Packs</h2>
            <p className="text-sm text-muted-foreground">
              Extra credits on top of your monthly plan — valid 1 year, never resets.
            </p>
          </div>

          {/* Credit packs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {PACKS.map((pack) => (
              <div
                key={pack.id}
                className="rounded-2xl flex flex-col relative overflow-hidden transition-all duration-200"
                style={{
                  background: "#FFFFFF",
                  border: pack.bestValue ? "2px solid #7C5CFC" : "1px solid #EBEBF5",
                  boxShadow: pack.bestValue ? "0 8px 40px rgba(124,92,252,0.15)" : "0 1px 6px rgba(0,0,0,0.04)",
                  transform: pack.bestValue ? "scale(1.02)" : "scale(1)",
                }}
              >
                {pack.bestValue && (
                  <div
                    className="flex items-center justify-center gap-1.5 py-2 text-white text-xs font-bold tracking-wide uppercase"
                    style={{ background: "#7C5CFC" }}
                  >
                    <Star className="w-3.5 h-3.5 fill-white" />
                    Best Value
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  <p className="text-base font-semibold mb-4" style={{ color: "#0F0F1A" }}>
                    {pack.name}
                  </p>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold" style={{ color: "#0F0F1A" }}>
                        {pack.credits.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest mt-0.5" style={{ color: "#9090B0" }}>
                      Bonus Credits
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#9090B0" }}>
                      {pack.approxImages} images · {pack.approxVideos} standard videos
                    </p>
                  </div>

                  <div className="mb-4 flex items-center gap-2 flex-wrap">
                    <span className="text-3xl font-bold" style={{ color: "#0F0F1A" }}>
                      ${pack.price}
                    </span>
                    <span className="text-sm line-through" style={{ color: "#9090B0" }}>
                      ${pack.regularPrice}
                    </span>
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: "#DCFCE7", color: "#16A34A" }}
                    >
                      Save ${pack.save}
                    </span>
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {[
                      `${pack.credits.toLocaleString()} bonus credits added instantly`,
                      "Valid for 1 year — never resets",
                      "Stacks on top of monthly credits",
                      "Use for any content creation",
                    ].map((feat) => (
                      <li key={feat} className="flex items-center gap-2.5 text-sm" style={{ color: "#6B6B8A" }}>
                        <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#7C5CFC" }} />
                        {feat}
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handlePurchase(pack.id)}
                    disabled={!hasSubscription || !!purchasing}
                    className="w-full h-12 rounded-xl font-semibold text-white gap-2"
                    style={{
                      background: hasSubscription
                        ? "linear-gradient(135deg, #7C5CFC, #A78BFA)"
                        : "#D1D5DB",
                      border: "none",
                    }}
                  >
                    {purchasing === pack.id ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Redirecting...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        Buy Now — ${pack.price}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Bonus credits stack on top of your monthly plan and are used only after your subscription credits run out. They never expire and last up to 1 year from purchase.
          </p>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
