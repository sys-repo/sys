import { type t, Preload } from './common.ts';
import { render } from './m.Render.stack.tsx';

/**
 * Ensure the specified ESM content modules have been dyanamically imported.
 */
export const preload: t.AppRenderLib['preload'] = async <T extends string>(
  state: t.AppSignals,
  factory: (flag: T) => Promise<t.Content | undefined>,
  ...content: T[]
) => {
  if (typeof document === 'undefined') return;

  /**
   * Dynamic import of ESM:
   */
  const loading = content.map((flag) => factory(flag));
  const imports = (await Promise.all(loading)) as t.Content[];
  const elements = imports.map((content, index) => render({ index, content, state }));

  /**
   * Render Portal:
   */
  Preload.render(elements, 5_000);
};
