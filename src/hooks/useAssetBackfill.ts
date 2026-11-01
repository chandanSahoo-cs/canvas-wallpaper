import { useEffect, useState } from "react";
import { backfillManager, BackfillProgress } from "../lib/assets/backfill";

export function useAssetBackfill() {
  const [progress, setProgress] = useState<BackfillProgress>(
    backfillManager.getProgress(),
  );

  useEffect(() => {
    return backfillManager.subscribe(setProgress);
  }, []);

  return {
    ...progress,
    pause: () => backfillManager.pause(),
    resume: () => backfillManager.resume(),
    cancel: () => backfillManager.cancel(),
    scanAndStart: () => backfillManager.scanAndStart(),
  };
}
