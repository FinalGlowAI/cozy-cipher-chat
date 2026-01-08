import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-surface opacity-50" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10">
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
              <p className="mt-4">
                Our platform offers multiple privacy solutions including text encryption, image encryption
                with shareable codes, and ephemeral rooms for real-time private conversations that
                automatically delete when all participants leave.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Our Features</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-foreground">Text Encryption:</strong> AES-256 encryption with time-limited keys for enhanced security</li>
                <li><strong className="text-foreground">Image Encryption:</strong> Encrypt images and share them using secure 6-character codes with customizable expiration</li>
                <li><strong className="text-foreground">Ephemeral Rooms:</strong> Create private chat rooms that auto-delete all messages when participants leave</li>
                <li><strong className="text-foreground">Credit System:</strong> Earn credits by playing brain-training games to unlock additional features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Our Technology</h2>
              <p>
                We use industry-standard AES-256 encryption combined with secure key derivation
                functions. Our zero-knowledge architecture ensures that we never have access to your
                unencrypted data, passwords, or encryption keys. All cryptographic operations happen
                entirely within your browser.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Gamified Experience</h2>
              <p>
                OCX features a unique credit-based system where users can earn credits by playing
                engaging brain-training games including Memory Challenge, Symbol Match, and Flash Number.
                These credits can be used to access premium features like additional text encryptions,
                image encryption, and ephemeral room creation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Why Choose OCX</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>100% client-side encryption - your data never leaves your device unencrypted</li>
                <li>No data storage - we do not store your messages or encryption keys</li>
                <li>Easy to use - powerful encryption made simple</li>
                <li>Offline capable - works without an internet connection for text encryption</li>
                <li>Ephemeral rooms with auto-delete functionality for ultimate privacy</li>
                <li>Image encryption with expiring shareable codes</li>
                <li>Gamified experience - earn credits by playing brain games</li>
                <li>Time-limited encryption keys for enhanced security</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
              <p>
                Have questions or need support? We are here to help. Reach out to us at{" "}
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
    </div>
  );
};

export default AboutUs;
