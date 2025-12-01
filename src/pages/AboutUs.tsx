import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";
import { Footer } from "@/components/Footer";

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-surface opacity-50" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 flex-1 flex flex-col">
        <header className="border-b border-primary/20 backdrop-blur-xl bg-card/30">
          <div className="container mx-auto px-4 py-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              About OCX
            </h1>
          </div>

          <div className="space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Our Mission</h2>
              <p>
                At OCX, we believe that privacy is a fundamental right. Our mission is to provide
                military-grade encryption tools that are accessible to everyone, ensuring that your
                sensitive communications remain private and secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">What We Do</h2>
              <p>
                OCX specializes in client-side encryption technology. All encryption and decryption
                happens locally on your device, meaning your data never travels to our servers in an
                unencrypted state. This approach ensures maximum privacy and security for your
                communications.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Our Technology</h2>
              <p>
                We use industry-standard AES-256 encryption combined with secure key derivation
                functions. Our technology ensures the highest standards of security and
                transparency for your encrypted communications.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Why Choose OCX</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>100% client-side encryption - your data never leaves your device unencrypted</li>
                <li>No data storage - we don't store your messages or encryption keys</li>
                <li>Easy to use - powerful encryption made simple</li>
                <li>Offline capable - works without an internet connection</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
              <p>
                Have questions or need support? We're here to help. Reach out to us at{" "}
                <a
                  href="mailto:support@ocodx.store"
                  className="text-primary hover:underline font-semibold"
                >
                  support@ocodx.store
                </a>
              </p>
            </section>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default AboutUs;
