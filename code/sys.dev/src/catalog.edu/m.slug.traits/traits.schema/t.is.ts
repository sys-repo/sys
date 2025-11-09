import type { t } from './common.ts';

/**
 * Boolean predicates (type guards) for Slug entities.
 * Used for structural or semantic truth checks across the Slug domain.
 */
export type SlugTraitIsLib = {
  slugTreeProps(u: unknown): u is t.SlugTreeProps;
  videoRecorderBinding(m: unknown): m is t.VideoRecorderBinding;
  videoRecorderProps(u: unknown): u is t.VideoRecorderProps;
  videoPlayerBinding(m: unknown): m is t.VideoPlayerBinding;
  videoPlayerProps(u: unknown): u is t.VideoPlayerProps;
  conceptLayoutProps(u: unknown): u is t.ConceptLayoutProps;
  fileListProps(u: unknown): u is t.FileListProps;
  timestampsMap(u: unknown): u is t.Timestamps;
};
