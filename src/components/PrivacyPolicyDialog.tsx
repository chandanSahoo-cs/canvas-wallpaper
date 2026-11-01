import {
  CreditCard,
  Database,
  Globe,
  KeyRound,
  ShieldCheck,
  X,
} from "lucide-react";
import React, { useEffect } from "react";

interface PrivacyPolicyDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyDialog: React.FC<PrivacyPolicyDialogProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-60 bg-ink/60 flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-surface text-ink border-2 border-line rounded-sk-lg p-6 w-full max-w-lg shadow-hard max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b-2 border-line shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sk bg-paper border-2 border-line flex items-center justify-center text-ink shrink-0">
              <ShieldCheck className="w-4 h-4 text-brand-green" />
            </div>
            <div>
              <h2
                id="privacy-dialog-title"
                className="font-hand text-lg font-bold leading-tight text-ink"
              >
                Privacy Policy
              </h2>
              <p className="text-xs font-sans text-muted mt-0.5">
                100% Local-First • No Tracking • No Telemetry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close privacy policy"
            className="p-1 rounded-sk-sm text-ink/70 hover:text-ink hover:bg-paper border border-transparent hover:border-line/30 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto py-4 pr-1 space-y-3 text-xs text-ink">
          {/* Card 1: Local Storage & IndexedDB Only */}
          <div className="p-3.5 rounded-sk bg-paper border-2 border-line space-y-1.5">
            <div className="flex items-center gap-2 text-ink font-hand font-bold text-xs">
              <Database className="w-4 h-4 text-brand-blue" />
              <span>Zero Personal Data Collected & Local-Only Assets</span>
            </div>
            <p className="leading-relaxed font-sans text-muted">
              PaperTab does not collect, track, store, or sell any personal data,
              browsing history, or analytics. Everything you draw, sketch, or
              configure is saved strictly on your local device via{" "}
              <code className="px-1 py-0.5 bg-surface border border-line/40 rounded-sk-sm text-[11px] font-mono text-ink">
                chrome.storage.local
              </code>{" "}
              (for scene indices and widget layouts) and local browser{" "}
              <code className="px-1 py-0.5 bg-surface border border-line/40 rounded-sk-sm text-[11px] font-mono text-ink">
                IndexedDB
              </code>{" "}
              (for high-resolution images, thumbnails, and visual assets). Assets are stored exclusively on your device, never uploaded to any remote server or cloud, and PaperTab has zero telemetry or network egress.
            </p>
            <p className="text-[11px] font-sans text-muted">
              No tracking cookies or advertising identifiers are used.
            </p>
          </div>

          {/* Card 2: Network Requests */}
          <div className="p-3.5 rounded-sk bg-paper border-2 border-line space-y-1.5">
            <div className="flex items-center gap-2 text-ink font-hand font-bold text-xs">
              <Globe className="w-4 h-4 text-brand-blue" />
              <span>Network Requests</span>
            </div>
            <p className="leading-relaxed font-sans text-muted">
              PaperTab operates entirely offline within your browser. The only
              outbound web requests made are direct user-initiated actions:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-muted font-sans pl-1">
              <li>Web searches you explicitly submit through the Search bar</li>
              <li>Favicon loading for quick links you manually create</li>
            </ul>
          </div>

          {/* Card 3: Permissions */}
          <div className="p-3.5 rounded-sk bg-paper border-2 border-line space-y-1.5">
            <div className="flex items-center gap-2 text-ink font-hand font-bold text-xs">
              <KeyRound className="w-4 h-4 text-brand-blue" />
              <span>Minimal Permissions</span>
            </div>
            <p className="leading-relaxed font-sans text-muted">
              The extension requests only the minimum permissions required:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-muted font-sans pl-1">
              <li>
                <code className="px-1 py-0.2 rounded-sk-sm bg-surface border border-line/30 font-mono text-[10px]">
                  storage
                </code>{" "}
                — save wallpapers, scenes, and widget layout locally
              </li>
              <li>
                <code className="px-1 py-0.2 rounded-sk-sm bg-surface border border-line/30 font-mono text-[10px]">
                  unlimitedStorage
                </code>{" "}
                — prevent browser evicting your canvas drawings and IndexedDB assets
              </li>
            </ul>
          </div>

          {/* Card 4: Payments */}
          <div className="p-3.5 rounded-sk bg-paper border-2 border-line space-y-1.5">
            <div className="flex items-center gap-2 text-ink font-hand font-bold text-xs">
              <CreditCard className="w-4 h-4 text-brand-blue" />
              <span>Free & Open</span>
            </div>
            <p className="leading-relaxed font-sans text-muted">
              PaperTab is 100% free with no subscriptions, in-app purchases, or
              paywalled features.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t-2 border-line flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-sk bg-brand-green text-on-accent border-2 border-line shadow-hard font-hand font-bold text-xs hover:brightness-105 active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-pressed cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
