"use client";

import { AppLayout } from "@/components/layout";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Acceptance of Terms",
    body: [
      "By accessing or using InfluenceAI Studio (the \"Service\"), you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use the Service.",
      "We may update these terms from time to time. Continued use of the Service after changes are posted constitutes your acceptance of the revised terms.",
    ],
  },
  {
    title: "2. Eligibility",
    body: [
      "You must be at least 18 years old to create an account and use the Service. By using the Service, you represent and warrant that you meet this requirement and have the legal capacity to enter into these terms.",
    ],
  },
  {
    title: "3. Your Account",
    body: [
      "You are responsible for safeguarding your account credentials and for all activity that occurs under your account. Notify us immediately of any unauthorized access or suspected security breach.",
      "You agree to provide accurate, current, and complete information during registration and to keep it up to date.",
    ],
  },
  {
    title: "4. Acceptable Use",
    body: [
      "You agree not to use the Service to generate, distribute, or display content that is illegal, harmful, defamatory, harassing, hateful, sexually explicit involving minors, infringing on intellectual property, or violates the rights of others.",
      "You may not impersonate any real person without their consent, generate content depicting identifiable individuals without authorization, or attempt to bypass safety filters or rate limits.",
      "You may not reverse engineer, scrape, or interfere with the Service or its underlying systems.",
    ],
  },
  {
    title: "5. AI-Generated Content",
    body: [
      "The Service uses artificial intelligence to generate images, video, and other media based on your inputs. You are solely responsible for the prompts you submit and for any content you generate, publish, or distribute.",
      "Subject to your compliance with these terms, you retain ownership of the content you generate. You grant us a limited license to host, store, and process that content as needed to operate the Service.",
      "AI-generated content may contain inaccuracies or unexpected results. You are responsible for reviewing all output before using it publicly or commercially.",
    ],
  },
  {
    title: "6. Subscriptions, Credits & Billing",
    body: [
      "Certain features require a paid plan or credits. Prices, billing cycles, and credit allocations are described on the Pricing page and may change with notice.",
      "Credits and subscription fees are non-refundable except where required by law. Unused credits may expire as stated in your plan.",
      "If a payment fails, we may suspend or downgrade your account until the balance is resolved.",
    ],
  },
  {
    title: "7. Intellectual Property",
    body: [
      "The Service, including its software, branding, and design, is owned by InfluenceAI Studio and protected by intellectual property laws. We grant you a limited, non-exclusive, non-transferable license to use the Service in accordance with these terms.",
    ],
  },
  {
    title: "8. Termination",
    body: [
      "We may suspend or terminate your access to the Service at any time, with or without notice, if we believe you have violated these terms or for any other reason at our discretion.",
      "You may cancel your account at any time from your settings. Upon termination, your right to use the Service ends immediately.",
    ],
  },
  {
    title: "9. Disclaimers",
    body: [
      "The Service is provided \"as is\" and \"as available\" without warranties of any kind, whether express or implied. We do not warrant that the Service will be uninterrupted, error-free, or secure.",
    ],
  },
  {
    title: "10. Limitation of Liability",
    body: [
      "To the maximum extent permitted by law, InfluenceAI Studio shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or data, arising from your use of the Service.",
    ],
  },
  {
    title: "11. Governing Law",
    body: [
      "These terms are governed by and construed in accordance with applicable law, without regard to its conflict of laws principles. Any disputes shall be resolved in the courts of competent jurisdiction.",
    ],
  },
  {
    title: "12. Contact",
    body: [
      "If you have questions about these Terms of Service, please contact us through the support channel listed in your account settings.",
    ],
  },
];

export default function Terms() {
  const lastUpdated = "April 29, 2026";

  return (
    <AppLayout>
      <section className="py-20 md:py-28 bg-black text-white min-h-screen">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="mb-8 text-white/60 hover:text-white hover:bg-white/5 gap-2"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Button>
          </Link>

          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
            Terms of Service
          </h1>
          <p className="text-white/50 text-sm mb-12">
            Last updated: {lastUpdated}
          </p>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-10 space-y-10">
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <h2 className="text-xl md:text-2xl font-semibold mb-4 text-white">
                  {section.title}
                </h2>
                <div className="space-y-4">
                  {section.body.map((paragraph, i) => (
                    <p
                      key={i}
                      className="text-white/70 text-sm md:text-base leading-relaxed"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-white/40 text-xs text-center mt-10">
            By using InfluenceAI Studio, you acknowledge that you have read and
            agreed to these Terms of Service.
          </p>
        </div>
      </section>
    </AppLayout>
  );
}
