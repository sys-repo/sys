import { createRoot } from 'react-dom/client';

import { type t, Time, rx } from './common.ts';
import { PreloadPortal } from './ui.tsx';

export const render: t.Preload = async (children, options = {}) => {
  const life = rx.lifecycle();
  const { disposeAfter } = options;

  if (typeof document === 'undefined') {
    life.dispose();
    return life;
  }

  life.dispose$.subscribe(() => {
    root.unmount();
    document.body.removeChild(div);
  });

  /**
   * Render Portal:
   */
  const div = document.createElement('div');
  document.body.appendChild(div);
  const root = createRoot(div);
  root.render(<PreloadPortal {...options}>{children}</PreloadPortal>);

  // Finish up.
  if (disposeAfter !== undefined) await Time.delay(disposeAfter, life.dispose);
  return life;
};
