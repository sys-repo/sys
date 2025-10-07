import type { t } from './common.ts';

/**
 * Helper for preventing unwanted drag-n-drop activations.
 */
export const DropGuard: t.DropGuard = (() => {
  const zones = new Set<HTMLElement>();
  let active = false;

  /**
   * Methods:
   */
  const onCapture = (e: DragEvent) => {
    // Is the event under an allowed zone?
    const ok = [...zones].some((z) => z.contains(e.target as Node));
    if (!ok) {
      e.preventDefault(); // Suppress page-level drop.
      e.dataTransfer!.dropEffect = 'none';
    }
  };

  const enableGlobal = () => {
    if (active) return;
    active = true;
    document.addEventListener('dragover', onCapture, true); // Capture phase.
    document.addEventListener('drop', onCapture, true);
  };

  const disableGlobal = () => {
    if (active && zones.size === 0) {
      document.removeEventListener('dragover', onCapture, true);
      document.removeEventListener('drop', onCapture, true);
      active = false;
    }
  };

  /**
   * API:
   */
  return {
    enable(zone) {
      zones.add(zone);
      enableGlobal();
    },
    disable(zone) {
      zones.delete(zone);
      disableGlobal();
    },
  };
})();
