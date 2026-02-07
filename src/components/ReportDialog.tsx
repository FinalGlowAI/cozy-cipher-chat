import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Flag, Loader2 } from "lucide-react";

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId?: string;
  reportedUserColor?: string;
  roomCode?: string;
  messagePreview?: string;
}

const REPORT_REASONS = [
  { value: "harassment", label: "Harassment or Bullying" },
  { value: "spam", label: "Spam or Unwanted Content" },
  { value: "illegal", label: "Illegal Activity" },
  { value: "hate_speech", label: "Hate Speech" },
  { value: "threats", label: "Threats or Violence" },
  { value: "other", label: "Other" },
];

export const ReportDialog = ({
  isOpen,
  onClose,
  reportedUserId,
  reportedUserColor,
  roomCode,
  messagePreview,
}: ReportDialogProps) => {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Please select a reason for your report");
      return;
    }

    setSubmitting(true);

    try {
      // Privacy-respecting: Send report via email instead of storing in database
      // This creates a mailto link that opens the user's email client
      const subject = encodeURIComponent(`OCX Content Report - ${reason}`);
      const body = encodeURIComponent(
        `Report Details:\n` +
        `\nReason: ${REPORT_REASONS.find((r) => r.value === reason)?.label || reason}` +
        `\nRoom Code: ${roomCode || "N/A"}` +
        `\nUser Color: ${reportedUserColor || "N/A"}` +
        `\nMessage Preview: ${messagePreview ? messagePreview.substring(0, 100) + "..." : "N/A"}` +
        `\n\nAdditional Details:\n${details || "None provided"}` +
        `\n\n---\nThis report was submitted through the OCX app.`
      );

      // Open email client with pre-filled report
      window.open(`mailto:support@ocodx.store?subject=${subject}&body=${body}`, "_blank");

      toast.success("Report prepared! Please send the email to complete your report.");
      
      // Reset form
      setReason("");
      setDetails("");
      onClose();
    } catch (error) {
      console.error("Error preparing report:", error);
      toast.error("Failed to prepare report. Please email support@ocodx.store directly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            Report Content
          </DialogTitle>
          <DialogDescription>
            Report inappropriate content or user behavior. Your report will be sent to our support team via email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User indicator */}
          {reportedUserColor && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Reporting user:</span>
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: reportedUserColor }}
              />
            </div>
          )}

          {/* Reason selection */}
          <div className="space-y-2">
            <Label>Reason for report</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {REPORT_REASONS.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Additional details */}
          <div className="space-y-2">
            <Label htmlFor="details">Additional details (optional)</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any additional context..."
              rows={3}
              className="resize-none"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Reports are handled via email to protect your privacy. No report data is stored on our servers.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !reason}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Preparing...
              </>
            ) : (
              "Submit Report"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
