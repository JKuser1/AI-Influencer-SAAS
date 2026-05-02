"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Camera, Video as VideoIcon, Sparkles, ChevronDown,
  Play, Star, ArrowRight, Users, Image, Film, Wand2, Shield, Cpu, Volume2
} from "lucide-react";

/* ─── Static Data ──────────────────────────────────────────── */

const EXPLORE_INFLUENCERS = [
  {
    name: "Aria Nova", age: 24,
    bio: "Digital fashion icon pushing boundaries between virtual and real.",
    tags: ["fashion", "editorial"],
    img: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80&fit=crop",
  },
  {
    name: "Elena Voss", age: 22,
    bio: "No rules, no limits. A fierce explorer of beauty and audacity.",
    tags: ["beauty", "skinny"],
    img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80&fit=crop",
  },
  {
    name: "Mia Soleil", age: 20,
    bio: "Live life and inspire others through bold, unapologetic style.",
    tags: ["lifestyle", "curvy"],
    img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80&fit=crop",
  },
  {
    name: "Sana Patel", age: 26,
    bio: "Day job: teaching minds. Night job: mastering poses. Curvey, confident.",
    tags: ["fitness", "south-asian"],
    img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80&fit=crop",
  },
  {
    name: "Freja Berg", age: 27,
    bio: "Descended in the clouds. Fitness & hustle on the ground.",
    tags: ["fitness", "skinny"],
    img: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=400&q=80&fit=crop",
  },
  {
    name: "Lana West", age: 21,
    bio: "Exploring the world one layer at a time. Wanderer at heart.",
    tags: ["travel", "blonde"],
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80&fit=crop",
  },
];

const SHOWCASE_ITEMS = [
  {
    handle: "@valeriaofficial",
    img: "https://images.unsplash.com/photo-1515023115689-589c33041d3c?w=500&q=80&fit=crop",
    isVideo: false,
  },
  {
    handle: "@elena_core",
    img: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=500&q=80&fit=crop",
    isVideo: true,
    likes: 294,
  },
  {
    handle: "@anon",
    img: "https://images.unsplash.com/photo-1564923630403-2284b87c0041?w=500&q=80&fit=crop",
    isVideo: true,
    likes: 359,
  },
  {
    handle: "@sienna_ai",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80&fit=crop&face=true",
    isVideo: false,
  },
  {
    handle: "@mirabell",
    img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&q=80&fit=crop",
    isVideo: true,
    likes: 182,
  },
  {
    handle: "@crystal_v",
    img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&q=80&fit=crop",
    isVideo: false,
  },
];

const TESTIMONIALS_SMALL = [
  {
    num: "01",
    quote: "Was messing around with Stable Diffusion for months trying to get consistent faces. This does it in like 2 clicks. The image quality is seriously good for what you pay.",
    name: "Pierre Dubois",
    handle: "@pierredubois",
    img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&q=80&fit=crop",
  },
  {
    num: "02",
    quote: "Created a fitness influencer and the motion control feature is what hooked me. She can actually do workout demos and it looks real. My TikTok blew up with the exercise videos.",
    name: "Lucas",
    handle: "@lucasMestre",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80&fit=crop",
  },
  {
    num: "03",
    quote: "I've tried a bunch of AI image tools as a developer. The face swap quality here is genuinely impressive. Using it for a tech review character on YouTube Shorts — works way better than expected.",
    name: "Michael Chen",
    handle: "@michaelchen",
    img: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&q=80&fit=crop",
  },
  {
    num: "04",
    quote: "Started with one character just for fun, now I'm running three different ones. Each has their own look and personality. The video models keep getting better with every update too.",
    name: "David Johnson",
    handle: "@davidjohnson",
    img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&q=80&fit=crop",
  },
];

const TOOLS = [
  {
    icon: Wand2,
    badge: "NEW",
    badgeColor: "bg-primary",
    title: "Motion Control",
    desc: "Original character → first-frame pose with Nano Banana Pro → Motion Control. Dances, actions, and trending clips with your influencer.",
    detail: "Match the first frame with Nano Banana Pro, then drive motion from any video. Highest quality for viral replications.",
    cta: "Try Motion Control",
    ctaColor: "bg-primary hover:bg-primary/90",
    img: "https://images.unsplash.com/photo-1536104968055-4d61aa56f46a?w=300&q=80&fit=crop",
  },
  {
    icon: Volume2,
    badge: "UP TO 10 MIN",
    badgeColor: "bg-pink-600",
    title: "Lip Sync Talking Videos",
    desc: "One image in, minutes of realistic talking video. Generate from script or your own audio with perfect lip sync.",
    detail: "Perfect for testimonials, courses, vlogs, and ads. Your influencer speaks from a single photo.",
    cta: "Try Lip Sync",
    ctaColor: "bg-pink-600 hover:bg-pink-700",
    img: "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=300&q=80&fit=crop",
    flip: true,
  },
  {
    icon: Film,
    badge: "LIVE",
    badgeColor: "bg-blue-500",
    title: "Sora 2 & Sora 2 Pro",
    desc: "Generate premium text-to-video with synced audio using OpenAI Sora 2.",
    detail: "Try Sora 2 with auto audio and high-quality motion. Portrait or landscape.",
    cta: "Try Sora 2",
    ctaColor: "bg-blue-600 hover:bg-blue-700",
    img: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&q=80&fit=crop",
  },
  {
    icon: Image,
    badge: "NEW",
    badgeColor: "bg-primary",
    title: "Multi-Model Image Editing",
    desc: "Access all popular AI models in one place — Qwen Edit Plus, GPT Image 1.5, Seedream 4, and more.",
    detail: "Change outfits & backgrounds. Transform styles instantly. Professional-grade results.",
    cta: "Try Image Editing",
    ctaColor: "bg-primary hover:bg-primary/90",
    flip: true,
    img: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&q=80&fit=crop",
  },
];

const FAQ_ITEMS = [
  {
    q: "What AI models are available for video generation?",
    a: "We support Wan 2.2, Wan 2.6, Kling V3.0 (Standard & Pro), Veo 3.1, Sora 2, and Sora 2 Pro — giving you access to the best models on the market from one dashboard.",
  },
  {
    q: "How do credits work?",
    a: "Every plan comes with a monthly credit allocation. Basic gets 300 credits, Starter gets 800, and Pro gets 2,500. Different operations cost different amounts — a standard image costs 6–18 credits, while a premium video can cost 60–650 credits depending on the model and duration.",
  },
  {
    q: "Can I generate NSFW content?",
    a: "Yes — Starter and Pro plans unlock NSFW image and video generation. Basic plan is limited to SFW content only.",
  },
  {
    q: "How consistent are the generated characters?",
    a: "Our platform uses model fingerprinting so your influencer maintains consistent appearance across prompts. Motion Control also lets you replicate specific poses from reference videos for even tighter consistency.",
  },
  {
    q: "What is Motion Control?",
    a: "Motion Control lets you take any video and replicate the movement with your AI influencer. Use Nano Banana Pro to set the first-frame pose, then drive full-body motion from any reference clip.",
  },
  {
    q: "How do I earn money with my AI influencers?",
    a: "Creators monetize through brand sponsorships, OnlyFans/Fanvue, YouTube ad revenue, and selling content packs. Your AI influencer can work 24/7 without breaks — producing content while you sleep.",
  },
];

const UPDATES = [
  { date: "JANUARY 2026", num: "01", title: "Motion Control & Lip Sync", desc: "Motion Control: Nano Banana Pro for pose replication plus motion from any video. Lip Sync up to 10 minutes of talking video from one image, from script or your audio." },
  { date: "JANUARY 2026", num: "02", title: "New Guides", desc: "New guides with real examples and step-by-step workflows. Mobile-friendly explore section." },
  { date: "OCTOBER 2025", num: "03", title: "Veo 3.1, Sora 2 & Sora 2 Pro Live", desc: "Google Veo 3.1, OpenAI Sora 2 models with synced audio are now available for text-to-video. Landscape and portrait." },
  { date: "AUGUST 2025", num: "04", title: "Voice Video Generation", desc: "Now you can generate voice videos with your AI influencer. Upload your own audio file or generate a voice preview with our AI." },
  { date: "AUGUST 2025", num: "05", title: "Google Veo 3 Ultra Realistic Videos", desc: "Now featuring Google's latest Veo 3 model for ultra realistic video generation with audio support and text-to-video capabilities." },
  { date: "JULY 2025", num: "06", title: "New Video Models", desc: "Enhanced AI video generation with better quality, more realistic movements, and improved subject replacement." },
  { date: "JUNE 2025", num: "07", title: "5x Faster Training", desc: "Influencer training now takes just 3–4 minutes instead of 20+ minutes. Get your custom AI Influencer ready in no time." },
  { date: "JUNE 2025", num: "08", title: "Premium Quality Influencers", desc: "Higher quality influencer models with better facial features, expressions, and overall realism." },
  { date: "JUNE 2025", num: "09", title: "NSFW Video Generation", desc: "Advanced NSFW video generation capabilities now available for adult content creators." },
];

/* ─── Helpers ───────────────────────────────────────────────── */

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-3">{children}</p>
  );
}

/* ─── FAQ Item ──────────────────────────────────────────────── */

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/8">
      <button
        className="flex w-full items-center justify-between py-5 text-left text-base font-medium text-white/90 hover:text-white transition-colors gap-4"
        onClick={() => setOpen(!open)}
      >
        <span>{q}</span>
        <ChevronDown className={`w-5 h-5 shrink-0 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-muted-foreground leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */

export default function Landing() {
  return (
    <AppLayout withSidebar={false} darkMode={true}>

      {/* ── 1. HERO ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0d0518] via-[#0a0a14] to-black min-h-[340px] md:min-h-[420px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_70%_50%,rgba(124,92,252,0.25),transparent)]" />
        <div className="container mx-auto px-4 py-10 md:py-14 flex flex-col md:flex-row items-center gap-6 md:gap-10 relative z-10">
          {/* Images collage */}
          <div className="flex-shrink-0 flex items-end gap-1 md:gap-2 h-[220px] md:h-[300px]">
            <motion.img
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=220&q=90&fit=crop"
              alt="AI Influencer"
              className="h-[180px] md:h-[250px] w-[110px] md:w-[150px] object-cover rounded-xl border border-white/10 shadow-2xl"
            />
            <motion.img
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=220&q=90&fit=crop"
              alt="AI Influencer"
              className="h-[220px] md:h-[300px] w-[110px] md:w-[155px] object-cover rounded-xl border border-white/10 shadow-2xl"
            />
            <motion.img
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=220&q=90&fit=crop"
              alt="AI Influencer"
              className="h-[180px] md:h-[250px] w-[110px] md:w-[150px] object-cover rounded-xl border border-white/10 shadow-2xl"
            />
          </div>
          {/* Copy */}
          <div className="flex-1 text-center md:text-left max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-semibold mb-4"
            >
              <Star className="w-3 h-3 fill-yellow-400" /> #1 AI Influencer Generator
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-4"
            >
              Create Your Own<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-pink-400">AI Influencer</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.2 }}
              className="text-sm md:text-base text-muted-foreground mb-6 max-w-md mx-auto md:mx-0 leading-relaxed"
            >
              The all-in-one AI influencer generator. Create AI girls, generate videos with 10+ models, face swap, lip sync, and motion control. Make your AI influencer and start earning.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.3 }}
            >
              <Link href="/auth/register">
                <Button size="lg" className="bg-white hover:bg-white/90 text-black font-bold px-8 py-5 rounded-full text-sm shadow-xl gap-2">
                  <Sparkles className="w-4 h-4" /> Create Your AI Influencer
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 2. EXPLORE AI INFLUENCERS ─────────────────────────── */}
      <section className="py-20 md:py-28 bg-black">
        <div className="container mx-auto px-4">
          <FadeIn className="text-center mb-12">
            <SectionLabel>Community</SectionLabel>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3">Explore AI Influencers</h2>
            <p className="text-muted-foreground text-base max-w-md mx-auto">Discover trending AI influencers created by the community</p>
          </FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {EXPLORE_INFLUENCERS.map((inf, i) => (
              <FadeIn key={inf.name} delay={i * 0.06}>
                <div className="relative rounded-2xl overflow-hidden group cursor-pointer border border-white/8 hover:border-primary/40 transition-all duration-300 shadow-lg">
                  <img
                    src={inf.img}
                    alt={inf.name}
                    className="w-full aspect-[3/4] object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="bg-primary/80 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Exclusive</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-bold text-white">{inf.name}</span>
                      <span className="text-muted-foreground text-xs">{inf.age}</span>
                    </div>
                    <p className="text-white/70 text-xs line-clamp-2 mb-2">{inf.bio}</p>
                    <div className="flex flex-wrap gap-1">
                      {inf.tags.map(t => (
                        <span key={t} className="text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.3} className="text-center mt-10">
            <Link href="/auth/register">
              <Button variant="outline" className="rounded-full px-8 border-white/15 hover:bg-white/5 gap-2">
                View All Influencers <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── 3. SHOWCASE ───────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-[#060608]">
        <div className="container mx-auto px-4">
          <FadeIn className="text-center mb-12">
            <SectionLabel>Community</SectionLabel>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Showcase</h2>
            <p className="text-muted-foreground text-base max-w-lg mx-auto">
              See what creators are building with our AI influencer generator. From AI girl portraits to viral videos — the possibilities are endless.
            </p>
          </FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {SHOWCASE_ITEMS.map((item, i) => (
              <FadeIn key={item.handle} delay={i * 0.07}>
                <div className="relative rounded-2xl overflow-hidden group cursor-pointer border border-white/8 hover:border-white/20 transition-all duration-300">
                  <img
                    src={item.img}
                    alt={item.handle}
                    className="w-full aspect-[3/4] object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  {item.isVideo && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="bg-black/60 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <Play className="w-2.5 h-2.5 fill-white" /> VIDEO
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                    <span className="text-white/80 text-xs font-medium">{item.handle}</span>
                    {item.likes && (
                      <span className="text-white/60 text-xs flex items-center gap-1">
                        <Star className="w-3 h-3 fill-white/40 text-white/40" /> {item.likes}
                      </span>
                    )}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.4} className="text-center mt-10 space-y-3">
            <Link href="/auth/register">
              <Button variant="outline" className="rounded-full px-8 border-white/15 hover:bg-white/5 gap-2">
                View all creations <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <p className="text-muted-foreground text-sm">
              Join <span className="text-primary font-semibold">thousands of creators</span> already using InfluenceAI Studio
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── 4. TESTIMONIALS ───────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-black">
        <div className="container mx-auto px-4">
          <FadeIn className="text-center mb-14">
            <SectionLabel>Testimonials</SectionLabel>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">Creators Love InfluenceAI Studio</h2>
          </FadeIn>
          {/* Featured testimonial */}
          <FadeIn delay={0.1}>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 md:p-12 mb-6 relative overflow-hidden">
              <div className="absolute top-6 left-8 text-primary/30 text-8xl font-serif leading-none select-none">"</div>
              <p className="text-xl md:text-2xl font-medium leading-relaxed text-white/90 max-w-3xl mb-8 relative z-10">
                Tried this on a whim last week and honestly can't stop using it. Made my first AI influencer for Instagram — the photos look scarily real. The lip sync feature is insane for reels, getting me way more engagement than I expected.
              </p>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80&fit=crop"
                    alt="Thomas Martin"
                    className="w-11 h-11 rounded-full object-cover border border-white/10"
                  />
                  <div>
                    <p className="font-semibold text-white">Thomas Martin</p>
                    <p className="text-muted-foreground text-sm">@thomasmartin</p>
                  </div>
                </div>
                <span className="bg-primary/20 border border-primary/30 text-primary text-xs font-semibold px-4 py-2 rounded-full">
                  26.3k+ followers across social media
                </span>
              </div>
            </div>
          </FadeIn>
          {/* Small testimonials grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TESTIMONIALS_SMALL.map((t, i) => (
              <FadeIn key={t.name} delay={i * 0.08}>
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5 h-full flex flex-col justify-between hover:border-primary/25 transition-colors">
                  <div>
                    <p className="text-primary/50 text-xs font-mono mb-3">{t.num}</p>
                    <p className="text-white/75 text-sm leading-relaxed mb-5">"{t.quote}"</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <img src={t.img} alt={t.name} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                    <div>
                      <p className="text-white/90 text-xs font-semibold">{t.name}</p>
                      <p className="text-muted-foreground text-xs">{t.handle}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. POWERFUL TOOLS ─────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-[#060608]">
        <div className="container mx-auto px-4">
          <FadeIn className="text-center mb-14">
            <SectionLabel>Powerful Tools</SectionLabel>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Everything You Need to Create</h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              Professional AI tools for video, images, lip sync, and motion control — all in one platform.
            </p>
          </FadeIn>
          <div className="space-y-4">
            {TOOLS.map((tool, i) => (
              <FadeIn key={tool.title} delay={i * 0.08}>
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] hover:border-primary/25 transition-all duration-300">
                  <div className={`flex flex-col ${tool.flip ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-6 p-6 md:p-8`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <tool.icon className="w-4 h-4 text-primary" />
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${tool.badgeColor} text-white`}>{tool.badge}</span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold mb-2">{tool.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-2">{tool.desc}</p>
                      <p className="text-white/50 text-xs leading-relaxed mb-5">{tool.detail}</p>
                      <Link href="/auth/register">
                        <Button size="sm" className={`${tool.ctaColor} text-white rounded-full px-5 gap-1.5 text-xs`}>
                          {tool.cta} <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                    <div className="shrink-0">
                      <img
                        src={tool.img}
                        alt={tool.title}
                        className="w-full md:w-[240px] h-[160px] md:h-[180px] object-cover rounded-xl border border-white/10 shadow-xl"
                      />
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. STATS BAR ──────────────────────────────────────── */}
      <section className="py-14 border-y border-white/5 bg-black">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "10+", label: "AI Video Models" },
              { value: "6+", label: "Image Models" },
              { value: "50K+", label: "Creators" },
              { value: "2M+", label: "Images Generated" },
            ].map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 0.07}>
                <p className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400 mb-1">{stat.value}</p>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. FAQ ────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-[#060608]">
        <div className="container mx-auto px-4 max-w-3xl">
          <FadeIn className="text-center mb-12">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">FAQ</h2>
            <p className="text-muted-foreground text-base">
              Create stunning AI influencers with video, lip sync, and face swap. Got questions? We've got answers.
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-6 md:px-8">
              {FAQ_ITEMS.map((item) => (
                <FaqItem key={item.q} {...item} />
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── 8. UPDATES ────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-black">
        <div className="container mx-auto px-4">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3">Latest Updates & Improvements</h2>
            <p className="text-muted-foreground text-base">We're constantly improving to provide you with the best experience</p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 md:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {UPDATES.map((u) => (
                  <div key={u.num} className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-primary text-xs font-mono">{String(UPDATES.indexOf(u) + 1).padStart(2, "0")}</span>
                      <span className="text-muted-foreground/60 text-[10px] font-medium uppercase tracking-wider">{u.date}</span>
                    </div>
                    <h4 className="text-white/90 text-sm font-semibold">{u.title}</h4>
                    <p className="text-muted-foreground text-xs leading-relaxed">{u.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-center text-muted-foreground/50 text-xs mt-8">Stay tuned for more exciting updates coming soon!</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── 9. FINAL CTA ──────────────────────────────────────── */}
      <section className="py-24 md:py-36 relative overflow-hidden bg-[#060608]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(124,92,252,0.18),transparent)]" />
        <div className="container relative z-10 mx-auto px-4 text-center max-w-3xl">
          <FadeIn>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] backdrop-blur px-8 py-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
                Start creating your AI influencer today.
              </h2>
              <p className="text-muted-foreground text-base mb-8 max-w-xl mx-auto">
                Use our AI influencer generator with Motion Control, Lip Sync, Face Swap, and 10+ video models. Create AI girls, virtual creators, and content that earns.
              </p>
              <Link href="/auth/register">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-10 py-6 text-base font-bold rounded-full shadow-[0_0_50px_rgba(124,92,252,0.4)] gap-2">
                  Create Your AI Influencer Now <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <p className="text-muted-foreground/60 text-sm mt-5">No credit card required · Start free today</p>
            </div>
          </FadeIn>
        </div>
      </section>

    </AppLayout>
  );
}
