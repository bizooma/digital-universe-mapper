import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useCanonicalUrl } from "@/hooks/useCanonicalUrl";
import { usePageMeta } from "@/hooks/usePageMeta";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";

export default function Terms() {
  useCanonicalUrl();
  usePageMeta({
    title: "Terms of Service",
    description: "Read Mapprr's Terms of Service to understand the rules and guidelines for using our visual site map platform."
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://mapprr.com" },
        { name: "Terms of Service", url: "https://mapprr.com/terms" },
      ]} />
      <Navbar />
      <main className="flex-1 container max-w-4xl py-16 px-4">
        <h1 className="text-3xl font-bold text-foreground mb-8">Terms of Service</h1>
        
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">Last updated: February 6, 2026</p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using Mapprr ("the Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. Description of Service</h2>
            <p className="text-muted-foreground">
              Mapprr is a visual site mapping platform that allows users to create, customize, and share 
              interactive maps of their digital presence. The Service includes free and paid subscription tiers.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">3. User Accounts</h2>
            <p className="text-muted-foreground">
              You are responsible for maintaining the confidentiality of your account credentials and for 
              all activities that occur under your account. You must provide accurate and complete information 
              when creating an account.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Acceptable Use</h2>
            <p className="text-muted-foreground">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the rights of others</li>
              <li>Upload malicious content or engage in harmful activities</li>
              <li>Attempt to gain unauthorized access to the Service</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Intellectual Property</h2>
            <p className="text-muted-foreground">
              You retain ownership of the content you create using our Service. By using Mapprr, you grant 
              us a license to host and display your content as necessary to provide the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. Payment and Billing</h2>
            <p className="text-muted-foreground">
              Paid subscriptions are billed in advance on a monthly or annual basis. You may cancel your 
              subscription at any time, and cancellation will take effect at the end of the current billing period.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              To the fullest extent permitted by law, Mapprr and its parent company Bizooma, LLC shall not 
              be liable for any indirect, incidental, special, or consequential damages arising from your 
              use of the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these Terms at any time. We will notify users of significant 
              changes via email or through the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">9. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these Terms, please contact us at{" "}
              <a href="mailto:support@mapprr.com" className="text-primary hover:underline">
                support@mapprr.com
              </a>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}