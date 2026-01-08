import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";

const Disclaimer = () => {
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
              Disclaimer
            </h1>
          </div>

          <div className="space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">General Information</h2>
              <p>
                The information provided by OCX is for general informational purposes only. All
                information on the platform is provided in good faith, however we make no
                representation or warranty of any kind, express or implied, regarding the accuracy,
                adequacy, validity, reliability, availability, or completeness of any information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Encryption Technology Disclaimer
              </h2>
              <p>
                While OCX uses industry-standard encryption methods, no encryption system is 100%
                impenetrable. Users should be aware that:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>The security of encrypted messages depends on the strength of your password</li>
                <li>Lost passwords cannot be recovered - encrypted data will be permanently inaccessible</li>
                <li>You are responsible for keeping your passwords and encrypted messages secure</li>
                <li>We cannot decrypt your messages - all encryption happens on your device</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Ephemeral Room Disclaimer
              </h2>
              <p>
                Ephemeral rooms are designed for temporary, private conversations. Users should understand:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>All messages are permanently deleted when all participants leave the room</li>
                <li>No message recovery is possible after deletion - this is by design</li>
                <li>Room creators can lock rooms to prevent new participants from joining</li>
                <li>Rooms automatically expire after 24 hours of creation</li>
                <li>We cannot recover any messages or room content under any circumstances</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Image Encryption Disclaimer
              </h2>
              <p>
                Image encryption features are subject to the following limitations:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>Encrypted images are stored locally in your browser storage</li>
                <li>Shareable 6-character codes expire based on user selection (1 hour, 1 day, 7 days, or 30 days)</li>
                <li>Expired codes cannot be recovered or extended</li>
                <li>Maximum image file size is 5MB</li>
                <li>Clearing browser data will delete locally stored encrypted images</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Credit and Subscription Disclaimer
              </h2>
              <p>
                OCX uses a credit-based system for accessing premium features:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>Credits are virtual currency with no cash value</li>
                <li>Credits earned through games are non-refundable</li>
                <li>Daily game progress resets every 24 hours</li>
                <li>Free users receive 5 free text encryptions/decryptions per day</li>
                <li>Credit costs: 2 credits per text operation, 5 for image encryption, 3 for image decryption, 10 for room creation</li>
                <li>Premium subscriptions provide unlimited access to all features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Game Disclaimer
              </h2>
              <p>
                Brain-training games within OCX are provided for earning credits:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>Games are for entertainment and credit-earning purposes only</li>
                <li>Performance may vary by device and browser</li>
                <li>Each game can only be won once per 24-hour period</li>
                <li>Game progress is stored locally and resets daily</li>
                <li>We make no claims about cognitive benefits from gameplay</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Limitation of Liability</h2>
              <p>
                Under no circumstance shall OCX have any liability to you for any loss or damage of
                any kind incurred as a result of the use of the platform or reliance on any
                information provided. Your use of the platform and your reliance on any information
                is solely at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Professional Disclaimer
              </h2>
              <p>
                OCX is not responsible for the content of encrypted messages, images, or ephemeral
                room conversations. The platform is a tool for encryption and secure communication only.
                Users are solely responsible for the content they encrypt, share, and communicate.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">External Links Disclaimer</h2>
              <p>
                The platform may contain links to external websites that are not provided or
                maintained by OCX. We do not guarantee the accuracy, relevance, timeliness, or
                completeness of any information on these external websites.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Changes to This Disclaimer</h2>
              <p>
                We may update our disclaimer from time to time. We will notify you of any changes by
                posting the new disclaimer on this page. You are advised to review this disclaimer
                periodically for any changes.
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Disclaimer;
