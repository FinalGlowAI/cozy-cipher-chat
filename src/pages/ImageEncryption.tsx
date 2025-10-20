import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Camera, Image as ImageIcon, ArrowLeft, Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { encryptText, decryptText } from "@/lib/crypto";

const ImageEncryption = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageCode, setImageCode] = useState("");
  const [outputCode, setOutputCode] = useState("");
  const [decryptedImage, setDecryptedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleEncrypt = () => {
    if (!selectedImage) {
      toast.error("Please select an image first");
      return;
    }
    try {
      const encrypted = encryptText(selectedImage);
      setOutputCode(encrypted);
      toast.success("Image encrypted successfully!");
    } catch (error) {
      toast.error("Encryption failed. Please try again.");
    }
  };

  const handleDecrypt = () => {
    if (!imageCode.trim()) {
      toast.error("Please enter an image code");
      return;
    }
    try {
      const decrypted = decryptText(imageCode);
      if (!decrypted.startsWith("data:image")) {
        toast.error("Invalid image code. This code does not contain a valid image.");
        return;
      }
      setDecryptedImage(decrypted);
      toast.success("Image decrypted successfully!");
    } catch (error) {
      toast.error("Decryption failed. Please check your code.");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
              Convert images to secure codes - nothing is stored
            </p>
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
                    <img
                      src={selectedImage}
                      alt="Selected"
                      className="max-h-64 mx-auto rounded-lg"
                    />
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
                      Select an image to encrypt
                    </p>
                    <Label htmlFor="image-upload">
                      <div className="inline-block">
                        <Button asChild variant="secondary">
                          <span>Choose Image</span>
                        </Button>
                      </div>
                    </Label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum file size: 5MB
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleEncrypt}
                className="w-full"
                disabled={!selectedImage}
              >
                Encrypt Image
              </Button>

              {outputCode && (
                <div className="space-y-2">
                  <Label>Your Encrypted Code</Label>
                  <div className="relative">
                    <Textarea
                      value={outputCode}
                      readOnly
                      className="min-h-[120px] font-mono text-xs"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
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
                    Share this code to allow others to view your image
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Enter Image Code</Label>
                <Textarea
                  value={imageCode}
                  onChange={(e) => setImageCode(e.target.value)}
                  placeholder="Paste the encrypted image code here..."
                  className="min-h-[120px] font-mono text-xs"
                />
              </div>

              <Button onClick={handleDecrypt} className="w-full">
                Decrypt Image
              </Button>

              {decryptedImage && (
                <div className="border border-border rounded-lg p-4">
                  <Label className="mb-2 block">Decrypted Image</Label>
                  <img
                    src={decryptedImage}
                    alt="Decrypted"
                    className="max-w-full rounded-lg mx-auto"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageEncryption;
