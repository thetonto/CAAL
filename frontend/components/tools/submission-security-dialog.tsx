'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Warning, CheckCircle, ShieldCheck } from '@phosphor-icons/react';
import type { SanitizationResult } from '@/lib/workflow-sanitizer';

interface SubmissionSecurityDialogProps {
  open: boolean;
  result: SanitizationResult | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SubmissionSecurityDialog({
  open,
  result,
  onConfirm,
  onCancel,
}: SubmissionSecurityDialogProps) {
  if (!result) return null;

  const { detected, warnings } = result;
  const hasSecrets =
    detected.secrets_stripped.api_keys +
      detected.secrets_stripped.tokens +
      detected.secrets_stripped.passwords >
    0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Warning className="h-6 w-6 text-amber-500" />
            Security Check Complete
          </DialogTitle>
          <DialogDescription>
            Your workflow has been analyzed. Review what will be submitted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Secrets Stripped Warning */}
          {hasSecrets && (
            <Alert variant="destructive">
              <Warning className="h-4 w-4" />
              <AlertDescription>
                <strong>Secrets detected and removed:</strong>
                <ul className="mt-2 ml-4 list-disc space-y-1">
                  {detected.secrets_stripped.api_keys > 0 && (
                    <li>{detected.secrets_stripped.api_keys} API key(s)</li>
                  )}
                  {detected.secrets_stripped.tokens > 0 && (
                    <li>{detected.secrets_stripped.tokens} bearer token(s)</li>
                  )}
                  {detected.secrets_stripped.passwords > 0 && (
                    <li>{detected.secrets_stripped.passwords} password(s)</li>
                  )}
                </ul>
                <p className="mt-2 text-sm">
                  These were automatically stripped. Please remove them from your n8n workflow before resubmitting.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* URLs Detected */}
          {detected.variables.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">
                URLs detected (will be parameterized):
              </h4>
              <div className="bg-muted rounded-md p-3 space-y-1 text-sm">
                {detected.variables.map((v, idx) => (
                  <div key={idx} className="font-mono">
                    <span className="text-muted-foreground">{v.example}</span>
                    {' → '}
                    <span className="text-primary">${'{' + v.name + '}'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Credentials Detected */}
          {detected.credentials.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Credentials detected:</h4>
              <div className="bg-muted rounded-md p-3 space-y-1 text-sm">
                {detected.credentials.map((c, idx) => (
                  <div key={idx}>
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground ml-2">
                      ({c.credential_type})
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Credential IDs will be nullified. Users will map their own credentials when installing.
              </p>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Warning className="h-4 w-4 text-amber-500" />
                Warnings:
              </h4>
              <ul className="bg-amber-50 dark:bg-amber-950/20 rounded-md p-3 space-y-1 text-sm list-disc ml-4">
                {warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Privacy Guarantee */}
          <Alert>
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <strong className="text-green-600 dark:text-green-400">
                Your secrets never leave your network.
              </strong>
              <p className="mt-2 text-sm">
                Sanitization happens locally in your browser before submission. Only the cleaned workflow will be transmitted to the registry.
              </p>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={hasSecrets}>
            {hasSecrets ? 'Fix Workflow First' : 'Continue to Submission Form'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
