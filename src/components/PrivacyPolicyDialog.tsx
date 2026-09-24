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
      className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-neutral-200 text-neutral-800 animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="privacy-dialog-title"
                className="text-base font-semibold leading-tight text-neutral-900">
                Privacy Policy
              </h2>
              <p className="text-xs text-neutral-500">
                100% Local-First • No Tracking • No Telemetry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close privacy policy"
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto py-4 pr-1 space-y-3.5 text-xs text-neutral-600 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-neutral-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Card 1: Local Storage Only */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/70 space-y-1.5">
            <div className="flex items-center gap-2 text-neutral-800 font-semibold text-xs">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Zero Personal Data Collected</span>
            </div>
            <p className="leading-relaxed text-neutral-600">
              PaperTab (PaperTab) does <strong>not</strong> collect, track,
              store, or sell any personal data, browsing history, or analytics.
              Everything you draw, sketch, or configure is saved strictly on
              your local device via{" "}
              <code className="px-1 py-0.5 bg-neutral-200/70 rounded text-[11px] font-mono text-neutral-800">
                chrome.storage.local
              </code>
              .
            </p>
            <p className="text-[11px] text-neutral-500">
              No tracking cookies or advertising identifiers are used.
            </p>
          </div>

          {/* Card 2: Network Requests */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/70 space-y-1.5">
            <div className="flex items-center gap-2 text-neutral-800 font-semibold text-xs">
              <Globe className="w-4 h-4 text-emerald-600" />
              <span>External Network Requests</span>
            </div>
            <p className="leading-relaxed text-neutral-600">
              The extension has zero background servers. The only network
              requests are initiated directly by you:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-neutral-600 leading-relaxed">
              <li>
                <strong>Web Search:</strong> Submitting a query navigates
                directly to your chosen provider (Google, DuckDuckGo, Bing, or
                Brave Search).
              </li>
              <li>
                <strong>Quick Link Icons:</strong> Shortcut tiles fetch website
                favicons via Google's public favicon service. No user identity
                is attached.
              </li>
            </ul>
          </div>

          {/* Card 3: Permissions */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/70 space-y-1.5">
            <div className="flex items-center gap-2 text-neutral-800 font-semibold text-xs">
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>Permissions Used</span>
            </div>
            <p className="leading-relaxed text-neutral-600">
              <code className="px-1 py-0.5 bg-neutral-200/70 rounded text-[11px] font-mono text-neutral-800">
                storage
              </code>{" "}
              &amp;{" "}
              <code className="px-1 py-0.5 bg-neutral-200/70 rounded text-[11px] font-mono text-neutral-800">
                unlimitedStorage
              </code>{" "}
              are used exclusively to save your drawings, scenes, and custom
              wallpaper images without browser quota limits.
            </p>
          </div>

          {/* Card 4: Payments & Future In-App Purchases */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/70 space-y-1.5">
            <div className="flex items-center gap-2 text-neutral-800 font-semibold text-xs">
              <CreditCard className="w-4 h-4 text-purple-600" />
              <span>Future In-App Purchases</span>
            </div>
            <p className="leading-relaxed text-neutral-600">
              Optional premium upgrades in the future will be processed through
              certified, industry-standard payment processors (such as Stripe or
              Chrome Web Store Payments). The extension never handles or stores
              credit card numbers or financial credentials.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-neutral-400">
            PaperTab &bull; Proprietary &amp; Confidential
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition-all shadow-sm active:scale-95 cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
