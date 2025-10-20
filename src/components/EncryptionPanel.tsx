import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Copy, Share2, Lock, Unlock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { encryptText, decryptText, encryptWithKey, decryptWithKey } from "@/lib/crypto";

interface EncryptionPanelProps {
  onActionPerformed: () => void;
  actionsRemaining: number;
}

export const EncryptionPanel = ({ onActionPerformed, actionsRemaining }: EncryptionPanelProps) => {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [secureMode, setSecureMode] = useState(false);
  const [decryptionKey, setDecryptionKey] = useState("");
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");

  useEffect(() => {
    if (inputText.trim()) {
      handleProcess();
    } else {
      setOutputText("");
      setDecryptionKey("");
    }
  }, [inputText, secureMode, mode]);

  const handleProcess = () => {
    if (!inputText.trim()) return;

    try {
      if (mode === "encrypt") {
        if (secureMode) {
          const { encrypted, key } = encryptWithKey(inputText);
          setOutputText(encrypted);
          setDecryptionKey(key);
        } else {
          const encrypted = encryptText(inputText);
          setOutputText(encrypted);
          setDecryptionKey("");
        }
        onActionPerformed();
      } else {
        if (secureMode && decryptionKey) {
          const decrypted = decryptWithKey(inputText, decryptionKey);
          setOutputText(decrypted);
        } else {
          const decrypted = decryptText(inputText);
          setOutputText(decrypted);
        }
        onActionPerformed();
      }
    } catch (error) {
      toast.error("Processing failed. Please check your input.");
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const handleShare = async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ text });
        toast.success("Shared successfully");
      } catch (error) {
        toast.error("Sharing cancelled");
      }
    } else {
      handleCopy(text);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Mode Toggle */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant={mode === "encrypt" ? "default" : "outline"}
          onClick={() => setMode("encrypt")}
          className="gap-2"
        >
          <Lock className="h-4 w-4" />
          Encrypt
        </Button>
        <Button
          variant={mode === "decrypt" ? "default" : "outline"}
          onClick={() => setMode("decrypt")}
          className="gap-2"
        >
          <Unlock className="h-4 w-4" />
          Decrypt
        </Button>
      </div>

      {/* Secure Mode Toggle */}
      <Card className="p-4 backdrop-blur-xl bg-card/50 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <Label htmlFor="secure-mode" className="text-base font-medium">
                Secure Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                Generate a unique key for enhanced security
              </p>
            </div>
          </div>
          <Switch
            id="secure-mode"
            checked={secureMode}
            onCheckedChange={setSecureMode}
          />
        </div>
      </Card>

      {/* Input Panel */}
      <Card className="p-6 backdrop-blur-xl bg-card/50 border-primary/20 shadow-glow-primary">
        <Label className="text-sm font-medium mb-2 block">
          {mode === "encrypt" ? "Plain Text" : "Encrypted Text"}
        </Label>
        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={mode === "encrypt" ? "Type your message here..." : "Paste encrypted text here..."}
          className="min-h-[150px] resize-none bg-background/50 border-primary/30 focus:border-primary"
        />
        {mode === "decrypt" && secureMode && (
          <div className="mt-4">
            <Label className="text-sm font-medium mb-2 block">Decryption Key</Label>
            <Textarea
              value={decryptionKey}
              onChange={(e) => setDecryptionKey(e.target.value)}
              placeholder="Paste your decryption key here..."
              className="min-h-[80px] resize-none bg-background/50 border-primary/30 focus:border-primary"
            />
          </div>
        )}
      </Card>

      {/* Output Panel */}
      <Card className="p-6 backdrop-blur-xl bg-card/50 border-accent/20 shadow-glow-accent">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">
            {mode === "encrypt" ? "Encrypted Text" : "Decrypted Text"}
          </Label>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleCopy(outputText)}
              disabled={!outputText}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleShare(outputText)}
              disabled={!outputText}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Textarea
          value={outputText}
          readOnly
          placeholder={mode === "encrypt" ? "Encrypted text will appear here..." : "Decrypted text will appear here..."}
          className="min-h-[150px] resize-none bg-background/50 border-accent/30"
        />
        {mode === "encrypt" && secureMode && decryptionKey && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Decryption Key</Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(decryptionKey)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              value={decryptionKey}
              readOnly
              className="min-h-[80px] resize-none bg-background/50 border-accent/30 font-mono text-sm"
            />
          </div>
        )}
      </Card>

      {/* Actions Remaining */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Free actions remaining today: <span className="font-bold text-primary">{actionsRemaining}</span>
        </p>
      </div>
    </div>
  );
};
