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
            <p className="text-sm">Last updated: {new Date().toLocaleDateString('en-US')}</p>

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
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Privacy and Security</h2>
              <p>
                OCX performs all encryption and decryption locally on your device. We do not store
                your encrypted messages, passwords, or encryption keys. However, you are solely
                responsible for maintaining the confidentiality of your passwords and any encrypted
                content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Service Availability</h2>
              <p>
                We strive to maintain the availability of OCX, but we do not guarantee uninterrupted
                access. The service may be temporarily unavailable due to maintenance, updates, or
                circumstances beyond our control.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Limitations</h2>
              <p>
                In no event shall OCX or its suppliers be liable for any damages arising out of the
                use or inability to use the materials on OCX, even if we have been notified of the
                possibility of such damage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Revisions</h2>
              <p>
                We may revise these terms of use at any time without notice. By using OCX, you are
                agreeing to be bound by the current version of these terms of use.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Governing Law</h2>
              <p>
                These terms and conditions are governed by and construed in accordance with
                applicable laws, and you irrevocably submit to the exclusive jurisdiction of the
                courts in that location.
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TermsOfUse;
