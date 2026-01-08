import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";

const RefundPolicy = () => {
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
              Refund Policy
            </h1>
          </div>

          <div className="space-y-6 text-muted-foreground">
            <p className="text-sm">Last updated: January 8, 2026</p>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">General Policy</h2>
              <p>
                At OCX, we strive to provide the best encryption service possible. We understand
                that circumstances may arise where you need to request a refund.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Subscription Eligibility</h2>
              <p className="mb-3">
                Refund requests for premium subscriptions may be considered under the following conditions:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Request is made within 14 days of the initial purchase</li>
                <li>Technical issues that prevent you from using the service</li>
                <li>Accidental duplicate purchases</li>
                <li>Service was not as described</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Credits Policy</h2>
              <p className="mb-3">
                Regarding credits earned and used within OCX:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Credits earned through gameplay are virtual rewards and are non-refundable</li>
                <li>Credits have no cash value and cannot be exchanged for money</li>
                <li>Credits cannot be transferred between accounts</li>
                <li>Spent credits cannot be recovered or refunded</li>
                <li>If your account is deleted, all credits are permanently lost</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">How to Request a Refund</h2>
              <p>
                To request a refund for a subscription purchase, please contact us at{" "}
                <a
                  href="mailto:support@ocodx.store"
                  className="text-primary hover:underline"
                >
                  support@ocodx.store
                </a>
                {" "}with your purchase details and reason for the refund request. We will review
                your request and respond within 5-7 business days.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Processing Time</h2>
              <p>
                Once approved, refunds will be processed within 7-10 business days and will be
                returned to the original payment method used for the purchase.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Non-Refundable Items</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Subscriptions that have been active for more than 14 days</li>
                <li>Partial month refunds for subscription services</li>
                <li>Credits earned through gameplay</li>
                <li>Credits spent on features (text encryption, image encryption, room creation)</li>
                <li>Free trial periods that have been used</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Subscription Cancellation</h2>
              <p className="mb-3">
                You can cancel your subscription at any time:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access will continue until the end of your current billing period</li>
                <li>No refund will be provided for the remaining time in your billing cycle</li>
                <li>You will retain access to basic free features after cancellation</li>
                <li>Any unused credits will remain available for use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
              <p>
                If you have any questions about our refund policy, please contact us at{" "}
                <a
                  href="mailto:support@ocodx.store"
                  className="text-primary hover:underline"
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

export default RefundPolicy;
