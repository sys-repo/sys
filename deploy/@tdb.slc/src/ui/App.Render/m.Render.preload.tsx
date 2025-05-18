import { Fragment } from 'react';

import { type t, Obj, Preload, Timestamp } from './common.ts';
import { render } from './m.Render.stack.tsx';

/**
 * Ensure the specified ESM content modules have been dyanamically imported.
 */
export const preloadModule: t.AppRenderLib['preloadModule'] = async <T extends string>(
  state: t.AppSignals,
  factory: (flag: T) => Promise<t.Content | undefined>,
  content: T[],
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

/**
 * Preload timestamps.
 */
export const preloadTimestamps: t.AppRenderLib['preloadTimestamps'] = (content) => {
  if (!content) return;
  const elements = new Set<JSX.Element>();

  const render = (timestamp: string, fn: Function) => {
    const key = `preload-${timestamp}-${elements.size}`;
    const el = <Fragment key={key}>{fn()}</Fragment>;
    elements.add(el);
  };

  Obj.walk(content, (e) => {
    if (e.key === 'timestamps' && Obj.isRecord(e.value)) {
      Object.entries(e.value)
        .filter(([timestamp]) => Timestamp.isValid(timestamp))
        .forEach(([timestamp, value]) => {
          if (Obj.isRecord(value)) {
            Object.values(value)
              .filter((value) => typeof value === 'function')
              .forEach((fn) => render(timestamp, fn));
          }
        });
    }
  });

  const name = 'preload:timestamps';
  Preload.render(elements, { lifetime: 30_000, name });
};
