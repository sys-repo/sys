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
export { Panel } from './ui/Panel/mod.ts';

export { ConceptPlayer } from './ui/Player.Concept/mod.ts';
export { VideoPlayer } from './ui/Player.Video/mod.ts';
export { Player } from './ui/Player/mod.ts';
