import type { t } from './common.ts';

/**
 * Pure selector: choose a default device index.
 */
export const selectDefaultDevice: t.SelectDefaultDevice = (items, prefs = {}) => {
  const kindOrder = prefs.kindOrder ?? (['videoinput', 'audioinput', 'audiooutput'] as const);
  const requireLabel = prefs.requireLabel ?? true;
  const match = prefs.labelMatch;

  const ranked = kindOrder.flatMap((kind) =>
    items.map((info, index) => ({ info, index })).filter((m) => m.info.kind === kind),
  );

  for (const { info, index } of ranked) {
    if (requireLabel && !info.label?.trim()) continue;
    if (match && !match(info.label ?? '', info)) continue;
    return index as t.Index;
  }

  return !requireLabel && items.length > 0 ? (0 as t.Index) : undefined;
};
