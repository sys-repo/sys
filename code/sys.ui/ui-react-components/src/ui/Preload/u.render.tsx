import { createRoot } from 'react-dom/client';
import { type t, Time, rx } from './common.ts';
import { PreloadPortal } from './ui.tsx';

export const render: t.Preload = async (children, op) => {
  const life = rx.lifecycle();
  const { size, lifetime, name } = wrangle.options(op);

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
  root.render(<PreloadPortal size={size} name={name} children={children} />);

  // Finish up.
  if (typeof lifetime === 'number') await Time.delay(lifetime, life.dispose);
  return life;
};

/**
 * Helpers
 */
const wrangle = {
  options(input?: t.PreloadOptions | t.Msecs): t.PreloadOptions {
    if (!input) return {};
    if (typeof input === 'number') return { lifetime: input };
    return input;
  },
} as const;
