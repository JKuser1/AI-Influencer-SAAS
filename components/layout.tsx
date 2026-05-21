"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  LayoutDashboard,
  Users,
  Settings as SettingsIcon,
  Zap,
  Wand2,
  Sparkles,
  ChevronDown,
  UserPlus,
  Move3D,
  ImagePlus,
  VideoIcon,
  ShoppingCart,
} from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const CREATE_ITEMS = [
  {
    icon: UserPlus,
    label: "Create a new AI influencer",
    sub: "Create a new AI influencer",
    href: "/influencers/new",
    badge: null,
  },
  {
    icon: Move3D,
    label: "Motion Control",
    sub: "Control movement in your videos",
    href: "/videos?tab=motion",
    badge: "NEW",
  },
  {
    icon: ImagePlus,
    label: "Generate Images",
    sub: "Create stunning AI images",
    href: "/images",
    badge: null,
  },
  {
    icon: VideoIcon,
    label: "Generate Videos",
    sub: "Create amazing AI videos",
    href: "/videos",
    badge: null,
  },
];

function CreateDropdown() {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-2 bg-primary hover:bg-primary/90 text-white font-semibold shadow-[0_0_20px_rgba(168,85,247,0.35)] px-4 h-9 text-sm">
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">Create</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-80 hidden sm:inline" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-72 p-1.5 bg-popover border-border shadow-lg"
      >
        {CREATE_ITEMS.map((item) => (
          <DropdownMenuItem
            key={item.href}
            onClick={() => router.push(item.href)}
            className="flex items-start gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-accent focus:bg-accent group"
          >
            <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
              <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-white leading-none">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{item.sub}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Navbar() {
  const location = usePathname();
  const router = useRouter();
  const { session, isLoading: isAuthLoading, signOut } = useAuth();
  const { data: userProfile } = useGetMe({
    query: { enabled: !!session, queryKey: getGetMeQueryKey() },
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: creditsData } = useQuery<{ creditsBalance: number }>({
    queryKey: ["credits"],
    queryFn: async () => {
      const token = session?.access_token;
      const r = await fetch("/api/credits", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!r.ok) return { creditsBalance: 0 };
      return r.json();
    },
    enabled: !!session,
    staleTime: 30_000,
  });

  const handleLogout = async () => {
    try {
      await signOut();
      await queryClient.invalidateQueries();
      toast({ title: "Logged out successfully" });
      router.push("/");
    } catch {
      toast({ title: "Failed to logout", variant: "destructive" });
    }
  };

  const isLoggedIn = !!session;

  const navLinks = isLoggedIn
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/influencers", label: "Influencers" },
        { href: "/plans", label: "Plans" },
      ]
    : [{ href: "/plans", label: "Pricing" }];

  const userInitial = ((userProfile?.name ?? session?.user?.email ?? "U")[0] ?? "U").toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
        {/* Left: Logo + desktop nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">InfluenceAI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "transition-colors hover:text-primary",
                  location === link.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            {isLoggedIn && <CreateDropdown />}
          </nav>
        </div>

        {/* Right: desktop user info + mobile actions */}
        <div className="flex items-center gap-3">
          {!isAuthLoading && (
            <>
              {/* Desktop */}
              {isLoggedIn ? (
                <div className="hidden md:flex items-center gap-3">
                  <Link href="/dashboard/buy-credits">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/25 bg-primary/8 hover:bg-primary/15 transition-colors cursor-pointer">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                      <span className="text-sm font-semibold text-primary">
                        {(creditsData?.creditsBalance ?? 0).toLocaleString()} cr
                      </span>
                    </span>
                  </Link>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-foreground">
                      {userProfile?.name ?? session?.user?.email}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {userProfile?.plan ?? "free"} Plan
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-4">
                  <Link
                    href="/auth/login"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Log in
                  </Link>
                  <Link href="/auth/register">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile: Create button + avatar (logged in) or Log in (logged out) */}
              {isLoggedIn ? (
                <div className="md:hidden flex items-center gap-2">
                  <CreateDropdown />
                  <div
                    style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: "linear-gradient(135deg, #7C5CFC, #A78BFA)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, cursor: "pointer",
                    }}
                    onClick={handleLogout}
                    title="Log out"
                  >
                    <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>{userInitial}</span>
                  </div>
                </div>
              ) : (
                <div className="md:hidden flex items-center gap-2">
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm" className="text-sm">Log in</Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm">
                      Start
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Bottom Navigation (mobile only) ─────────────────────────────────────────
function BottomNav() {
  const location = usePathname();
  const { session } = useAuth();

  if (!session) return null;

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/influencers", label: "Influencers", icon: Users },
    { href: "/plans", label: "Plans", icon: Zap },
    { href: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "#FFFFFF",
        borderTop: "1px solid #EBEBF5",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div style={{ display: "flex", height: 64 }}>
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            location === href ||
            (href !== "/dashboard" && href !== "/plans" && location.startsWith(href));
          return (
            <Link key={href} href={href} style={{ flex: 1 }}>
              <span
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", height: "100%", gap: 3,
                }}
              >
                <Icon size={20} color={active ? "#7C5CFC" : "#9090B0"} />
                <span
                  style={{
                    fontSize: 10,
                    color: active ? "#7C5CFC" : "#9090B0",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {label}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Sidebar() {
  const location = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/influencers", label: "Influencers", icon: Users },
    { href: "/plans", label: "Plans", icon: Zap },
    { href: "/settings", label: "Settings", icon: SettingsIcon },
    { href: "/dashboard/buy-credits", label: "Buy Credits", icon: ShoppingCart },
  ];

  return (
    <aside className="w-64 border-r border-border bg-sidebar hidden md:flex flex-col sticky top-16 h-[calc(100vh-4rem)]">
      <div className="p-4 flex-1">
        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            const isActive =
              location === link.href ||
              (link.href !== "/dashboard" &&
                location.startsWith(link.href) &&
                link.href !== "/plans");
            return (
              <Link key={link.href} href={link.href}>
                <span
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <link.icon
                    className={cn(
                      "w-4 h-4 shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  {link.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-border">
        <div className="bg-muted rounded-xl p-4 border border-border">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-foreground">
            <Wand2 className="w-4 h-4 text-primary" />
            Quick Tips
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Create highly detailed prompts for better generation results. Specificity is key to
            consistent personas.
          </p>
        </div>
      </div>
    </aside>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-primary" />
              <span className="font-bold text-xl text-foreground">InfluenceAI</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
              The premier platform for creating, managing, and monetizing AI-powered digital
              personalities. Cinematic quality, zero friction.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Product</h4>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>
                <Link href="/plans" className="hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="hover:text-primary transition-colors">
                  Get Started
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} InfluenceAI Studio. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function AuthGuard({
  children,
  requireAuth = true,
}: {
  children: React.ReactNode;
  requireAuth?: boolean;
}) {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !session) {
        router.replace("/auth/login");
      } else if (!requireAuth && session) {
        router.replace("/dashboard");
      }
    }
  }, [session, isLoading, requireAuth, router]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (requireAuth && !session) return null;
  if (!requireAuth && session) return null;

  return <>{children}</>;
}

export function AppLayout({
  children,
  withSidebar = true,
  darkMode = false,
}: {
  children: React.ReactNode;
  withSidebar?: boolean;
  darkMode?: boolean;
}) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "min-h-[100dvh] flex flex-col bg-background text-foreground selection:bg-primary/30",
        !darkMode && "light-theme"
      )}
    >
      <Navbar />
      <div className="flex-1 flex w-full">
        {withSidebar && <Sidebar />}
        <main
          className={cn(
            "flex-1 flex flex-col min-w-0 w-full overflow-x-hidden",
            withSidebar ? "md:max-w-[calc(100vw-16rem)] pb-20 md:pb-0" : "max-w-full"
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      {!withSidebar && <Footer />}
      {withSidebar && <BottomNav />}
    </div>
  );
}
