import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, MessageSquare, ShieldAlert, CreditCard, Bug } from "lucide-react";
import ocxLogo from "@/assets/ocx-logo.png";

const Contact = () => {
  const navigate = useNavigate();

  const reasons = [
    {
      icon: ShieldAlert,
      title: "Security Concerns",
      description: "Report a vulnerability, suspicious activity, or any security-related issue with your account or encrypted data.",
    },
    {
      icon: CreditCard,
      title: "Billing & Subscription",
      description: "Questions about your subscription plan, credits, payments, or refund requests.",
    },
    {
      icon: Bug,
      title: "Bug Reports",
      description: "Encountered a problem? Let us know so we can fix it and improve your experience.",
    },
    {
      icon: MessageSquare,
      title: "Feature Requests",
      description: "Have an idea to make OcodX better? We'd love to hear your suggestions.",
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-surface opacity-30" />

      <div className="relative z-10">
        <header className="border-b border-primary/20 backdrop-blur-xl bg-card/30">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="text-lg font-semibold">Contact Us</span>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <img src={ocxLogo} alt="OcodX Logo" className="h-10 w-10" />
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Contact Us
            </h1>
          </div>

          <p className="text-muted-foreground text-lg mb-10 max-w-2xl">
            We're here to help. If you have questions, concerns, or feedback about OcodX, don't hesitate to reach out. Below are common reasons users contact us.
          </p>

          <div className="grid gap-6 sm:grid-cols-2 mb-12">
            {reasons.map((reason) => (
              <div
                key={reason.title}
                className="rounded-lg border border-primary/20 bg-card/50 backdrop-blur-sm p-6 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <reason.icon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">{reason.title}</h3>
                </div>
                <p className="text-muted-foreground text-sm">{reason.description}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-primary/20 bg-card/50 backdrop-blur-sm p-8 text-center space-y-4">
            <Mail className="h-8 w-8 text-primary mx-auto" />
            <h2 className="text-2xl font-bold">Get in Touch</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Send us an email and our team will get back to you within 24–48 hours.
            </p>
            <Button asChild size="lg" className="mt-2">
              <a href="mailto:support@ocodx.store">
                <Mail className="h-4 w-4 mr-2" />
                support@ocodx.store
              </a>
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Contact;
