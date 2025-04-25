import { Pkg, pkg, Obj } from '../common.ts';

export * from '../common.ts';
export { Content } from '../m/mod.ts';
export { CanvasSlug, ConceptPlayer, ElapsedTime, MenuList, Playlist } from '../ui/mod.ts';

import { DEFAULTS as AppRender_DEFAULTS } from '../../ui/App.Render/mod.ts';

/**
 * Constants:
 */
const name = 'Content:Programme';
export const DEFAULTS = Obj.extend(AppRender_DEFAULTS, {
  name,
  displayName: Pkg.toString(pkg, name),
});
export const D = DEFAULTS;
