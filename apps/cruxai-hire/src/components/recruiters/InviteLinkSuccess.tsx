'use client';

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Check, Copy } from "lucide-react";

interface InviteLinkSuccessProps {
  link: string;
  copied: boolean;
  onCopy: () => void;
  onDone: () => void;
  recipient?: string;
}

export function InviteLinkSuccess({
  link,
  copied,
  onCopy,
  onDone,
  recipient,
}: InviteLinkSuccessProps) {
  return (
    <div className="space-y-4 py-4">
      <div className="rounded-md bg-muted p-4">
        <p className="text-sm text-muted-foreground mb-2">
          Share this link with {recipient ?? "the candidate"}:
        </p>
        <div className="flex items-center gap-2">
          <Input value={link} readOnly className="font-mono text-sm" />
          <Button type="button" variant="outline" size="icon" onClick={onCopy}>
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={onDone}>Done</Button>
      </DialogFooter>
    </div>
  );
}
