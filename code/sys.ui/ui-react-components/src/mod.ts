/**
 * @module
 * Library of common `<React>` components.
 *
 * @example
 * ```ts
 * import { Foo } from '@sys/ui-react-components';
 * ```
 */
export { pkg } from './pkg.ts';

/** Module types. */
export type * as t from './types.ts';

/**
 * Components.
 */
export { Button } from './ui/Button/mod.ts';
export { Cropmarks } from './ui/Cropmarks/mod.ts';
export { Svg } from './ui/Image.Svg/mod.ts';
export { Panel } from './ui/Panel/mod.ts';

export { ConceptPlayer } from './ui/Player.Concept/mod.ts';
export { VideoPlayer } from './ui/Player.Video/mod.ts';
export { Player } from './ui/Player/mod.ts';
export { VimeoBackground } from './ui/VimeoBackground/mod.ts';
