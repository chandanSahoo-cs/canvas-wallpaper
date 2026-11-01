import { hammingDistance } from "../assets/hash";
import { deleteAsset } from "../assets/db";
import { LibraryItem } from "./types";
import { Scene, useSceneStore } from "../../store/useSceneStore";
import { useAppStore } from "../../store/useAppStore";
import { ImageElement } from "../../elements/types";

export interface DuplicateGroup {
  groupId: string;
  items: LibraryItem[];
  minDistance: number;
}

class UnionFind {
  private parent = new Map<string, string>();

  find(x: string): string {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      return x;
    }
    let root = x;
    while (this.parent.get(root) !== root) {
      root = this.parent.get(root)!;
    }
    // Path compression
    let curr = x;
    while (curr !== root) {
      const next = this.parent.get(curr)!;
      this.parent.set(curr, root);
      curr = next;
    }
    return root;
  }

  union(x: string, y: string): void {
    const rootX = this.find(x);
    const rootY = this.find(y);
    if (rootX !== rootY) {
      this.parent.set(rootY, rootX);
    }
  }
}

/**
 * Finds all clusters of near-duplicate images based on dHash Hamming distance <= maxDistance.
 */
export function findDuplicateGroups(
  items: LibraryItem[],
  maxDistance: number = 5,
): DuplicateGroup[] {
  const images = items.filter(
    (it) => it.type === "image" && it.phash && it.phash.trim().length > 0,
  );

  if (images.length < 2) return [];

  const uf = new UnionFind();
  const pairDistances = new Map<string, number>();

  for (let i = 0; i < images.length; i++) {
    for (let j = i + 1; j < images.length; j++) {
      const a = images[i];
      const b = images[j];
      const dist = hammingDistance(a.phash!, b.phash!);
      if (dist <= maxDistance) {
        uf.union(a.id, b.id);
        const pairKey = [a.id, b.id].sort().join("::");
        pairDistances.set(pairKey, dist);
      }
    }
  }

  // Group items by root
  const groupsMap = new Map<string, LibraryItem[]>();
  for (const img of images) {
    const root = uf.find(img.id);
    const list = groupsMap.get(root) || [];
    list.push(img);
    groupsMap.set(root, list);
  }

  const result: DuplicateGroup[] = [];
  let clusterIdx = 1;

  for (const [root, clusterItems] of groupsMap.entries()) {
    // Only keep clusters with 2 or more items
    if (clusterItems.length >= 2) {
      // Find minimum pairwise distance in cluster
      let minD = Infinity;
      for (let i = 0; i < clusterItems.length; i++) {
        for (let j = i + 1; j < clusterItems.length; j++) {
          const pairKey = [clusterItems[i].id, clusterItems[j].id]
            .sort()
            .join("::");
          const d = pairDistances.get(pairKey);
          if (d !== undefined && d < minD) {
            minD = d;
          }
        }
      }

      // Sort items within cluster: most placed boards first, then newest
      clusterItems.sort((a, b) => {
        const placeDiff = (b.placements?.length || 0) - (a.placements?.length || 0);
        if (placeDiff !== 0) return placeDiff;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });

      result.push({
        groupId: `group-${clusterIdx++}`,
        items: clusterItems,
        minDistance: minD === Infinity ? 0 : minD,
      });
    }
  }

  return result;
}

export interface MergeSummary {
  keeperId: string;
  deletedIds: string[];
  repointedElementsCount: number;
  affectedBoards: { sceneId: string; sceneName: string; count: number }[];
}

/**
 * Merges duplicate assets into a chosen keeper:
 * 1. Repoints all elements and board backgrounds referencing duplicate assets to keeperId.
 * 2. Crucially preserves existing captions on every element.
 * 3. Deletes the duplicate assets from IndexedDB.
 * 4. Saves scenes to persistent storage.
 */
export async function mergeDuplicateAssets(
  keeperAssetId: string,
  duplicateAssetIds: string[],
  scenes: Scene[],
): Promise<MergeSummary> {
  const dupSet = new Set(duplicateAssetIds.filter((id) => id !== keeperAssetId));
  if (dupSet.size === 0) {
    return {
      keeperId: keeperAssetId,
      deletedIds: [],
      repointedElementsCount: 0,
      affectedBoards: [],
    };
  }

  let totalRepointed = 0;
  const boardCounts = new Map<string, { sceneName: string; count: number }>();

  // 1. Repoint scenes
  const updatedScenes: Scene[] = scenes.map((scene) => {
    let sceneRepointed = 0;
    const nextElements = scene.elements.map((el) => {
      if (el.type === "image") {
        const img = el as ImageElement;
        if (dupSet.has(img.assetId)) {
          sceneRepointed++;
          totalRepointed++;
          // Repoint assetId while keeping original caption, geometry, and styling
          return {
            ...img,
            assetId: keeperAssetId,
          };
        }
      }
      return el;
    });

    const nextBackground = { ...scene.background };
    if (
      nextBackground.type === "image" &&
      nextBackground.imageAssetId &&
      dupSet.has(nextBackground.imageAssetId)
    ) {
      sceneRepointed++;
      totalRepointed++;
      nextBackground.imageAssetId = keeperAssetId;
    }

    if (sceneRepointed > 0) {
      boardCounts.set(scene.id, {
        sceneName: scene.name,
        count: sceneRepointed,
      });
    }

    return {
      ...scene,
      elements: nextElements,
      background: nextBackground,
      updatedAt: Date.now(),
    };
  });

  // 2. Delete duplicate assets from IndexedDB
  const deletedIds: string[] = [];
  for (const aid of dupSet) {
    try {
      if (typeof indexedDB !== "undefined") {
        await deleteAsset(aid);
      }
      deletedIds.push(aid);
    } catch (err) {}
  }

  // 3. Update scene store and active canvas if currently viewing an affected board
  useSceneStore.setState({ scenes: updatedScenes });
  const activeSceneId = useSceneStore.getState().activeSceneId;
  const activeScene = updatedScenes.find((s) => s.id === activeSceneId);
  if (activeScene) {
    useAppStore.getState().setElements(activeScene.elements);
    useAppStore.getState().setBackground(activeScene.background);
  }
  await useSceneStore.getState().saveScenesToStorage();

  const affectedBoards = Array.from(boardCounts.entries()).map(
    ([sceneId, val]) => ({
      sceneId,
      sceneName: val.sceneName,
      count: val.count,
    }),
  );

  return {
    keeperId: keeperAssetId,
    deletedIds,
    repointedElementsCount: totalRepointed,
    affectedBoards,
  };
}
