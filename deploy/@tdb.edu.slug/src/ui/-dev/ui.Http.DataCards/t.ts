import type { t } from './common.ts';

/**
 * Flags for enumerating the kinds of data-cards available.
 */
export type DataCardKind = (typeof DataCardKindKinds)[number];
export const DataCardKindKinds = ['descriptor', 'file-content', 'playback-content'] as const;
