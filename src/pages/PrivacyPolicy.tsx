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
            <p className="text-sm">Last updated: January 8, 2026</p>

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
                <li>Credit balance and transaction history (for premium features)</li>
                <li>Daily usage counts (text encryptions/decryptions per day)</li>
                <li>Usage statistics (anonymous, for service improvement)</li>
              </ul>
              <p className="mt-4">
                <strong className="text-foreground">We do NOT collect, store, or have access to:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Your encrypted messages or their content</li>
                <li>Your encryption passwords or keys</li>
                <li>The content you encrypt or decrypt</li>
                <li>Messages sent in ephemeral rooms</li>
                <li>Encrypted image content</li>
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
                <li>Track credit balance for premium features</li>
                <li>Enforce daily usage limits for free accounts</li>
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
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Ephemeral Room Privacy</h2>
              <p>
                Ephemeral rooms provide the highest level of message privacy:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>Messages are encrypted end-to-end during transmission</li>
                <li>All messages are permanently deleted when the room empties</li>
                <li>No message history is retained on our servers</li>
                <li>Participant presence is visible in real-time to room members only</li>
                <li>Room codes are randomly generated and not linked to user identities</li>
                <li>Rooms automatically expire after 24 hours</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Image Encryption Privacy</h2>
              <p>
                Image encryption maintains strict privacy standards:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>Encrypted images are stored in local browser storage only</li>
                <li>6-character sharing codes are generated locally</li>
                <li>Automatic cleanup of expired images</li>
                <li>No server-side storage of unencrypted image content</li>
                <li>Encryption keys are never transmitted to our servers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Credit System Data</h2>
              <p>
                For the credit-based economy, we store:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>Credit balances associated with your account</li>
                <li>Transaction history for auditing purposes</li>
                <li>Daily usage counts to enforce free tier limits</li>
                <li>Game progress is stored locally in your browser and resets daily</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Content Moderation & Reports</h2>
              <p>
                To maintain a safe community, OCX provides content moderation features:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>User reports are submitted via email to our support team - no report data is stored in our database</li>
                <li>Blocked user lists are stored locally on your device (localStorage) and are not synced to our servers</li>
                <li>Client-side content filtering operates entirely in your browser - flagged content is never transmitted to us</li>
                <li>We may receive abuse reports containing limited context (room codes, user colors, message excerpts)</li>
              </ul>
              <p className="mt-4">
                This approach ensures your privacy while allowing us to respond to serious violations when reported.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Third-Party Services</h2>
              <p>
                We do not sell, trade, or otherwise transfer your information to third parties. We
                may use trusted third-party services for hosting, payment processing, and analytics,
                but these services do not have access to your encrypted content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Cookies and Local Storage</h2>
              <p>
                We use minimal cookies necessary for authentication and service functionality. We also use local storage for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>Game progress tracking</li>
                <li>Encrypted image storage</li>
                <li>User preferences</li>
                <li>Blocked user lists (for content moderation)</li>
              </ul>
              <p className="mt-4">We do not use tracking cookies for advertising purposes.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>Access your account information</li>
                <li>Request deletion of your account and all associated data</li>
                <li>Opt-out of non-essential communications</li>
                <li>Export your data (credit balance, transaction history)</li>
                <li>Clear locally stored data at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">12. Data Retention</h2>
              <p>
                We retain your email and account information only as long as your account is active.
                Upon account deletion, all associated data is permanently removed from our systems.
                Ephemeral room messages are deleted immediately when rooms are vacated.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">13. Children's Privacy</h2>
              <p>
                OCX is not intended for use by children under 13. We do not knowingly collect
                information from children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                14. Changes to This Privacy Policy
              </h2>
              <p>
                We may update our privacy policy from time to time. We will notify you of any
                changes by posting the new privacy policy on this page and updating the "Last
                updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">15. Contact Us</h2>
              <p>
                If you have any questions about this privacy policy or to report privacy concerns, please contact us at{" "}
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

export default PrivacyPolicy;
