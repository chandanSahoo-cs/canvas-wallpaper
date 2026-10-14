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
      className="fixed inset-0 z-60 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-neutral-200 text-neutral-800 animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-800 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="privacy-dialog-title"
                className="text-sm font-semibold leading-tight text-neutral-900"
              >
                Privacy Policy
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                100% Local-First • No Tracking • No Telemetry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close privacy policy"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto py-4 pr-1 space-y-3.5 text-xs text-neutral-600 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-neutral-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Card 1: Local Storage Only */}
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1.5">
            <div className="flex items-center gap-2 text-neutral-800 font-semibold text-xs">
              <Database className="w-4 h-4 text-neutral-700" />
              <span>Zero Personal Data Collected</span>
            </div>
            <p className="leading-relaxed text-neutral-600">
              PaperTab does <strong>not</strong> collect, track, store, or sell
              any personal data, browsing history, or analytics. Everything you
              draw, sketch, or configure is saved strictly on your local device
              via{" "}
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
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1.5">
            <div className="flex items-center gap-2 text-neutral-800 font-semibold text-xs">
              <Globe className="w-4 h-4 text-neutral-700" />
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

          {/* Card 3: Permissions Explanation */}
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1.5">
            <div className="flex items-center gap-2 text-neutral-800 font-semibold text-xs">
              <KeyRound className="w-4 h-4 text-neutral-700" />
              <span>Permissions Used</span>
            </div>
            <p className="leading-relaxed text-neutral-600">
              PaperTab requests the bare minimum permissions required for core
              functionality:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-neutral-600 leading-relaxed">
              <li>
                <code className="px-1 py-0.5 bg-neutral-200/70 rounded text-[11px] font-mono text-neutral-800">
                  storage
                </code>
                : To persist your drawings, multi-scene wallpapers, and widget
                preferences locally in your browser.
              </li>
            </ul>
          </div>

          {/* Card 4: Payments & Monetization */}
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1.5">
            <div className="flex items-center gap-2 text-neutral-800 font-semibold text-xs">
              <CreditCard className="w-4 h-4 text-neutral-700" />
              <span>Completely Free & Ad-Free</span>
            </div>
            <p className="leading-relaxed text-neutral-600">
              PaperTab does not display advertisements, sell sponsored search
              results, or accept payments inside the extension.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 shrink-0">
          <span className="text-[11px] text-neutral-400">
            Last updated: March 2026
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium transition-colors cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
