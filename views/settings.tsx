"use client";

import { AppLayout, AuthGuard } from "@/components/layout";
import { useGetMe, useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, CreditCard, Calendar, Zap } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function Settings() {
  const { data: user, isLoading: isLoadingUser } = useGetMe();
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();

  if (isLoadingUser || isLoadingSummary) {
    return (
      <AppLayout>
        <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>
      </AppLayout>
    );
  }

  if (!user) return null;

  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-6 md:p-8 max-w-4xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your account preferences and billing</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-white/10 bg-card/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">Profile Information</CardTitle>
                <CardDescription>Your personal account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{user.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {user.email}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4" /> Member Since</span>
                    <span>{format(new Date(user.createdAt), "MMMM d, yyyy")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-card/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">Subscription & Billing</CardTitle>
                <CardDescription>Manage your current plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-1 block">Current Plan</span>
                    <span className="text-2xl font-bold capitalize">{user.plan}</span>
                  </div>
                  <Zap className="w-8 h-8 text-primary opacity-50" />
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Influencers Used</span>
                    <span className="font-medium">{user.influencersUsed} / {summary?.influencersRemaining === -1 ? '∞' : (user.influencersUsed + (summary?.influencersRemaining || 0))}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Images Generated</span>
                    <span className="font-medium">{user.imagesUsed} / {summary?.imagesRemaining === -1 ? '∞' : (user.imagesUsed + (summary?.imagesRemaining || 0))}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Videos Generated</span>
                    <span className="font-medium">{user.videosUsed} / {summary?.videosRemaining === -1 ? '∞' : (user.videosUsed + (summary?.videosRemaining || 0))}</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/5">
                  <Link href="/plans">
                    <Button className="w-full gap-2">
                      <CreditCard className="w-4 h-4" /> Upgrade Plan
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}