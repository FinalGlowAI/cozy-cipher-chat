import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Camera, Image as ImageIcon, ArrowLeft, Copy, Check, Clock, Info, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { storeImage, retrieveImage, cleanupExpiredImages, getStorageStats } from "@/lib/imageStorage";
import { useSubscription } from "@/hooks/useSubscription";
import { NeuralBackground } from "@/components/NeuralBackground";
import { UpgradeModal } from "@/components/UpgradeModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ImageEncryption = () => {
  const navigate = useNavigate();
  const { isPremium, loading: subscriptionLoading } = useSubscription();
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageCode, setImageCode] = useState("");
  const [outputCode, setOutputCode] = useState("");
  const [decryptedImage, setDecryptedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [validity, setValidity] = useState<string>("60"); // minutes
  const [storageStats, setStorageStats] = useState({ count: 0, size: 0 });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [shieldActive, setShieldActive] = useState(false);

  // Block non-premium users
  useEffect(() => {
    if (!subscriptionLoading && !isPremium) {
      setShowUpgradeModal(true);
    }
  }, [isPremium, subscriptionLoading]);
  useEffect(() => {
    // Cleanup expired images on mount
    cleanupExpiredImages();
    updateStorageStats();
  }, []);

  // Screenshot prevention / deterrence
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect common screenshot shortcuts
      const isScreenshot =
        e.key === "PrintScreen" ||
        e.key === "F12" ||
        (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4" || e.key === "5")) || // Mac screenshots
        (e.ctrlKey && e.key.toLowerCase() === "p") || // Print
        (e.metaKey && e.shiftKey && e.key.toLowerCase() === "s"); // Windows Snip & Sketch

      if (isScreenshot) {
        e.preventDefault();
        toast.error("Screenshots are disabled for security", {
          icon: <Shield className="h-4 w-4" />,
          description: "This protects your encrypted images",
        });
      }
    };

    const handleKeyUp = async (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        try {
          // Attempt to clear clipboard so OS screenshot cannot be pasted
          await navigator.clipboard.writeText("Screenshots disabled");
        } catch {}
      }
    };

    const handleVisibilityChange = () => {
      const hasSensitive = !!(selectedImage || decryptedImage);
      if (document.hidden && hasSensitive) {
        setShieldActive(true);
        toast.error("Screenshot attempt detected", { icon: <Shield className="h-4 w-4" /> });
      } else if (!document.hidden) {
        setShieldActive(false);
      }
    };

    const handleWindowBlur = () => {
      if (selectedImage || decryptedImage) setShieldActive(true);
    };
    const handleWindowFocus = () => setShieldActive(false);

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [selectedImage, decryptedImage]);

  const updateStorageStats = async () => {
    try {
      const stats = await getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error("Failed to get storage stats:", error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEncrypt = async () => {
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    if (!selectedImage) {
      toast.error("Please select an image first");
      return;
    }

    try {
      const expirationMinutes = validity === "never" ? null : parseInt(validity);
      const code = await storeImage(selectedImage, expirationMinutes);
      setOutputCode(code);
      await updateStorageStats();
      
      const validityNum = expirationMinutes || 0;
      const expiryText = validity === "never" 
        ? "never expires" 
        : `expires in ${validityNum >= 60 ? validityNum / 60 + "h" : validityNum + "min"}`;
      toast.success(`Image encrypted! Code ${expiryText}`);
    } catch (error) {
      toast.error("Encryption failed. Please try again.");
    }
  };

  const handleDecrypt = async () => {
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    if (!imageCode.trim()) {
      toast.error("Please enter an image code");
      return;
    }

    try {
      const imageData = await retrieveImage(imageCode);
      setDecryptedImage(imageData);
      toast.success("Image decrypted successfully!");
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Code not found") {
          toast.error("Invalid code. Please check and try again.");
        } else if (error.message === "Code has expired") {
          toast.error("This code has expired and is no longer valid.");
        } else {
          toast.error("Decryption failed. Please try again.");
        }
      }
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputCode);
      setCopied(true);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy code");
    }
  };

  const handleModeToggle = () => {
    setMode(mode === "encrypt" ? "decrypt" : "encrypt");
    setSelectedImage(null);
    setImageCode("");
    setOutputCode("");
    setDecryptedImage(null);
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="min-h-screen relative select-none">
      <NeuralBackground key="neural-bg" />
      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="bg-card rounded-lg shadow-xl p-8 border border-border">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Image Encryption
            </h1>
            <p className="text-muted-foreground">
              Get a 6-character code - stored locally in your browser
            </p>
            {storageStats.count > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {storageStats.count} image{storageStats.count !== 1 ? "s" : ""} stored ({formatSize(storageStats.size)})
              </p>
            )}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="mt-4">
                  <Info className="mr-2 h-4 w-4" />
                  How it Works
                </Button>
              </DialogTrigger>
              <DialogContent className="backdrop-blur-xl bg-card/95 border-primary/20">
                <DialogHeader>
                  <DialogTitle>How Image Encryption Works</DialogTitle>
                  <DialogDescription className="space-y-3 text-left pt-4">
                    <p>
                      <strong>📸 Upload Your Image:</strong> Select an image from your device or take a photo. All processing happens locally in your browser for maximum privacy.
                    </p>
                    <p>
                      <strong>⏰ Set Expiration:</strong> Choose how long the code should remain valid—from 5 minutes to never. The image is stored securely and will be automatically deleted after expiration.
                    </p>
                    <p>
                      <strong>🔑 Get a Unique Code:</strong> Receive a 6-character code that you can share. Anyone with this code can decrypt and view the image using this app.
                    </p>
                    <p>
                      <strong>🔓 Decrypt Anytime:</strong> Enter a valid code in decrypt mode to retrieve and view the encrypted image. Expired codes will no longer work.
                    </p>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center justify-center gap-4 mb-8">
            <Label htmlFor="mode-toggle" className="text-sm font-medium">
              {mode === "encrypt" ? "Encrypt Image" : "Decrypt Code"}
            </Label>
            <Switch
              id="mode-toggle"
              checked={mode === "decrypt"}
              onCheckedChange={handleModeToggle}
            />
          </div>

          {mode === "encrypt" ? (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                {selectedImage ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={selectedImage}
                        alt="Selected"
                        className={`max-h-64 mx-auto rounded-lg pointer-events-none ${shieldActive ? 'blur-md' : ''}`}
                        draggable="false"
                      />
                      {shieldActive && (
                        <div className="absolute inset-0 rounded-lg bg-background/60 backdrop-blur-sm flex items-center justify-center text-xs">
                          Protected while window is unfocused
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedImage(null)}
                    >
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center gap-2 text-muted-foreground">
                      <ImageIcon className="h-12 w-12" />
                      <Camera className="h-12 w-12" />
                    </div>
                    <p className="text-muted-foreground">
                      Take a photo or choose an image to encrypt
                    </p>
                    <div className="flex gap-3 justify-center flex-wrap">
                      <Label htmlFor="camera-capture">
                        <Button asChild variant="default">
                          <span className="gap-2">
                            <Camera className="h-4 w-4" />
                            Take Photo
                          </span>
                        </Button>
                      </Label>
                      <Label htmlFor="image-upload">
                        <Button asChild variant="secondary">
                          <span className="gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Choose from Gallery
                          </span>
                        </Button>
                      </Label>
                    </div>
                    <input
                      id="camera-capture"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum file size: 5MB · All processed locally
                    </p>
                  </div>
                )}
              </div>

              {selectedImage && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Code Validity
                  </Label>
                  <RadioGroup value={validity} onValueChange={setValidity}>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="5" id="5min" />
                        <Label htmlFor="5min" className="cursor-pointer">5 min</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="15" id="15min" />
                        <Label htmlFor="15min" className="cursor-pointer">15 min</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="30" id="30min" />
                        <Label htmlFor="30min" className="cursor-pointer">30 min</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="60" id="1h" />
                        <Label htmlFor="1h" className="cursor-pointer">1 hour</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="720" id="12h" />
                        <Label htmlFor="12h" className="cursor-pointer">12 hours</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="never" id="never" />
                        <Label htmlFor="never" className="cursor-pointer">Never</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              )}

              <Button
                onClick={handleEncrypt}
                className="w-full"
                disabled={!selectedImage}
              >
                Generate Code
              </Button>

              {outputCode && (
                <div className="space-y-2">
                  <Label>Your 6-Character Code</Label>
                  <div className="relative">
                    <Input
                      value={outputCode}
                      readOnly
                      className="text-center text-2xl font-bold tracking-wider"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-1/2 -translate-y-1/2 right-2"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this code to allow others to view your image on this browser
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Enter 6-Character Code</Label>
                <Input
                  value={imageCode}
                  onChange={(e) => setImageCode(e.target.value.toUpperCase())}
                  placeholder="e.g., K7X9A2"
                  className="text-center text-2xl font-bold tracking-wider uppercase"
                  maxLength={6}
                />
              </div>

              <Button onClick={handleDecrypt} className="w-full">
                Decrypt Image
              </Button>

              {decryptedImage && (
                <div className="border border-border rounded-lg p-4">
                  <Label className="mb-2 block">Decrypted Image</Label>
                  <div className="relative">
                    <img
                      src={decryptedImage}
                      alt="Decrypted"
                      className={`max-w-full rounded-lg mx-auto pointer-events-none ${shieldActive ? 'blur-md' : ''}`}
                      draggable="false"
                    />
                    {shieldActive && (
                      <div className="absolute inset-0 rounded-lg bg-background/60 backdrop-blur-sm flex items-center justify-center text-xs">
                        Protected while window is unfocused
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
    </div>
  );
};

export default ImageEncryption;
