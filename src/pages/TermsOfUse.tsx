import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";

const TermsOfUse = () => {
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
              Terms of Use
            </h1>
          </div>

          <div className="space-y-6 text-muted-foreground">
            <p className="text-sm">Last updated: January 8, 2026</p>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using OCX, you accept and agree to be bound by the terms and
                provision of this agreement. If you do not agree to these terms, please do not use
                our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Use License</h2>
              <p>
                Permission is granted to temporarily use OCX for personal, non-commercial transitory
                viewing only. This is the grant of a license, not a transfer of title, and under
                this license you may not:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or public display</li>
                <li>Attempt to decompile or reverse engineer any software</li>
                <li>Remove any copyright or proprietary notations from the materials</li>
                <li>Transfer the materials to another person or mirror on any other server</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Responsibilities</h2>
              <p>As a user of OCX, you agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>Use the service only for lawful purposes</li>
                <li>Not use the service to encrypt illegal content</li>
                <li>Keep your passwords and encryption keys secure</li>
                <li>Not attempt to breach or test the security of the platform</li>
                <li>Not interfere with the proper working of the service</li>
                <li>Respect other users in ephemeral rooms and shared spaces</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Credit System Terms</h2>
              <p>OCX operates a credit-based system for accessing premium features:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>Free users receive 5 free text encryptions and 5 free decryptions per day</li>
                <li>Credits can be earned by playing brain-training games (Memory Challenge, Symbol Match, Flash Number)</li>
                <li>Credit costs: 2 credits per text operation (after free limit), 5 credits for image encryption, 3 credits for image decryption, 10 credits for ephemeral room creation</li>
                <li>Each game can only award credits once per 24-hour period</li>
                <li>Game progress and daily limits reset at midnight UTC</li>
                <li>Credits have no cash value and cannot be transferred between accounts</li>
                <li>Unused credits do not expire for active accounts</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Ephemeral Room Terms</h2>
              <p>Users of ephemeral rooms agree to the following:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>Room creation costs 10 credits (premium subscribers have unlimited access)</li>
                <li>Joining existing rooms is free for all users</li>
                <li>Room creators have the ability to lock rooms to prevent new participants</li>
                <li>All messages are permanently deleted when all participants leave</li>
                <li>Rooms automatically expire 24 hours after creation</li>
                <li>Users must not share room codes with unauthorized parties</li>
                <li>Content shared in rooms must comply with all applicable laws</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Content Moderation & Community Guidelines</h2>
              <p>
                OCX is committed to maintaining a safe environment for all users. The following content and behavior are strictly prohibited:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>Harassment, bullying, or intimidation of other users</li>
                <li>Hate speech, slurs, or discriminatory content</li>
                <li>Threats of violence or harm</li>
                <li>Sharing of illegal content, including child exploitation material</li>
                <li>Spam, scams, or fraudulent activity</li>
                <li>Impersonation of other users or entities</li>
                <li>Distribution of malware or malicious content</li>
              </ul>
              <p className="mt-4">
                <strong className="text-foreground">Reporting & Blocking:</strong> Users can report objectionable content or block other users directly within ephemeral rooms. Reports are sent to our support team for review. Blocked users' messages will be hidden from your view.
              </p>
              <p className="mt-4">
                <strong className="text-foreground">Consequences:</strong> Violation of these guidelines may result in account suspension or termination. Severe violations may be reported to appropriate authorities.
              </p>
              <p className="mt-4">
                <strong className="text-foreground">Contact:</strong> To report abuse or violations, email{" "}
                <a href="mailto:support@ocodx.store" className="text-primary hover:underline font-semibold">
                  support@ocodx.store
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Image Encryption Terms</h2>
              <p>Users of image encryption features agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>Maximum file size of 5MB per image</li>
                <li>Images are stored locally in browser storage</li>
                <li>Shareable codes expire according to selected duration (1 hour to 30 days)</li>
                <li>Expired codes cannot be recovered or reactivated</li>
                <li>Users are responsible for the content of encrypted images</li>
                <li>Do not use this feature to encrypt or share illegal content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Gaming Terms</h2>
              <p>Users who participate in credit-earning games agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>Play fairly without using automated tools or exploits</li>
                <li>Accept that game performance depends on device and browser capabilities</li>
                <li>Understand that game results and credit awards are final</li>
                <li>Not attempt to manipulate or exploit the gaming system</li>
                <li>Accept daily limits on game credit earnings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Privacy and Security</h2>
              <p>
                OCX performs all encryption and decryption locally on your device. We do not store
                your encrypted messages, passwords, or encryption keys. However, you are solely
                responsible for maintaining the confidentiality of your passwords and any encrypted
                content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Service Availability</h2>
              <p>
                We strive to maintain the availability of OCX, but we do not guarantee uninterrupted
                access. The service may be temporarily unavailable due to maintenance, updates, or
                circumstances beyond our control.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. Limitations</h2>
              <p>
                In no event shall OCX or its suppliers be liable for any damages arising out of the
                use or inability to use the materials on OCX, even if we have been notified of the
                possibility of such damage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">12. Revisions</h2>
              <p>
                We may revise these terms of use at any time without notice. By using OCX, you are
                agreeing to be bound by the current version of these terms of use.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">13. Governing Law</h2>
              <p>
                These terms and conditions are governed by and construed in accordance with
                applicable laws, and you irrevocably submit to the exclusive jurisdiction of the
                courts in that location.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">14. Contact</h2>
              <p>
                For questions about these terms or to report violations, contact us at{" "}
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

export default TermsOfUse;
