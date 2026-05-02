"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useGetPlans, useSubscribePlan } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Zap, Check, ArrowRight, AlertCircle, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Register() {
  const router = useRouter();
  const { toast } = useToast();
  const { signUp, session, isLoading: isAuthLoading } = useAuth();
  const subscribeMutation = useSubscribePlan();
  const { data: plans, isLoading: isLoadingPlans } = useGetPlans();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<"register" | "confirm" | "plan">("register");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  // If user is already logged in and hasn't just signed up, redirect to dashboard
  useEffect(() => {
    if (!isAuthLoading && session && step === "register") {
      router.push("/dashboard");
    }
  }, [session, isAuthLoading, step, router]);

  // Loading state while checking auth
  if (isAuthLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsRegistering(true);
    setRegisterError(null);
    try {
      const { needsEmailConfirmation } = await signUp(values.email, values.password, values.name);
      if (needsEmailConfirmation) {
        setStep("confirm");
      } else {
        await queryClient.invalidateQueries();
        toast({ title: "Account created!" });
        setStep("plan");
      }
    } catch (error: any) {
      const msg = error?.message ?? "Failed to create account. Please try again.";
      setRegisterError(msg);
    } finally {
      setIsRegistering(false);
    }
  }

  function onSelectPlan(planId: string) {
    subscribeMutation.mutate({ data: { planId } }, {
      onSuccess: () => {
        toast({ title: "Plan selected — let's build your first influencer!" });
        router.push("/dashboard");
      },
      onError: (error: any) => {
        toast({
          title: "Failed to select plan",
          description: error?.message ?? "Please try again",
          variant: "destructive",
        });
      }
    });
  }

  const stepLabels: Record<typeof step, string> = {
    register: "Create Account",
    confirm: "Check Your Email",
    plan: "Choose Your Plan",
  };

  const stepSubtitles: Record<typeof step, string> = {
    register: "Join the next generation of digital creators.",
    confirm: "One last step — confirm your email to activate your account.",
    plan: "Select a plan that fits your creative ambitions.",
  };

  return (
    <AppLayout withSidebar={false}>
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden min-h-[calc(100vh-4rem)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

        <div className="w-full max-w-4xl relative z-10">
          <div className="flex flex-col items-center mb-8">
            <Link href="/" className="flex items-center gap-2 group mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <Zap className="w-6 h-6 text-primary" />
              </div>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">{stepLabels[step]}</h1>
            <p className="text-muted-foreground mt-2 text-center max-w-md">{stepSubtitles[step]}</p>
          </div>

          <AnimatePresence mode="wait">
            {step === "register" && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="max-w-md mx-auto"
              >
                <Card className="border-white/10 bg-card/60 backdrop-blur-xl shadow-2xl">
                  <CardContent className="pt-6">
                    {registerError && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{registerError}</AlertDescription>
                      </Alert>
                    )}
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Jane Creator"
                                  autoComplete="name"
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
                                  autoComplete="new-password"
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
                          disabled={isRegistering}
                        >
                          {isRegistering ? "Creating Account..." : "Continue to Plans"}
                          {!isRegistering && <ArrowRight className="w-4 h-4 ml-2" />}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex justify-center border-t border-white/5 pt-6">
                    <p className="text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <Link href="/auth/login" className="text-primary hover:underline font-medium">
                        Login
                      </Link>
                    </p>
                  </CardFooter>
                </Card>
              </motion.div>
            )}

            {step === "confirm" && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="max-w-md mx-auto"
              >
                <Card className="border-white/10 bg-card/60 backdrop-blur-xl shadow-2xl text-center">
                  <CardContent className="pt-10 pb-8 px-8">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                      <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold mb-3">Confirm Your Email</h2>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-2">
                      We sent a confirmation link to:
                    </p>
                    <p className="font-medium text-sm mb-6 text-primary">{form.getValues("email")}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                      Click the link in the email to activate your account, then come back here to log in.
                    </p>
                    <Link href="/auth/login">
                      <Button className="w-full bg-primary hover:bg-primary/90">Go to Login</Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === "plan" && (
              <motion.div
                key="plan"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {isLoadingPlans ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans?.map((plan, index) => (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card className={`h-full flex flex-col border-white/10 bg-card/60 backdrop-blur-xl ${plan.name.toLowerCase() === "pro" ? "border-primary shadow-[0_0_30px_rgba(168,85,247,0.2)]" : ""}`}>
                          <CardContent className="pt-6 flex-1 flex flex-col">
                            <div className="mb-4">
                              <h3 className="text-xl font-bold capitalize">{plan.name}</h3>
                              <div className="mt-2 flex items-baseline gap-1">
                                <span className="text-3xl font-bold">${plan.price}</span>
                                <span className="text-muted-foreground text-sm">/{plan.interval}</span>
                              </div>
                            </div>
                            <ul className="space-y-3 mt-4 text-sm flex-1">
                              <li className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                  <Check className="w-3 h-3 text-primary" />
                                </div>
                                <span>{plan.influencerLimit === -1 ? "Unlimited" : plan.influencerLimit} Influencers</span>
                              </li>
                              <li className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                  <Check className="w-3 h-3 text-primary" />
                                </div>
                                <span>{plan.imageLimit === -1 ? "Unlimited" : plan.imageLimit} Image Generations</span>
                              </li>
                              <li className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                  <Check className="w-3 h-3 text-primary" />
                                </div>
                                <span>{plan.videoLimit === -1 ? "Unlimited" : plan.videoLimit} Video Generations</span>
                              </li>
                              {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-3">
                                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                    <Check className="w-3 h-3 text-primary" />
                                  </div>
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                            <Button
                              className={`w-full mt-6 ${plan.name.toLowerCase() === "pro" ? "bg-primary hover:bg-primary/90" : ""}`}
                              variant={plan.name.toLowerCase() === "pro" ? "default" : "outline"}
                              onClick={() => onSelectPlan(plan.id)}
                              disabled={subscribeMutation.isPending}
                            >
                              {subscribeMutation.isPending ? "Selecting..." : "Select Plan"}
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
                <div className="mt-8 text-center">
                  <Button
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => router.push("/dashboard")}
                  >
                    Skip for now →
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}
