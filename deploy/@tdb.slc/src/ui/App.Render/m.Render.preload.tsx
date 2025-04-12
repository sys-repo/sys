import React from 'react';
import { createRoot } from 'react-dom/client';

import { type t, Time } from './common.ts';
import { PreloadPortal } from './m.Render.PreloadPortal.tsx';
import { render } from './m.Render.stack.tsx';

/**
 * Ensure the specified ESM content modules have been dyanamically imported.
 */
export const preload: t.AppRenderLib['preload'] = async <T extends string>(
  state: t.AppSignals,
  factory: (flag: T) => Promise<t.Content | undefined>,
  ...content: T[]
) => {
  if (typeof document === undefined) return;

  /**
   * Dynamic import of ESM:
   */
  const loading = content.map((flag) => factory(flag));
  const imports = (await Promise.all(loading)) as t.Content[];
  const elements = imports.map((content, index) => render({ index, content, state }));

  /**
   * Render Portal:
   */
  const div = document.createElement('div');
  document.body.appendChild(div);
  const root = createRoot(div);
  root.render(<PreloadPortal>{elements}</PreloadPortal>);

  // Clean up.
  Time.delay(1_000, () => {
    root.unmount();
    document.body.removeChild(div);
  });
};
