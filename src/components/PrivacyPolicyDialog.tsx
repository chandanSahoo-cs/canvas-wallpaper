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
                Local-First • No Tracking • No Telemetry
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
              <span>Local Storage & On-Device Assets</span>
            </div>
            <p className="leading-relaxed font-sans text-muted">
              PaperTab has no accounts, no analytics or telemetry, and no PaperTab servers; boards, images and notes are stored on your device and are never uploaded to PaperTab or anyone else. Everything you draw, sketch, or configure is saved on your local device via <code className="px-1 py-0.5 bg-surface border border-line/40 rounded-sk-sm text-[11px] font-mono text-ink">chrome.storage.local</code> (for board indices, inbox items, and widget layouts) and local browser <code className="px-1 py-0.5 bg-surface border border-line/40 rounded-sk-sm text-[11px] font-mono text-ink">IndexedDB</code> (for high-resolution images, thumbnails, and visual assets).
            </p>
            <p className="text-[11px] font-sans text-muted">
              No tracking cookies or advertising identifiers are used.
            </p>
          </div>

          {/* Card 2: Network Requests */}
          <div className="p-3.5 rounded-sk bg-paper border-2 border-line space-y-1.5">
            <div className="flex items-center gap-2 text-ink font-hand font-bold text-xs">
              <Globe className="w-4 h-4 text-brand-blue" />
              <span>Outbound Network Requests</span>
            </div>
            <p className="leading-relaxed font-sans text-muted">
              PaperTab has no proprietary servers and does not receive your data.
              The extension makes only specific outbound requests, listed honestly:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted font-sans pl-1">
              <li>
                <strong className="text-ink">Quick Links favicons:</strong> fetched from Google&apos;s favicon service (<code className="px-1 py-0.2 rounded-sk-sm bg-surface border border-line/30 font-mono text-[10px]">https://www.google.com/s2/favicons</code>), which reveals the linked site&apos;s domain to Google.
              </li>
              <li>
                <strong className="text-ink">Search engine queries:</strong> submitting a search sends your query directly to your chosen search engine.
              </li>
              <li>
                <strong className="text-ink">Web saves &amp; link previews:</strong> when you save an image, link, selection, or page (or resolve link previews), the extension fetches it directly from the original site. This uses optional host permissions requested only on opt-in.
              </li>
            </ul>
          </div>

          {/* Card 3: Permissions */}
          <div className="p-3.5 rounded-sk bg-paper border-2 border-line space-y-1.5">
            <div className="flex items-center gap-2 text-ink font-hand font-bold text-xs">
              <KeyRound className="w-4 h-4 text-brand-blue" />
              <span>Extension Permissions</span>
            </div>
            <p className="leading-relaxed font-sans text-muted">
              The extension requests only necessary permissions:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-muted font-sans pl-1">
              <li>
                <code className="px-1 py-0.2 rounded-sk-sm bg-surface border border-line/30 font-mono text-[10px]">
                  storage
                </code>{" "}
                &amp;{" "}
                <code className="px-1 py-0.2 rounded-sk-sm bg-surface border border-line/30 font-mono text-[10px]">
                  unlimitedStorage
                </code>{" "}
                — save wallpapers, scenes, and visual assets locally without quota limitations
              </li>
              <li>
                <code className="px-1 py-0.2 rounded-sk-sm bg-surface border border-line/30 font-mono text-[10px]">
                  contextMenus
                </code>{" "}
                — right-click menu items to save images, selected text, links, or pages to PaperTab
              </li>
              <li>
                <code className="px-1 py-0.2 rounded-sk-sm bg-surface border border-line/30 font-mono text-[10px]">
                  optional_host_permissions (https://*/*)
                </code>{" "}
                — requested only on opt-in if you enable saving images from any website; can be revoked in Settings at any time
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
