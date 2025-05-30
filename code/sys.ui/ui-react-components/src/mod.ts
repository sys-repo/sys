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
export { Bullet } from './ui/Bullet/mod.ts';
export { Button } from './ui/Button/mod.ts';
export { Cropmarks } from './ui/Cropmarks/mod.ts';
export { FadeElement } from './ui/FadeElement/mod.ts';
export { Icon } from './ui/Icon/mod.ts';
export { Svg } from './ui/Image.Svg/mod.ts';
export { LayoutCenterColumn } from './ui/Layout.CenterColumn/mod.ts';
export { Media } from './ui/Media/mod.ts';
export { ObjectView } from './ui/ObjectView/mod.ts';
export { Preload } from './ui/Preload/mod.ts';
export { Sheet } from './ui/Sheet/mod.ts';
export { Slider } from './ui/Slider/mod.ts';
export { Spinners } from './ui/Spinners/mod.ts';

export { VideoPlayer } from './ui/Player.Video/mod.ts';
export { Player } from './ui/Player/mod.ts';
export { VimeoBackground } from './ui/VimeoBackground/mod.ts';
