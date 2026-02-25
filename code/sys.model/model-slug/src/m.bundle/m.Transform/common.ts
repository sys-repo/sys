export { AliasResolver } from '@sys/std/alias';

export * from '../common.ts';
export { SlugSchema } from '../../m.schema/mod.ts';

/**
 * Constants:
 */
export const D = {
  /**
   * Staged pure-transform defaults.
   * The source bundler's true default base is runtime-derived (e.g. `cwd/publish.assets`).
   */
  manifestsBase: '.' as const,
  manifestsDir: 'manifests' as const,
  mediaDirVideo: 'video' as const,
  mediaDirImage: 'image' as const,
  assetsTemplate: 'slug.<docid>.assets.json' as const,
  playbackTemplate: 'slug.<docid>.playback.json' as const,
  treeTemplate: 'slug-tree.<docid>.json' as const,
} as const;
export const DEFAULTS = D;
