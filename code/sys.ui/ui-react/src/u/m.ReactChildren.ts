import { Children, isValidElement, useMemo } from 'react';
import type { t } from './common.ts';

export const ReactChildren: t.ReactChildrenLib = {
  useDeps: (children) => useMemo(() => ReactChildren.deps(children), [children]),
  deps(children) {
    const ids = Children.toArray(children)
      .map((child) => {
        // 1. React elements → explicit key or component name.
        if (isValidElement(child)) {
          const explicit = getExplicitKey(child.key);
          if (explicit) return explicit;
          const ctor = child.type as any;
          return ctor.displayName || ctor.name || String(ctor);
        }

        // 2. Primitive strings/numbers → include directly.
        if (typeof child === 'string' || typeof child === 'number') {
          return String(child);
        }

        // 3. Skip booleans, null, undefined, etc.
        return undefined;
      })
      .filter((v): v is string => v != null);

    return ids.join('|');
  },
};

/**
 * Strip any leading non‑alphanumeric chars from React’s internal key
 * escaping (e.g. “.0”, “.$foo”), then drop pure‑numeric strings
 * (the auto‑generated indices). Return the raw user key, or
 * <undefined> if there isn’t one.
 */
function getExplicitKey(key: React.Key | null): string | undefined {
  if (typeof key !== 'string') return undefined;

  let i = 0;
  const { length } = key;
  while (i < length) {
    const code = key.charCodeAt(i);
    const isAlnum =
      (code >= 48 && code <= 57) || // 0–9
      (code >= 65 && code <= 90) || // A–Z
      (code >= 97 && code <= 122); // a–z
    if (isAlnum) break;
    i++;
  }

  // Drop if empty or pure digits (auto‑index).
  const raw = key.slice(i);
  if (!raw || /^[0-9]+$/.test(raw)) return undefined;
  return raw;
}
