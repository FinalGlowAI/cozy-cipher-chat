import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Copy, Share2, Lock, Unlock, ShieldCheck, Clock, KeyRound, Coins, Eye, EyeOff, HelpCircle, GraduationCap, Zap, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { encryptText, decryptText, encryptWithKey, decryptWithKey, encryptKeyless, decryptKeyless, isKeylessEncrypted } from "@/lib/crypto";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { useDailyUsage } from "@/hooks/useDailyUsage";
import { useCredits } from "@/hooks/useCredits";
import { FeatureGateModal } from "./FeatureGateModal";
import { EncryptionTutorial } from "./EncryptionTutorial";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const TEXT_CREDIT_COST = 2;
const TUTORIAL_STORAGE_KEY = "ocx_encryption_tutorial_seen";

interface EncryptionPanelProps {
  onOpenGames?: () => void;
}

export const EncryptionPanel = ({ onOpenGames }: EncryptionPanelProps) => {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [secureMode, setSecureMode] = useState(false);
  const [keylessMode, setKeylessMode] = useState(true);
  const [decryptionKey, setDecryptionKey] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [keyValidity, setKeyValidity] = useState<string>("never");
  const [showGateModal, setShowGateModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [lastEncryptionType, setLastEncryptionType] = useState<"keyless" | "password" | "secure" | null>(null);
  const [detectedKeyless, setDetectedKeyless] = useState<boolean | null>(null);

  // Check if tutorial should be shown on first visit
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
  };

  const handleDontShowAgain = () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "permanent");
  };

  const { getRemainingFreeUses, isWithinFreeLimit, incrementUsage, FREE_LIMIT } = useDailyUsage();
  const { credits, spendCredits } = useCredits();

  const remainingEncrypts = getRemainingFreeUses("text_encryption");
  const remainingDecrypts = getRemainingFreeUses("text_decryption");

  const handleProcess = async () => {
    if (!inputText.trim()) {
      toast.error("Please enter some text first");
      return;
    }

    const feature = mode === "encrypt" ? "text_encryption" : "text_decryption";
    const withinFreeLimit = isWithinFreeLimit(feature);

    // Check if user needs credits
    if (!withinFreeLimit) {
      if (credits < TEXT_CREDIT_COST) {
        setShowGateModal(true);
        return;
      }
      
      // Spend credits
      const success = await spendCredits(TEXT_CREDIT_COST, feature);
      if (!success) {
        toast.error("Failed to process credits");
        return;
      }
      toast.info(`${TEXT_CREDIT_COST} credits used`);
    } else {
      // Increment free usage
      await incrementUsage(feature);
    }

    try {
      if (mode === "encrypt") {
        if (keylessMode) {
          // Keyless encryption - no password needed
          const encrypted = encryptKeyless(inputText);
          setOutputText(encrypted);
          setDecryptionKey("");
          setLastEncryptionType("keyless");
          toast.success("Encrypted successfully! No key needed to decrypt.");
          return;
        } else if (secureMode) {
          const expirationMinutes = keyValidity === "never" ? undefined : parseInt(keyValidity);
          const { encrypted, key } = await encryptWithKey(inputText, expirationMinutes);
          setOutputText(encrypted);
          setDecryptionKey(key);
          setLastEncryptionType("secure");
        } else {
          // Standard mode with user password
          if (!password || password.length < 8) {
            toast.error("Please enter a password (at least 8 characters)");
            return;
          }
          // Check for password strength
          const hasUppercase = /[A-Z]/.test(password);
          const hasLowercase = /[a-z]/.test(password);
          const hasNumber = /[0-9]/.test(password);
          
          if (!hasUppercase || !hasLowercase || !hasNumber) {
            toast.error("Password must contain uppercase, lowercase, and a number");
            return;
          }
          const encrypted = await encryptText(inputText, password);
          setOutputText(encrypted);
          setDecryptionKey("");
          setLastEncryptionType("password");
        }

        toast.success("Encrypted successfully!");
        return;
      }

      // Decrypt mode
      let decrypted = "";

      // Auto-detect keyless encrypted messages
      if (isKeylessEncrypted(inputText)) {
        decrypted = decryptKeyless(inputText);
        setOutputText(decrypted);
        setLastEncryptionType("keyless");
        toast.success("Decrypted successfully! (Keyless message)");
        return;
      }

      if (secureMode) {
        if (!decryptionKey.trim()) {
          toast.error("This message requires a decryption key. Please enter the key to decrypt.");
          return;
        }
        decrypted = await decryptWithKey(inputText, decryptionKey);
        setLastEncryptionType("secure");
      } else {
        // Standard mode with user password
        if (!password) {
          toast.error("Please enter your password to decrypt the message");
          return;
        }
        decrypted = await decryptText(inputText, password);
        setLastEncryptionType("password");
      }

      // If we don't get a real plaintext back, don't claim success.
      if (!decrypted || !decrypted.trim()) {
        throw new Error("Wrong password or corrupted data");
      }

      setOutputText(decrypted);
      toast.success("Decrypted successfully!");
    } catch (error) {
      if (error instanceof Error && error.message === "Decryption key has expired") {
        toast.error("Decryption key has expired and can no longer decrypt this message.");
      } else if (error instanceof Error && error.message === "Not a keyless encrypted message") {
        toast.error("This is not a keyless encrypted message. Please provide a password or key.");
      } else if (error instanceof Error && error.message.includes("Password must be at least")) {
        toast.error("Password must be at least 8 characters with uppercase, lowercase, and a number");
      } else if (error instanceof Error && error.message.includes("Password must contain")) {
        toast.error(error.message);
      } else if (error instanceof Error && error.message === "Wrong password or corrupted data") {
        toast.error("Wrong password! Please enter the correct password to decrypt this message.");
      } else if (error instanceof Error && error.message === "Invalid encrypted text or key") {
        toast.error("This message requires a decryption key. Please enable Secure Mode and enter the key.");
      } else {
        toast.error("Wrong password or invalid data. Please check your password and try again.");
      }
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
      {/* Mode Toggle with How it Works */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant={mode === "encrypt" ? "default" : "outline"}
          onClick={() => {
            setMode("encrypt");
            setDetectedKeyless(null);
          }}
          className="gap-2"
        >
          <Lock className="h-4 w-4" />
          Encrypt
        </Button>
        <Button
          variant={mode === "decrypt" ? "default" : "outline"}
          onClick={() => {
            setMode("decrypt");
            // Check if current input is keyless when switching to decrypt
            if (inputText.trim()) {
              setDetectedKeyless(isKeylessEncrypted(inputText.trim()));
            }
          }}
          className="gap-2"
        >
          <Unlock className="h-4 w-4" />
          Decrypt
        </Button>
        
        {/* Tutorial Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setShowTutorial(true)}
          title="Show Tutorial"
        >
          <GraduationCap className="h-5 w-5" />
        </Button>

        {/* How it Works Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" title="How it Works">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                How Text Encryption Works
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-primary mb-2">🔐 AES-256-GCM Encryption</h4>
                <p className="text-muted-foreground">
                  Your messages are protected using AES-256-GCM, an industry-standard encryption used by banks and governments.
                  This algorithm provides both confidentiality and integrity protection, ensuring your data cannot be read or tampered with.
                </p>
              </div>

              <div className="border-t border-primary/20 pt-4">
                <h4 className="font-semibold text-accent mb-2">⚡ Keyless Mode</h4>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>No password required to encrypt or decrypt</li>
                  <li>Quick obfuscation for casual sharing</li>
                  <li>Anyone with the encrypted text can decrypt it</li>
                  <li>Auto-detected during decryption</li>
                  <li>Best for: Quick sharing, non-sensitive messages</li>
                </ul>
              </div>
              
              <div className="border-t border-primary/20 pt-4">
                <h4 className="font-semibold text-primary mb-2">📝 Standard Mode</h4>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>You provide your own password</li>
                  <li>Password must be 8+ characters with uppercase, lowercase, and numbers</li>
                  <li>Same password encrypts and decrypts</li>
                  <li>You must remember and securely share the password</li>
                  <li>Best for: Personal encryption, trusted recipients</li>
                </ul>
              </div>
              
              <div className="border-t border-primary/20 pt-4">
                <h4 className="font-semibold text-primary mb-2">🛡️ Secure Mode</h4>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>System generates a unique cryptographic key</li>
                  <li>Optional time-based expiration (5 min to 12 hours)</li>
                  <li>Key can only be used once within validity period</li>
                  <li>Higher security for sensitive communications</li>
                  <li>Best for: Sensitive data, time-critical messages</li>
                </ul>
              </div>
              
              <div className="border-t border-primary/20 pt-4">
                <h4 className="font-semibold text-primary mb-2">✅ Best Practices</h4>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Use Keyless Mode only for non-sensitive messages</li>
                  <li>Never share passwords over the same channel as encrypted text</li>
                  <li>Use Secure Mode for highly sensitive data</li>
                  <li>Set short expiration times for maximum security</li>
                  <li>All encryption happens locally on your device</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Usage Counter */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm">
          <Coins className="h-4 w-4 text-yellow-500" />
          <span className="text-muted-foreground">
            {mode === "encrypt" 
              ? `${remainingEncrypts}/${FREE_LIMIT} free encryptions today`
              : `${remainingDecrypts}/${FREE_LIMIT} free decryptions today`
            }
          </span>
          {(mode === "encrypt" ? remainingEncrypts : remainingDecrypts) === 0 && (
            <span className="text-primary font-medium">• {TEXT_CREDIT_COST} credits/use</span>
          )}
          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-1"
            onClick={() => {
              setInputText("");
              setOutputText("");
              setPassword("");
              setDecryptionKey("");
              setDetectedKeyless(null);
              setLastEncryptionType(null);
              toast.success("Form cleared");
            }}
            title="Clear & Start Fresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Encryption Mode Selector - Only show in encrypt mode */}
      {mode === "encrypt" && (
        <Card className="p-4 backdrop-blur-xl bg-card/50 border-primary/20">
          {/* Keyless Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-accent" />
              <div>
                <Label htmlFor="keyless-mode" className="text-base font-medium">
                  Keyless Mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  Encrypt without password - anyone can decrypt
                </p>
              </div>
            </div>
            <Switch
              id="keyless-mode"
              checked={keylessMode}
              onCheckedChange={(checked) => {
                setKeylessMode(checked);
                if (checked) setSecureMode(false);
              }}
            />
          </div>

          {/* Secure Mode Toggle - Only show if keyless is off */}
          {!keylessMode && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-primary/20">
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
          )}
          
          {/* Password input for standard mode (not keyless, not secure) */}
          {!keylessMode && !secureMode && (
            <div className="mt-4 pt-4 border-t border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <KeyRound className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">Your Password</Label>
              </div>
              <div className="flex gap-2">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your secret password (min 8 characters)"
                  className="flex-1 bg-background/50 border-primary/30 focus:border-primary"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleCopy(password)}
                  disabled={!password}
                  title="Copy password"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleShare(password)}
                  disabled={!password}
                  title="Share password"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
              <PasswordStrengthIndicator password={password} />
              <p className="text-xs text-muted-foreground mt-2">
                You must use the same password to decrypt the message later.
              </p>
            </div>
          )}
          
          {/* Key Validity Selector - Only show with secure mode enabled */}
          {!keylessMode && secureMode && (
            <div className="mt-4 pt-4 border-t border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">Key Validity Duration</Label>
              </div>
              <RadioGroup value={keyValidity} onValueChange={setKeyValidity} className="grid grid-cols-3 gap-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="5" id="5min" />
                  <Label htmlFor="5min" className="text-sm cursor-pointer">5 min</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="15" id="15min" />
                  <Label htmlFor="15min" className="text-sm cursor-pointer">15 min</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="30" id="30min" />
                  <Label htmlFor="30min" className="text-sm cursor-pointer">30 min</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="60" id="1h" />
                  <Label htmlFor="1h" className="text-sm cursor-pointer">1 hour</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="720" id="12h" />
                  <Label htmlFor="12h" className="text-sm cursor-pointer">12 hours</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="never" id="never" />
                  <Label htmlFor="never" className="text-sm cursor-pointer">Never</Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </Card>
      )}

      {/* Decrypt Mode Options */}
      {mode === "decrypt" && (
        <Card className="p-4 backdrop-blur-xl bg-card/50 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <Label htmlFor="secure-mode-decrypt" className="text-base font-medium">
                  Secure Mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  Use decryption key instead of password
                </p>
              </div>
            </div>
            <Switch
              id="secure-mode-decrypt"
              checked={secureMode}
              onCheckedChange={setSecureMode}
            />
          </div>
          
          <p className="text-xs text-muted-foreground mt-3 p-2 bg-accent/10 rounded">
            💡 <strong>Tip:</strong> Keyless messages are auto-detected and decrypted without any password or key.
          </p>

          {/* Password input for standard decrypt mode */}
          {!secureMode && (
            <div className="mt-4 pt-4 border-t border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <KeyRound className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">Your Password</Label>
              </div>
              <div className="flex gap-2">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password to decrypt"
                  className="flex-1 bg-background/50 border-primary/30 focus:border-primary"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Input Panel */}
      <Card className="p-6 backdrop-blur-xl bg-card/50 border-primary/20 shadow-glow-primary">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">
            {mode === "encrypt" ? "Plain Text" : "Encrypted Text"}
          </Label>
          {mode === "decrypt" && detectedKeyless !== null && inputText.trim() && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              detectedKeyless 
                ? "bg-accent/20 text-accent border border-accent/30" 
                : "bg-muted text-muted-foreground border border-muted-foreground/30"
            }`}>
              {detectedKeyless ? (
                <>
                  <Zap className="h-3 w-3" />
                  Keyless - No password needed
                </>
              ) : (
                <>
                  <KeyRound className="h-3 w-3" />
                  Password required
                </>
              )}
            </span>
          )}
        </div>
        <Textarea
          value={inputText}
          onChange={(e) => {
            const newText = e.target.value;
            setInputText(newText);
            // Auto-detect keyless messages in decrypt mode
            if (mode === "decrypt" && newText.trim()) {
              setDetectedKeyless(isKeylessEncrypted(newText.trim()));
            } else {
              setDetectedKeyless(null);
            }
          }}
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

      {/* Process Button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleProcess}
          disabled={!inputText.trim()}
          className="px-8 gap-2 shadow-glow-primary"
        >
          {mode === "encrypt" ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
          OK - {mode === "encrypt" ? "Encrypt" : "Decrypt"} Message
        </Button>
      </div>

      {/* Output Panel */}
      <Card className="p-6 backdrop-blur-xl bg-card/50 border-accent/20 shadow-glow-accent">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">
              {mode === "encrypt" ? "Encrypted Text" : "Decrypted Text"}
            </Label>
            {outputText && lastEncryptionType && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                lastEncryptionType === "keyless" 
                  ? "bg-accent/20 text-accent border border-accent/30" 
                  : lastEncryptionType === "secure"
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-muted text-muted-foreground border border-muted-foreground/30"
              }`}>
                {lastEncryptionType === "keyless" && <Zap className="h-3 w-3" />}
                {lastEncryptionType === "secure" && <ShieldCheck className="h-3 w-3" />}
                {lastEncryptionType === "password" && <KeyRound className="h-3 w-3" />}
                {lastEncryptionType === "keyless" ? "Keyless" : lastEncryptionType === "secure" ? "Secure" : "Password"}
              </span>
            )}
          </div>
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

      {/* Feature Gate Modal */}
      <FeatureGateModal
        open={showGateModal}
        onOpenChange={setShowGateModal}
        featureName={mode === "encrypt" ? "Text Encryption" : "Text Decryption"}
        creditCost={TEXT_CREDIT_COST}
        currentCredits={credits}
        onPlayGames={() => onOpenGames?.()}
      />

      {/* Tutorial Overlay */}
      <EncryptionTutorial
        isVisible={showTutorial}
        onComplete={handleTutorialComplete}
        onDontShowAgain={handleDontShowAgain}
      />
    </div>
  );
};
