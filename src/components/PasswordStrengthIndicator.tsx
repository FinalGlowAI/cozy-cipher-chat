import { useMemo } from "react";
import { Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const requirements = useMemo(() => {
    return [
      { label: "At least 8 characters", met: password.length >= 8 },
      { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
      { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
      { label: "Contains number", met: /[0-9]/.test(password) },
    ];
  }, [password]);

  const strength = useMemo(() => {
    const metCount = requirements.filter(r => r.met).length;
    if (metCount === 0) return { level: 0, label: "", color: "" };
    if (metCount === 1) return { level: 1, label: "Weak", color: "bg-destructive" };
    if (metCount === 2) return { level: 2, label: "Fair", color: "bg-orange-500" };
    if (metCount === 3) return { level: 3, label: "Good", color: "bg-yellow-500" };
    return { level: 4, label: "Strong", color: "bg-green-500" };
  }, [requirements]);

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= strength.level ? strength.color : "bg-muted"
            }`}
          />
        ))}
      </div>
      
      {strength.label && (
        <p className={`text-xs ${
          strength.level <= 1 ? "text-destructive" :
          strength.level === 2 ? "text-orange-500" :
          strength.level === 3 ? "text-yellow-500" :
          "text-green-500"
        }`}>
          Password strength: {strength.label}
        </p>
      )}

      {/* Requirements list */}
      <div className="grid grid-cols-2 gap-1">
        {requirements.map((req) => (
          <div
            key={req.label}
            className={`flex items-center gap-1 text-xs ${
              req.met ? "text-green-500" : "text-muted-foreground"
            }`}
          >
            {req.met ? (
              <Check className="h-3 w-3" />
            ) : (
              <X className="h-3 w-3" />
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
