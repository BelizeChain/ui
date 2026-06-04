'use client';

import * as React from 'react';
import { Warning } from 'phosphor-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './dialog';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Style the confirm button as a destructive (red) action. */
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

/**
 * Accessible confirmation dialog for destructive or sensitive actions.
 * Built on the Radix Dialog primitive, so it traps focus, closes on ESC,
 * and restores focus to the trigger on close.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <div className="flex items-start gap-3">
            {destructive && (
              <div className="shrink-0 w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
                <Warning size={22} weight="fill" className="text-red-400" aria-hidden="true" />
              </div>
            )}
            <div>
              <DialogTitle className="text-white">{title}</DialogTitle>
              {description && (
                <DialogDescription className="text-gray-400 mt-1">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="px-4 py-2 rounded-lg font-semibold text-gray-200 bg-gray-700/60 hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              'px-4 py-2 rounded-lg font-semibold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2',
              destructive
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-emerald-600 hover:bg-emerald-500'
            )}
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
            )}
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
