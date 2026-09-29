import React from "react";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Copy,
  Group,
  Lock,
  Trash2,
  Ungroup,
  Unlock,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { CanvasElement } from "../../elements/types";
import { useAppStore } from "../../store/useAppStore";

interface ElementActionsProps {
  selectedMembers: CanvasElement[];
  isLocked: boolean;
}

export const ElementActions: React.FC<ElementActionsProps> = ({
  selectedMembers,
  isLocked,
}) => {
  const duplicateSelected = useAppStore((s) => s.duplicateSelected);
  const deleteSelected = useAppStore((s) => s.deleteSelected);
  const toggleLockSelected = useAppStore((s) => s.toggleLockSelected);
  const groupSelected = useAppStore((s) => s.groupSelected);
  const ungroupSelected = useAppStore((s) => s.ungroupSelected);
  const sendBackward = useAppStore((s) => s.sendBackward);
  const sendForward = useAppStore((s) => s.sendForward);

  const hasGroups = selectedMembers.some(
    (el) => (el.groupIds?.length ?? 0) > 0,
  );
  const canGroup = hasGroups || selectedMembers.length >= 2;

  return (
    <div className="pt-2 border-t border-neutral-100 flex flex-col gap-2">
      <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
        Actions
      </div>
      <div className="grid grid-cols-4 gap-1">
        <button
          title="Duplicate (Ctrl+D)"
          onClick={duplicateSelected}
          className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 flex items-center justify-center text-neutral-700 active:scale-95 transition-all"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          title={isLocked ? "Unlock" : "Lock"}
          onClick={toggleLockSelected}
          className={cn(
            "p-1.5 rounded-lg border flex items-center justify-center active:scale-95 transition-all",
            isLocked
              ? "bg-amber-50 border-amber-300 text-amber-700"
              : "border-neutral-200 hover:bg-neutral-50 text-neutral-700",
          )}
        >
          {isLocked ? (
            <Unlock className="w-3.5 h-3.5" />
          ) : (
            <Lock className="w-3.5 h-3.5" />
          )}
        </button>
        <button
          title="Delete (Del / Backspace)"
          onClick={deleteSelected}
          className="p-1.5 rounded-lg border border-neutral-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 flex items-center justify-center text-neutral-700 active:scale-95 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <button
          title={hasGroups ? "Ungroup" : "Group"}
          onClick={hasGroups ? ungroupSelected : groupSelected}
          disabled={!canGroup}
          className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-neutral-700 active:scale-95 transition-all"
        >
          {hasGroups ? (
            <Ungroup className="w-3.5 h-3.5" />
          ) : (
            <Group className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Layer arrange */}
      <div className="grid grid-cols-2 gap-1">
        <button
          title="Send Backward"
          onClick={sendBackward}
          className="py-1 px-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 flex items-center justify-center gap-1 text-neutral-700 text-[11px]"
        >
          <ArrowDownToLine className="w-3.5 h-3.5" /> Back
        </button>
        <button
          title="Bring Forward"
          onClick={sendForward}
          className="py-1 px-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 flex items-center justify-center gap-1 text-neutral-700 text-[11px]"
        >
          <ArrowUpToLine className="w-3.5 h-3.5" /> Front
        </button>
      </div>
    </div>
  );
};
