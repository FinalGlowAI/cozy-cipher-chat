import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
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
              Privacy Policy
            </h1>
          </div>

          <div className="space-y-6 text-muted-foreground">
            <p className="text-sm">Last updated: {new Date().toLocaleDateString()}</p>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                1. Information Collection and Use
              </h2>
              <p>
                OCX is designed with privacy as a fundamental principle. We collect minimal
                information necessary to provide our service:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>Email address (for account creation and authentication only)</li>
                <li>Usage statistics (anonymous, for service improvement)</li>
              </ul>
              <p className="mt-4">
                <strong className="text-foreground">We do NOT collect, store, or have access to:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Your encrypted messages or their content</li>
                <li>Your encryption passwords or keys</li>
                <li>The content you encrypt or decrypt</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                2. How We Use Your Information
              </h2>
              <p>The limited information we collect is used solely to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>Provide and maintain the OCX service</li>
                <li>Authenticate your account</li>
                <li>Improve and optimize the service</li>
                <li>Communicate important service updates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Data Storage and Security</h2>
              <p>
                All encryption and decryption operations happen locally in your browser. Your
                encrypted content never leaves your device in an unencrypted state. We employ
                industry-standard security measures to protect your account information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Client-Side Encryption</h2>
              <p>
                OCX uses client-side encryption, meaning all encryption and decryption happens on
                your device. We never have access to your encryption keys or unencrypted content.
                This "zero-knowledge" approach ensures maximum privacy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Third-Party Services</h2>
              <p>
                We do not sell, trade, or otherwise transfer your information to third parties. We
                may use trusted third-party services for hosting and analytics, but these services
                do not have access to your encrypted content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Cookies and Tracking</h2>
              <p>
                We use minimal cookies necessary for authentication and service functionality. We do
                not use tracking cookies for advertising purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>Access your account information</li>
                <li>Request deletion of your account</li>
                <li>Opt-out of non-essential communications</li>
                <li>Export your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Data Retention</h2>
              <p>
                We retain your email and account information only as long as your account is active.
                Upon account deletion, all associated data is permanently removed from our systems.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Children's Privacy</h2>
              <p>
                OCX is not intended for use by children under 13. We do not knowingly collect
                information from children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                10. Changes to This Privacy Policy
              </h2>
              <p>
                We may update our privacy policy from time to time. We will notify you of any
                changes by posting the new privacy policy on this page and updating the "Last
                updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. Contact Us</h2>
              <p>
                If you have any questions about this privacy policy, please contact us through our
                support channels.
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
