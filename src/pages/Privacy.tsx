import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useCanonicalUrl } from "@/hooks/useCanonicalUrl";
import { usePageMeta } from "@/hooks/usePageMeta";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";

export default function Privacy() {
  useCanonicalUrl();
  usePageMeta({
    title: "Privacy Policy",
    description: "Learn how Mapprr collects, uses, and protects your personal information when you use our visual site map platform."
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://mapprr.com" },
        { name: "Privacy Policy", url: "https://mapprr.com/privacy" },
      ]} />
      <Navbar />
      <main className="flex-1 container max-w-4xl py-16 px-4">
        <h1 className="text-3xl font-bold text-foreground mb-8">Privacy Policy</h1>
        
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">Last updated: February 6, 2026</p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
            <p className="text-muted-foreground">
              We collect information you provide directly, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Account information (name, email address)</li>
              <li>Content you create (maps, links, custom branding)</li>
              <li>Payment information (processed securely via Stripe)</li>
              <li>Communications with our support team</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. Automatic Data Collection</h2>
            <p className="text-muted-foreground">
              When you use Mapprr, we automatically collect:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Usage data (pages visited, features used)</li>
              <li>Device information (browser type, operating system)</li>
              <li>IP address and approximate location</li>
              <li>Map view analytics (for your published maps)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">3. How We Use Your Information</h2>
            <p className="text-muted-foreground">
              We use your information to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide and improve the Service</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send important updates about your account</li>
              <li>Provide analytics for your published maps</li>
              <li>Respond to support requests</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Data Sharing</h2>
            <p className="text-muted-foreground">
              We do not sell your personal information. We may share data with:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Service providers (hosting, payment processing, analytics)</li>
              <li>Legal authorities when required by law</li>
              <li>Business partners with your consent</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Data Security</h2>
            <p className="text-muted-foreground">
              We rely on our infrastructure providers' standard security controls, including HTTPS/TLS
              for data in transit and managed authentication. We do not currently claim independent
              security certifications or third-party audits.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. Your Rights</h2>
            <p className="text-muted-foreground">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and data</li>
              <li>Export your data</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Cookies</h2>
            <p className="text-muted-foreground">
              We use cookies and similar technologies to maintain your session, remember preferences, 
              and analyze usage patterns. You can control cookie settings through your browser.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Children's Privacy</h2>
            <p className="text-muted-foreground">
              Mapprr is not intended for children under 13. We do not knowingly collect personal 
              information from children under 13.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">9. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy periodically. We will notify you of significant changes 
              via email or through the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">10. Contact Us</h2>
            <p className="text-muted-foreground">
              For privacy-related questions, contact us at{" "}
              <a href="mailto:privacy@mapprr.com" className="text-primary hover:underline">
                privacy@mapprr.com
              </a>
            </p>
            <p className="text-muted-foreground">
              Mapprr is operated by Bizooma, LLC.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}