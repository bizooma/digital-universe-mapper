import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { AgenciesSection } from "@/components/landing/AgenciesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { CTASection } from "@/components/landing/CTASection";
import { ContactSection } from "@/components/landing/ContactSection";
import { useCanonicalUrl } from "@/hooks/useCanonicalUrl";
import { usePageMeta } from "@/hooks/usePageMeta";

const Index = () => {
  const [showPopup, setShowPopup] = useState(true);
  const navigate = useNavigate();

  useCanonicalUrl();
  usePageMeta({
    title: "Mapprr - Create Beautiful Visual Site Maps",
    description: "Mapprr helps you create stunning visual site maps for your website. Organize, plan, and share your site structure with ease."
  });

  return (
    <div className="min-h-screen bg-background">
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowPopup(false)}>
          <div className="relative max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowPopup(false)}
              className="absolute -top-3 -right-3 z-10 bg-background rounded-full p-1.5 shadow-lg hover:bg-muted transition-colors"
              aria-label="Close popup"
            >
              <X className="h-6 w-6 text-foreground" />
            </button>
            <img
              src={lifetimeDealImage}
              alt="Limited Lifetime Deal - $59 one-time payment"
              className="w-full rounded-lg cursor-pointer shadow-2xl"
              onClick={() => { setShowPopup(false); navigate("/lifetime"); }}
            />
          </div>
        </div>
      )}
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <AgenciesSection />
        <PricingSection />
        <CTASection />
        
        {/* Contact Section */}
        <ContactSection />
        
        {/* Google Map Section */}
        <section className="w-full">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3443.794538479383!2d-81.6591862!3d30.3283615!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88e5b7ba8c79c7b7%3A0x29d0d337ce7701c4!2sBizooma%20Digital%20Marketing%20Agency!5e0!3m2!1sen!2sus!4v1770321160723!5m2!1sen!2sus" 
            width="100%" 
            height="450" 
            style={{ border: 0 }} 
            allowFullScreen 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            title="Bizooma Digital Marketing Agency location on Google Maps"
            aria-label="Google Maps showing Bizooma Digital Marketing Agency location"
          />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
