"use client";

import { useEffect } from "react";
import { AppLayout, AuthGuard } from "@/components/layout";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Camera, Video, Plus, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const PLAN_CREDITS: Record<string, number> = { basic: 300, starter: 800, pro: 2500 };

function useAutoAssignCredits(plan?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: credits } = useQuery<{ subscriptionCredits: number; creditsBalance: number }>({
    queryKey: ["credits"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const r = await fetch("/api/credits", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!r.ok) return { subscriptionCredits: 0, creditsBalance: 0 };
      return r.json();
    },
    enabled: !!plan && !!PLAN_CREDITS[plan],
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!plan || !PLAN_CREDITS[plan]) return;
    if (!credits) return;
    if (credits.subscriptionCredits > 0) return;

    // Active plan but 0 subscription credits — auto-assign
    const assign = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const r = await fetch("/api/plans/assign-credits", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!r.ok) return;
      const data = await r.json();
      if (data.creditsAdded > 0) {
        toast({
          title: `${data.creditsAdded.toLocaleString()} credits added to your account!`,
          description: `Your ${plan} plan credits are now ready to use.`,
        });
        queryClient.invalidateQueries({ queryKey: ["credits"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      }
    };

    assign();
  }, [plan, credits?.subscriptionCredits]);
}

export default function Dashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary();
  useAutoAssignCredits(summary?.plan);

  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Overview of your digital talent agency</p>
            </div>
            <Link href="/influencers/new">
              <Button className="bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <Plus className="w-4 h-4 mr-2" />
                New Influencer
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-white/5 bg-card/50">
                  <CardContent className="p-6">
                    <div className="h-4 w-24 bg-white/10 rounded animate-pulse mb-4"></div>
                    <div className="h-8 w-16 bg-white/10 rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : summary ? (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-white/10 bg-card/60 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Total Influencers</p>
                        <h3 className="text-4xl font-bold">{summary.totalInfluencers}</h3>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Card className="border-white/10 bg-card/60 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Images Generated</p>
                        <h3 className="text-4xl font-bold">{summary.totalImages}</h3>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Camera className="w-6 h-6 text-blue-400" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <Card className="border-white/10 bg-card/60 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Videos Generated</p>
                        <h3 className="text-4xl font-bold">{summary.totalVideos}</h3>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center">
                        <Video className="w-6 h-6 text-pink-400" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Influencers */}
                <div className="col-span-1 lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Recent Personas</h2>
                    <Link href="/influencers" className="text-sm text-primary hover:underline flex items-center gap-1">
                      View All <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  
                  {summary.recentInfluencers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {summary.recentInfluencers.map((influencer) => (
                        <Link key={influencer.id} href={`/influencers/${influencer.id}`}>
                          <Card className="border-white/10 bg-card/40 hover:bg-card/80 transition-colors cursor-pointer overflow-hidden group">
                            <div className="flex items-center p-4 gap-4">
                              <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden relative shrink-0">
                                {influencer.avatarUrl ? (
                                  <img src={influencer.avatarUrl} alt={influencer.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-primary/5">
                                    <Users className="w-6 h-6 text-primary/40" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">{influencer.name}</h4>
                                <p className="text-sm text-muted-foreground truncate">{influencer.niche}</p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1"><Camera className="w-3 h-3" /> {influencer.imageCount}</span>
                                  <span className="flex items-center gap-1"><Video className="w-3 h-3" /> {influencer.videoCount}</span>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <Card className="border-white/10 border-dashed bg-transparent p-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">No Personas Yet</h3>
                      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Create your first virtual influencer to start generating content.</p>
                      <Link href="/influencers/new">
                        <Button>Create Influencer</Button>
                      </Link>
                    </Card>
                  )}
                </div>

                {/* Plan Usage */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Resource Usage
                  </h2>
                  <Card className="border-white/10 bg-card/40">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base uppercase text-muted-foreground tracking-wider">{summary.plan} Plan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium">Images Remaining</span>
                          <span className="text-muted-foreground">
                            {summary.imagesRemaining === -1 ? 'Unlimited' : summary.imagesRemaining}
                          </span>
                        </div>
                        {summary.imagesRemaining !== -1 && (
                           <Progress value={Math.max(10, Math.min(100, (summary.imagesRemaining / 100) * 100))} className="h-2 bg-white/5" />
                        )}
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium">Videos Remaining</span>
                          <span className="text-muted-foreground">
                            {summary.videosRemaining === -1 ? 'Unlimited' : summary.videosRemaining}
                          </span>
                        </div>
                        {summary.videosRemaining !== -1 && (
                           <Progress value={Math.max(10, Math.min(100, (summary.videosRemaining / 20) * 100))} className="h-2 bg-white/5" />
                        )}
                      </div>

                      <div className="pt-4 border-t border-white/5">
                        <Link href="/plans">
                          <Button variant="outline" className="w-full">Upgrade Plan</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </AppLayout>
    </AuthGuard>
  );
}