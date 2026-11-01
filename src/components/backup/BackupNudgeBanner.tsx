import React, { useState, useEffect } from "react";
import { Archive, X } from "lucide-react";
import {
  shouldShowBackupNudge,
  dismissBackupNudge,
} from "../../lib/storage/health";

interface BackupNudgeBannerProps {
  onOpenBackup: () => void;
}

export const BackupNudgeBanner: React.FC<BackupNudgeBannerProps> = ({
  onOpenBackup,
}) => {
  const [nudgeInfo, setNudgeInfo] = useState<{
    show: boolean;
    daysSinceBackup: number;
  }>({ show: false, daysSinceBackup: 0 });

  useEffect(() => {
    setNudgeInfo(shouldShowBackupNudge());
  }, []);

  if (!nudgeInfo.show) return null;

  const handleDismiss = () => {
    dismissBackupNudge();
    setNudgeInfo({ show: false, daysSinceBackup: 0 });
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[90vw] p-2.5 rounded-sk-lg bg-surface/95 text-ink border-2 border-line shadow-hard backdrop-blur-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 select-none">
      <div className="flex items-center gap-2.5 min-w-0">
        <Archive className="w-4 h-4 text-brand-blue shrink-0" />
        <span className="font-hand font-bold text-xs text-ink truncate">
          Last backup: {nudgeInfo.daysSinceBackup} days ago
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => {
            handleDismiss();
            onOpenBackup();
          }}
          className="px-2.5 py-1 rounded-sk bg-brand-green text-on-accent border border-line font-hand font-bold text-xs hover:brightness-105 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer shadow-hard-sm"
        >
          Export Now
        </button>
        <button
          onClick={handleDismiss}
          title="Dismiss for 7 days"
          aria-label="Dismiss reminder for 7 days"
          className="p-1 rounded-sk-sm hover:bg-paper text-ink/60 hover:text-ink cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
