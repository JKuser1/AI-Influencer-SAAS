"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout, AuthGuard } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Zap, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true);
    setLoginError(null);
    try {
      await signIn(values.email, values.password);
      await queryClient.invalidateQueries();
      router.push("/dashboard");
    } catch (error: any) {
      const msg = error?.message ?? "Invalid email or password. Please try again.";
      setLoginError(
        msg.toLowerCase().includes("invalid login")
          ? "Invalid email or password. Please check your credentials and try again."
          : msg.toLowerCase().includes("email not confirmed")
          ? "Please confirm your email address before logging in. Check your inbox for the confirmation link."
          : msg
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AuthGuard requireAuth={false}>
      <AppLayout withSidebar={false}>
        <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md relative z-10"
          >
            <div className="flex flex-col items-center mb-8">
              <Link href="/" className="flex items-center gap-2 group mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
              </Link>
              <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
              <p className="text-muted-foreground mt-2">Sign in to manage your virtual talent</p>
            </div>

            <Card className="border-white/10 bg-card/60 backdrop-blur-xl shadow-2xl">
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>Enter your credentials to continue</CardDescription>
              </CardHeader>
              <CardContent>
                {loginError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="creator@example.com"
                              autoComplete="email"
                              {...field}
                              className="bg-background/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              autoComplete="current-password"
                              {...field}
                              className="bg-background/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full mt-6 bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                      disabled={isPending}
                    >
                      {isPending ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-center border-t border-white/5 pt-6 mt-2">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link href="/auth/register" className="text-primary hover:underline font-medium">
                    Create one
                  </Link>
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
