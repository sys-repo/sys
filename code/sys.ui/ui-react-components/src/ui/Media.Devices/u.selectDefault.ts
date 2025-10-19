import { type t } from './common.ts';

/**
 * Select a default device index from an available list.
 */
export const selectDefaultDevice = (
  items: MediaDeviceInfo[],
  prefs: t.DeviceDefaultPrefs = {},
): t.Index | undefined => {
  const {
    kindOrder = ['videoinput', 'audioinput', 'audiooutput'] as const,
    requireLabel = true,
    labelMatch,
  } = prefs;

  const ranked = kindOrder.flatMap((kind) =>
    items.map((info, index) => ({ info, index })).filter((m) => m.info.kind === kind),
  );

  for (const { info, index } of ranked) {
    const hasLabel = Boolean(info.label?.trim());
    if (requireLabel && !hasLabel) continue;
    if (labelMatch && !labelMatch(info.label ?? '', info)) continue;
    return index as t.Index;
  }

  if (!requireLabel && items.length > 0) return 0;
  return undefined;
};
