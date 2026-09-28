import { TextElement } from '../elements/types';
import { newId, randomSeed } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';

export function useTextEditing() {
  const editingText = useAppStore((s) => s.editingText);
  const setEditingText = useAppStore((s) => s.setEditingText);
  const setTool = useAppStore((s) => s.setTool);
  const elements = useAppStore((s) => s.elements);
  const setElements = useAppStore((s) => s.setElements);
  const setSelectedIds = useAppStore((s) => s.setSelectedIds);
  const pushHistory = useAppStore((s) => s.pushHistory);
  const updateElement = useAppStore((s) => s.updateElement);
  const saveToStorage = useAppStore((s) => s.saveToStorage);

  const handleCommitText = (newText: string) => {
    const text = newText.trimEnd();
    if (!editingText) return;

    if (editingText.elementId) {
      if (text) {
        pushHistory();
        updateElement(editingText.elementId, { text });
        setSelectedIds([editingText.elementId]);
        saveToStorage();
      } else {
        pushHistory();
        setElements(elements.filter((e) => e.id !== editingText.elementId));
        setSelectedIds([]);
        saveToStorage();
      }
    } else if (text) {
      const el: TextElement = {
        id: newId(),
        type: 'text',
        angle: editingText.angle || 0,
        locked: false,
        groupIds: [],
        x: editingText.canvasX,
        y: editingText.canvasY,
        text,
        fontSize: editingText.fontSize,
        fontFamily:
          editingText.fontFamily ||
          useAppStore.getState().currentFontFamily ||
          'handwritten',
        strokeColor: editingText.strokeColor,
        fillColor: 'transparent',
        strokeWidth: useAppStore.getState().currentStrokeWidth,
        opacity: useAppStore.getState().currentOpacity,
        seed: randomSeed(),
      };
      pushHistory();
      setElements([...elements, el]);
      setSelectedIds([el.id]);
      saveToStorage();
    }

    setEditingText(null);
    setTool('selection');
  };

  const handleCancelText = () => {
    setEditingText(null);
    setTool('selection');
  };

  return {
    editingText,
    handleCommitText,
    handleCancelText,
  };
}
