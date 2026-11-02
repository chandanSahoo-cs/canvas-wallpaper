import React, { useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Copy,
  FlipHorizontal,
  FlipVertical,
  Group,
  Lock,
  Trash2,
  Ungroup,
  Unlock,
  LayoutGrid,
  Columns3,
  Rows2,
  Columns2,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { CanvasElement } from "../../elements/types";
import { useAppStore } from "../../store/useAppStore";
import { ArrangeLayout } from "../../lib/arrange";

interface ElementActionsProps {
  selectedMembers: CanvasElement[];
  isLocked: boolean;
}

export const ElementActions: React.FC<ElementActionsProps> = ({
  selectedMembers,
  isLocked,
}) => {
  const [spacing, setSpacing] = useState<number>(20);

  const duplicateSelected = useAppStore((s) => s.duplicateSelected);
  const deleteSelected = useAppStore((s) => s.deleteSelected);
  const toggleLockSelected = useAppStore((s) => s.toggleLockSelected);
  const groupSelected = useAppStore((s) => s.groupSelected);
  const ungroupSelected = useAppStore((s) => s.ungroupSelected);
  const sendBackward = useAppStore((s) => s.sendBackward);
  const sendForward = useAppStore((s) => s.sendForward);
  const flipSelectedHorizontal = useAppStore((s) => s.flipSelectedHorizontal);
  const flipSelectedVertical = useAppStore((s) => s.flipSelectedVertical);
  const arrangeSelected = useAppStore((s) => s.arrangeSelected);

  const hasGroups = selectedMembers.some(
    (el) => (el.groupIds?.length ?? 0) > 0,
  );
  const canGroup = hasGroups || selectedMembers.length >= 2;

  const handleArrange = (layout: ArrangeLayout) => {
    arrangeSelected(layout, spacing);
  };

  return (
    <div className="pt-2.5 border-t border-line/20 flex flex-col gap-2">
      <div className="text-[10px] font-hand font-bold tracking-wider text-muted uppercase">
        Actions
      </div>
      <div className="grid grid-cols-4 gap-1">
        <button
          title="Duplicate (Ctrl+D)"
          onClick={duplicateSelected}
          className="p-1.5 rounded-sk bg-paper text-ink border-2 border-line/30 hover:border-line hover:bg-surface flex items-center justify-center cursor-pointer transition-all active:translate-x-[1px] active:translate-y-[1px]"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          title={isLocked ? "Unlock" : "Lock"}
          onClick={toggleLockSelected}
          className={cn(
            "p-1.5 rounded-sk border-2 flex items-center justify-center cursor-pointer transition-all active:translate-x-[1px] active:translate-y-[1px]",
            isLocked
              ? "bg-warning text-white border-line font-bold"
              : "bg-paper text-ink border-line/30 hover:border-line hover:bg-surface",
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
          className="p-1.5 rounded-sk bg-paper text-ink border-2 border-line/30 hover:bg-danger/10 hover:border-danger hover:text-danger flex items-center justify-center cursor-pointer transition-all active:translate-x-[1px] active:translate-y-[1px]"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <button
          title={hasGroups ? "Ungroup" : "Group"}
          onClick={hasGroups ? ungroupSelected : groupSelected}
          disabled={!canGroup}
          className="p-1.5 rounded-sk bg-paper text-ink border-2 border-line/30 hover:border-line hover:bg-surface disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-all active:translate-x-[1px] active:translate-y-[1px]"
        >
          {hasGroups ? (
            <Ungroup className="w-3.5 h-3.5" />
          ) : (
            <Group className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Auto-Arrange Layout (Grid, Masonry, Row, Column) */}
      {selectedMembers.length >= 2 && (
        <div data-tour="auto-arrange" className="pt-2 border-t border-line/20 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10px] font-hand font-bold tracking-wider text-muted uppercase">
            <span>Arrange Layout</span>
            <span className="font-mono text-[9px] text-muted">{spacing}px</span>
          </div>

          <div className="grid grid-cols-4 gap-1">
            <button
              title="Arrange in Grid"
              onClick={() => handleArrange("grid")}
              className="p-1.5 rounded-sk bg-paper text-ink border-2 border-line/30 hover:border-line hover:bg-surface flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all active:translate-x-[1px] active:translate-y-[1px]"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="text-[9px] font-hand">Grid</span>
            </button>
            <button
              title="Arrange in Masonry"
              onClick={() => handleArrange("masonry")}
              className="p-1.5 rounded-sk bg-paper text-ink border-2 border-line/30 hover:border-line hover:bg-surface flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all active:translate-x-[1px] active:translate-y-[1px]"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span className="text-[9px] font-hand">Masonry</span>
            </button>
            <button
              title="Arrange in Row"
              onClick={() => handleArrange("row")}
              className="p-1.5 rounded-sk bg-paper text-ink border-2 border-line/30 hover:border-line hover:bg-surface flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all active:translate-x-[1px] active:translate-y-[1px]"
            >
              <Rows2 className="w-3.5 h-3.5" />
              <span className="text-[9px] font-hand">Row</span>
            </button>
            <button
              title="Arrange in Column"
              onClick={() => handleArrange("column")}
              className="p-1.5 rounded-sk bg-paper text-ink border-2 border-line/30 hover:border-line hover:bg-surface flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all active:translate-x-[1px] active:translate-y-[1px]"
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span className="text-[9px] font-hand">Col</span>
            </button>
          </div>

          {/* Spacing control slider */}
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-[10px] font-hand text-muted shrink-0">Gap:</span>
            <input
              type="range"
              min="4"
              max="80"
              step="4"
              value={spacing}
              onChange={(e) => setSpacing(Number(e.target.value))}
              className="w-full accent-brand-blue cursor-pointer h-1.5 bg-paper rounded-sk border border-line/20"
            />
          </div>
        </div>
      )}

      {/* Layer arrange */}
      <div className="grid grid-cols-2 gap-1 font-hand">
        <button
          title="Send Backward"
          onClick={sendBackward}
          className="py-1 px-2 rounded-sk bg-paper text-ink border-2 border-line/30 hover:border-line hover:bg-surface flex items-center justify-center gap-1 text-[11px] font-bold cursor-pointer transition-all active:translate-x-[1px] active:translate-y-[1px]"
        >
          <ArrowDownToLine className="w-3.5 h-3.5" /> Back
        </button>
        <button
          title="Bring Forward"
          onClick={sendForward}
          className="py-1 px-2 rounded-sk bg-paper text-ink border-2 border-line/30 hover:border-line hover:bg-surface flex items-center justify-center gap-1 text-[11px] font-bold cursor-pointer transition-all active:translate-x-[1px] active:translate-y-[1px]"
        >
          <ArrowUpToLine className="w-3.5 h-3.5" /> Forward
        </button>
      </div>

      {/* Flip elements */}
      <div className="grid grid-cols-2 gap-1 font-hand">
        <button
          title="Flip Horizontal (Shift+H)"
          onClick={flipSelectedHorizontal}
          className="py-1 px-2 rounded-sk bg-paper text-ink border-2 border-line/30 hover:border-line hover:bg-surface flex items-center justify-center gap-1 text-[11px] font-bold cursor-pointer transition-all active:translate-x-[1px] active:translate-y-[1px]"
        >
          <FlipHorizontal className="w-3.5 h-3.5" /> Flip H
        </button>
        <button
          title="Flip Vertical (Shift+V)"
          onClick={flipSelectedVertical}
          className="py-1 px-2 rounded-sk bg-paper text-ink border-2 border-line/30 hover:border-line hover:bg-surface flex items-center justify-center gap-1 text-[11px] font-bold cursor-pointer transition-all active:translate-x-[1px] active:translate-y-[1px]"
        >
          <FlipVertical className="w-3.5 h-3.5" /> Flip V
        </button>
      </div>
    </div>
  );
};
