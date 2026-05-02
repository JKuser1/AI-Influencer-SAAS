"use client";

import { AppLayout, AuthGuard } from "@/components/layout";
import { useGetInfluencers, useDeleteInfluencer, getGetInfluencersQueryKey, useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Camera, Video, Plus, Trash2, MoreVertical, Sparkles, Lock } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { canCreateInfluencer, getInfluencerLimit } from "@/lib/plan-access";

export default function InfluencersList() {
  const { data: influencers, isLoading } = useGetInfluencers();
  const deleteMutation = useDeleteInfluencer();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: meData } = useGetMe();
  const userPlan = meData?.plan ?? "basic";
  const influencerCount = influencers?.length ?? 0;
  const canCreate = canCreateInfluencer(userPlan, influencerCount);
  const limit = getInfluencerLimit(userPlan);

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Influencer deleted" });
        queryClient.invalidateQueries({ queryKey: getGetInfluencersQueryKey() });
      },
      onError: () => {
        toast({ title: "Failed to delete influencer", variant: "destructive" });
      }
    });
  };

  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Your Personas</h1>
              <p className="text-muted-foreground mt-1">
                Manage your digital talent roster
                {limit !== null && (
                  <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {influencerCount}/{limit} used
                  </span>
                )}
              </p>
            </div>
            {canCreate ? (
              <Link href="/influencers/new">
                <Button className="bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  <Plus className="w-4 h-4 mr-2" />
                  Mint New Persona
                </Button>
              </Link>
            ) : (
              <Link href="/plans">
                <Button className="bg-primary/80 hover:bg-primary shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  <Lock className="w-4 h-4 mr-2" />
                  Upgrade for More Personas
                </Button>
              </Link>
            )}
          </div>

          {/* Plan limit banner */}
          {!canCreate && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
              <Lock className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Persona limit reached ({influencerCount}/{limit})</p>
                <p className="text-xs text-muted-foreground mt-0.5">Upgrade your plan to create more AI personas.</p>
              </div>
              <Link href="/plans">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-xs">View Plans</Button>
              </Link>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-white/5 bg-card/50 overflow-hidden h-[300px]">
                  <div className="h-32 bg-white/5 animate-pulse"></div>
                  <CardContent className="p-6">
                    <div className="h-6 w-3/4 bg-white/10 rounded animate-pulse mb-3"></div>
                    <div className="h-4 w-1/2 bg-white/10 rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : influencers?.length === 0 ? (
             <Card className="border-white/10 border-dashed bg-card/20 p-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">The Stage is Empty</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">Create your first virtual influencer to start generating hyper-realistic content.</p>
              <Link href="/influencers/new">
                <Button size="lg" className="bg-primary hover:bg-primary/90 px-8">Create Influencer</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {influencers?.map((influencer, index) => (
                <motion.div
                  key={influencer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="border-white/10 bg-card/60 backdrop-blur-sm overflow-hidden group hover:border-primary/40 transition-colors">
                    <div className="h-32 relative bg-gradient-to-br from-primary/20 to-background border-b border-white/5">
                      {influencer.avatarUrl && (
                        <div className="absolute inset-0">
                          <img src={influencer.avatarUrl} alt="" className="w-full h-full object-cover opacity-50 blur-sm" />
                          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent"></div>
                        </div>
                      )}
                      <div className="absolute -bottom-8 left-6">
                        <div className="w-20 h-20 rounded-xl bg-card border border-white/10 overflow-hidden shadow-xl ring-2 ring-background">
                          {influencer.avatarUrl ? (
                            <img src={influencer.avatarUrl} alt={influencer.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10">
                              <Users className="w-8 h-8 text-primary/40" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="absolute top-4 right-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-background/50 backdrop-blur-md hover:bg-background">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 bg-card/95 backdrop-blur-xl border-white/10">
                            <DropdownMenuItem asChild>
                              <Link href={`/influencers/${influencer.id}`} className="cursor-pointer w-full flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> Manage
                              </Link>
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive cursor-pointer flex items-center gap-2">
                                  <Trash2 className="w-4 h-4" /> Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="border-white/10 bg-card/95 backdrop-blur-xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Persona?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete {influencer.name} and all associated images and videos. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-transparent border-white/10">Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => handleDelete(influencer.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    <CardContent className="pt-12 pb-6 px-6">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold truncate">{influencer.name}</h3>
                        {influencer.status === "draft" && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-muted-foreground font-medium uppercase tracking-wider">Draft</span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm truncate mb-4">{influencer.niche}</p>
                      
                      <div className="flex gap-2 flex-wrap mb-4">
                        {influencer.characteristics.slice(0, 3).map((char, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground">
                            {char}
                          </span>
                        ))}
                        {influencer.characteristics.length > 3 && (
                          <span className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground opacity-70">
                            +{influencer.characteristics.length - 3}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground mb-1">Images</span>
                          <span className="font-semibold flex items-center gap-1.5"><Camera className="w-4 h-4 text-blue-400" /> {influencer.imageCount}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground mb-1">Videos</span>
                          <span className="font-semibold flex items-center gap-1.5"><Video className="w-4 h-4 text-pink-400" /> {influencer.videoCount}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="px-6 pb-6 pt-0">
                      <Link href={`/influencers/${influencer.id}`} className="w-full">
                        <Button className="w-full variant-outline border-primary/30 hover:border-primary hover:bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          Manage Content
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </AppLayout>
    </AuthGuard>
  );
}