import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NeuralBackground } from "@/components/NeuralBackground";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AboutUs from "./pages/AboutUs";
import Disclaimer from "./pages/Disclaimer";
import TermsOfUse from "./pages/TermsOfUse";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import NotFound from "./pages/NotFound";
import EphemeralSpace from "./pages/EphemeralSpace";
import EphemeralRoom from "./pages/EphemeralRoom";
import ImageEncryption from "./pages/ImageEncryption";
import AdminDashboard from "./pages/AdminDashboard";
import Install from "./pages/Install";
import Subscription from "./pages/Subscription";
import Settings from "./pages/Settings";
import Features from "./pages/Features";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <NeuralBackground />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/install" element={<Install />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/terms" element={<TermsOfUse />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/ephemeral" element={<EphemeralSpace />} />
          <Route path="/room/:roomCode" element={<EphemeralRoom />} />
          <Route path="/image-encryption" element={<ImageEncryption />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/features" element={<Features />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
