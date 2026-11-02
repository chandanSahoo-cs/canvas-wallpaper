import React, { useEffect, useState } from "react";
import { Globe, X, Check, ArrowRight, Shield } from "lucide-react";
import {
  hasHostPermission,
  requestHostPermission,
  subscribeHostPermission,
} from "../lib/permissions";
import { useOnboardingStore } from "../store/useOnboardingStore";

const PROMPT_DISMISSED_KEY = "papertab_capture_prompt_dismissed";

export const WebCapturePromptToast: React.FC = () => {
  const isWelcomeOpen = useOnboardingStore((s) => s.isWelcomeOpen);
  const isTourActive = useOnboardingStore((s) => s.isTourActive);
  const hasCompletedTour = useOnboardingStore((s) => s.hasCompletedTour);

  const [isVisible, setIsVisible] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  // Subscribe to permission changes
  useEffect(() => {
    return subscribeHostPermission((granted) => {
      setHasPermission(granted);
      if (granted) {
        setIsVisible(false);
      }
    });
  }, []);

  // Show prompt after onboarding tour/welcome popup closes
  useEffect(() => {
    // If onboarding is still active, don't show yet
    if (isWelcomeOpen || isTourActive || !hasCompletedTour) {
      setIsVisible(false);
      return;
    }

    // Check if user already granted permission
    hasHostPermission().then((granted) => {
      if (granted) return;

      // Check if user previously dismissed this toast
      try {
        const dismissed = localStorage.getItem(PROMPT_DISMISSED_KEY) === "true";
        if (dismissed) return;
      } catch {}

      // Add a slight delay after welcome modal closes so it feels natural
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 700);

      return () => clearTimeout(timer);
    });
  }, [isWelcomeOpen, isTourActive, hasCompletedTour]);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem(PROMPT_DISMISSED_KEY, "true");
    } catch {}
  };

  const handleEnable = async () => {
    setIsRequesting(true);
    try {
      const granted = await requestHostPermission();
      if (granted) {
        setIsSuccess(true);
        try {
          localStorage.setItem(PROMPT_DISMISSED_KEY, "true");
        } catch {}
        setTimeout(() => {
          setIsVisible(false);
        }, 1500);
      }
    } finally {
      setIsRequesting(false);
    }
  };

  if (!isVisible || hasPermission) return null;

  return (
    <div
      role="region"
      aria-label="Web capture feature recommendation"
      className="fixed bottom-6 right-6 z-50 max-w-[340px] w-full bg-surface text-ink border-2 border-line shadow-hard rounded-sk-lg p-3.5 flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-200 select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-line/20">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-sk-sm bg-brand-blue text-on-accent border border-line flex items-center justify-center shrink-0">
            <Globe className="w-3.5 h-3.5" />
          </span>
          <span className="font-hand font-bold text-xs text-ink tracking-wide">
            Web Image Capture
          </span>
          <span className="text-[10px] font-hand font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-sk-sm bg-brand-green/20 text-brand-green border border-brand-green/40">
            Tip
          </span>
        </div>

        <button
          onClick={handleDismiss}
          title="Dismiss tip"
          className="p-1 rounded-sk-sm text-muted hover:text-ink hover:bg-paper transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body message */}
      {isSuccess ? (
        <div className="flex items-center gap-2 py-1 text-xs font-hand font-bold text-brand-green">
          <Check className="w-4 h-4 shrink-0" />
          <span>Web capture enabled! You can now right-click save on any site.</span>
        </div>
      ) : (
        <>
          <p className="text-xs font-sans text-muted leading-relaxed">
            Want to save images directly from protected websites like <strong className="text-ink">Pinterest</strong> and <strong className="text-ink">Instagram</strong>? Enable Web Capture for a seamless moodboard experience.
          </p>

          <div className="flex items-center gap-1.5 text-[10px] font-sans text-muted bg-paper p-1.5 rounded-sk border border-line/20">
            <Shield className="w-3 h-3 text-brand-blue shrink-0" />
            <span>100% on-device & private. Never sends data to servers.</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleEnable}
              disabled={isRequesting}
              className="flex-1 py-1.5 px-3 rounded-sk bg-brand-green text-on-accent border-2 border-line shadow-hard-sm font-hand font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-105 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer disabled:opacity-50"
            >
              <span>Enable Web Capture</span>
              <ArrowRight className="w-3 h-3" />
            </button>

            <button
              onClick={handleDismiss}
              className="py-1.5 px-2.5 rounded-sk font-hand text-xs text-muted hover:text-ink hover:bg-paper transition-colors cursor-pointer"
            >
              Maybe Later
            </button>
          </div>
        </>
      )}
    </div>
  );
};
