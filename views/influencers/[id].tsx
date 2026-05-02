"use client";

import { AppLayout, AuthGuard } from "@/components/layout";
import { 
  useGetInfluencer, getGetInfluencerQueryKey,
  useGetInfluencerImages, getGetInfluencerImagesQueryKey,
  useGetInfluencerVideos, getGetInfluencerVideosQueryKey,
  useGenerateInfluencer,
  useDeleteImage,
  useDeleteVideo
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Camera, Video, Sparkles, Wand2, Download, Trash2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function InfluencerProfile() {
  const params = useParams();
  const id = params.id as string | undefined;
  const influencerId = parseInt(id || "0");
  
  const { data: influencer, isLoading: isLoadingProfile } = useGetInfluencer(influencerId, {
    query: { enabled: !!influencerId, queryKey: getGetInfluencerQueryKey(influencerId) }
  });
  
  const { data: images, isLoading: isLoadingImages } = useGetInfluencerImages(influencerId, {
    query: { enabled: !!influencerId, queryKey: getGetInfluencerImagesQueryKey(influencerId) }
  });
  
  const { data: videos, isLoading: isLoadingVideos } = useGetInfluencerVideos(influencerId, {
    query: { enabled: !!influencerId, queryKey: getGetInfluencerVideosQueryKey(influencerId) }
  });

  const generateAvatarMutation = useGenerateInfluencer();
  const deleteImageMutation = useDeleteImage();
  const deleteVideoMutation = useDeleteVideo();

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleGenerateAvatar = () => {
    generateAvatarMutation.mutate({ id: influencerId }, {
      onSuccess: () => {
        toast({ title: "Avatar generation started!" });
        queryClient.invalidateQueries({ queryKey: getGetInfluencerQueryKey(influencerId) });
      },
      onError: (error: any) => {
        toast({ title: "Generation failed", description: error.response?.data?.error, variant: "destructive" });
      }
    });
  };

  const handleDeleteImage = (imageId: number) => {
    deleteImageMutation.mutate({ id: imageId }, {
      onSuccess: () => {
        toast({ title: "Image deleted" });
        queryClient.invalidateQueries({ queryKey: getGetInfluencerImagesQueryKey(influencerId) });
        queryClient.invalidateQueries({ queryKey: getGetInfluencerQueryKey(influencerId) });
      }
    });
  };

  const handleDeleteVideo = (videoId: number) => {
    deleteVideoMutation.mutate({ id: videoId }, {
      onSuccess: () => {
        toast({ title: "Video deleted" });
        queryClient.invalidateQueries({ queryKey: getGetInfluencerVideosQueryKey(influencerId) });
        queryClient.invalidateQueries({ queryKey: getGetInfluencerQueryKey(influencerId) });
      }
    });
  };

  if (isLoadingProfile) {
    return (
      <AppLayout>
        <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>
      </AppLayout>
    );
  }

  if (!influencer) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-muted-foreground">Influencer not found</div>
      </AppLayout>
    );
  }

  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
          <div className="mb-6">
            <Link href="/influencers" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Influencers
            </Link>
          </div>

          {/* Profile Header */}
          <div className="relative rounded-2xl overflow-hidden mb-8 border border-white/10 bg-card/40">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-background/50 to-background z-0"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-stretch gap-6 p-6 md:p-8">
              <div className="w-32 h-32 md:w-48 md:h-48 shrink-0 rounded-2xl overflow-hidden border-2 border-white/10 bg-card shadow-2xl relative group">
                {influencer.avatarUrl ? (
                  <>
                    <img src={influencer.avatarUrl} alt={influencer.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Button variant="ghost" size="icon" onClick={handleGenerateAvatar} disabled={generateAvatarMutation.isPending} className="text-white hover:text-primary">
                        <RefreshCw className={`w-6 h-6 ${generateAvatarMutation.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-primary/5 p-4 text-center">
                    <Button 
                      onClick={handleGenerateAvatar}
                      disabled={generateAvatarMutation.isPending}
                      className="bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                    >
                      {generateAvatarMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      Generate Avatar
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex-1 flex flex-col justify-center text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{influencer.name}</h1>
                  {influencer.status === "draft" && (
                    <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground font-medium uppercase tracking-wider">Draft</span>
                  )}
                </div>
                <p className="text-primary text-lg font-medium mb-4">{influencer.niche}</p>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span>{influencer.ethnicity}</span>
                  <span className="w-1 h-1 rounded-full bg-white/20"></span>
                  <span>Age {influencer.age}</span>
                  <span className="w-1 h-1 rounded-full bg-white/20"></span>
                  <span>{influencer.style}</span>
                </div>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                  {influencer.characteristics.map(char => (
                    <span key={char} className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground">
                      {char}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-6 md:border-l md:border-white/10 md:pl-8">
                 <div className="flex flex-col items-center">
                   <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                     <Camera className="w-5 h-5 text-blue-400" />
                   </div>
                   <span className="text-2xl font-bold">{influencer.imageCount}</span>
                   <span className="text-xs text-muted-foreground">Images</span>
                 </div>
                 <div className="flex flex-col items-center">
                   <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center mb-2">
                     <Video className="w-5 h-5 text-pink-400" />
                   </div>
                   <span className="text-2xl font-bold">{influencer.videoCount}</span>
                   <span className="text-xs text-muted-foreground">Videos</span>
                 </div>
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="images" className="w-full">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-card border border-white/5">
                <TabsTrigger value="images" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <Camera className="w-4 h-4 mr-2" /> Photos
                </TabsTrigger>
                <TabsTrigger value="videos" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <Video className="w-4 h-4 mr-2" /> Motion
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="images" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Generate New Image Card */}
                <Link href={`/images?influencer=${influencerId}`}>
                  <Card className="border-white/10 border-dashed bg-card/20 hover:bg-card/40 hover:border-primary/50 transition-all cursor-pointer min-h-[220px] md:h-[350px] flex flex-col items-center justify-center text-center p-6 group">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Wand2 className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">Generate Photo</h3>
                    <p className="text-sm text-muted-foreground">Create a new hyper-realistic image of {influencer.name}</p>
                  </Card>
                </Link>

                {/* Image Grid */}
                {isLoadingImages ? (
                  [1, 2].map(i => <div key={i} className="min-h-[220px] md:h-[350px] rounded-xl bg-white/5 animate-pulse" />)
                ) : images?.map(img => (
                  <div key={img.id} className="group relative min-h-[220px] md:h-[350px] rounded-xl overflow-hidden border border-white/10 bg-card">
                    <img src={img.imageUrl} alt={img.prompt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                      <p className="text-white text-sm line-clamp-3 mb-4">{img.prompt}</p>
                      <div className="flex gap-2">
                        <Button size="icon" variant="secondary" className="h-8 w-8 bg-white/20 hover:bg-white/40 text-white" onClick={() => window.open(img.imageUrl, '_blank')}>
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="destructive" className="h-8 w-8 bg-destructive/80 hover:bg-destructive text-white" onClick={() => handleDeleteImage(img.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="videos" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Generate New Video Card */}
                <Link href={`/videos?influencer=${influencerId}`}>
                  <Card className="border-white/10 border-dashed bg-card/20 hover:bg-card/40 hover:border-pink-500/50 transition-all cursor-pointer min-h-[220px] md:h-[350px] flex flex-col items-center justify-center text-center p-6 group">
                    <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Video className="w-8 h-8 text-pink-500" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">Generate Video</h3>
                    <p className="text-sm text-muted-foreground">Create cinematic motion video of {influencer.name}</p>
                  </Card>
                </Link>

                {/* Video Grid */}
                {isLoadingVideos ? (
                  [1].map(i => <div key={i} className="min-h-[220px] md:h-[350px] rounded-xl bg-white/5 animate-pulse" />)
                ) : videos?.map(video => (
                  <div key={video.id} className="group relative min-h-[220px] md:h-[350px] rounded-xl overflow-hidden border border-white/10 bg-card">
                    {video.status === 'completed' && video.videoUrl ? (
                      <video src={video.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-card p-6 text-center">
                        {video.status === 'pending' || video.status === 'processing' ? (
                          <>
                            <div className="w-12 h-12 rounded-full border-2 border-pink-500 border-t-transparent animate-spin mb-4" />
                            <p className="font-medium text-pink-400">Processing Video...</p>
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{video.prompt}</p>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                              <Trash2 className="w-6 h-6 text-destructive" />
                            </div>
                            <p className="font-medium text-destructive">Generation Failed</p>
                          </>
                        )}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                      <p className="text-white text-sm line-clamp-3 mb-4">{video.prompt}</p>
                      <div className="flex gap-2">
                        {video.status === 'completed' && (
                          <Button size="icon" variant="secondary" className="h-8 w-8 bg-white/20 hover:bg-white/40 text-white" onClick={() => window.open(video.videoUrl, '_blank')}>
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        <Button size="icon" variant="destructive" className="h-8 w-8 bg-destructive/80 hover:bg-destructive text-white" onClick={() => handleDeleteVideo(video.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}