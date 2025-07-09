import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { api } from '@/lib/api';

interface EmailTestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignData: {
    subject: string;
    htmlContent: string;
    textContent?: string;
  };
  campaignId?: string;
}

export function EmailTestModal({ 
  open, 
  onOpenChange, 
  campaignData,
  campaignId 
}: EmailTestModalProps) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendTest = async () => {
    if (!email || !email.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSending(true);
    try {
      const { data } = await api.post('/campaigns/test-email', {
        to: email,
        subject: campaignData.subject,
        htmlContent: campaignData.htmlContent,
        textContent: campaignData.textContent,
        campaignId,
      });

      toast.success(data.message || `Test campaign sent to ${email}`);
      
      onOpenChange(false);
      setEmail('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to send test email");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Test Campaign
          </DialogTitle>
          <DialogDescription>
            Send a test version of this campaign to verify formatting and content.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="test@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !sending) {
                  handleSendTest();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendTest}
            disabled={sending || !email}
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Test
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}