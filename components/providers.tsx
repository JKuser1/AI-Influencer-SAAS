"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { supabase } from "@/lib/supabase";
import ErrorBoundary from "@/components/error-boundary";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      setAuthTokenGetter(async () => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          return session?.access_token ?? null;
        } catch (error) {
          console.warn("[auth] Failed to get session:", error);
          return null;
        }
      });
    } catch (error) {
      console.warn("[auth] Failed to setup auth token getter:", error);
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
