import { useState } from "react";
import { Menu, X, Home, Image, MessageSquare, Settings, Info, FileText, Shield, LogIn } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const MobileMenu = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { path: "/", label: "Text Encryption", icon: Home },
    { path: "/image-encryption", label: "Image Encryption", icon: Image },
    { path: "/ephemeral", label: "Ephemeral Rooms", icon: MessageSquare },
    { path: "/settings", label: "Settings", icon: Settings },
    { path: "/about", label: "About Us", icon: Info },
    { path: "/privacy", label: "Privacy Policy", icon: Shield },
    { path: "/terms", label: "Terms of Use", icon: FileText },
    { path: "/auth", label: "Sign In", icon: LogIn },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="lg:hidden fixed top-4 left-4 z-50">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="bg-background/95 backdrop-blur-sm shadow-lg"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-primary">OCX Menu</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Navigate your secure space
              </p>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 overflow-y-auto py-4">
              <div className="space-y-1 px-3">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        isActive(item.path)
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Footer */}
            <div className="p-6 border-t">
              <p className="text-xs text-center text-muted-foreground">
                OCX - Military-Grade Encryption
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
