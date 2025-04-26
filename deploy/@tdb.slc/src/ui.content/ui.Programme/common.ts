import { DEFAULTS as AppRenderDefaults } from '../../ui/App.Render/mod.ts';
import { type t, Obj, Pkg, pkg } from '../common.ts';
export { useTimestamps } from '../ui/mod.ts';

export * from '../common.ts';
export { Content } from '../m/mod.ts';
export { CanvasSlug, ConceptPlayer, ElapsedTime, MenuList, Playlist } from '../ui/mod.ts';

/**
 * Constants:
 */
const name = 'Content:Programme';
const align: t.ConceptPlayerAlign = 'Center';
export const DEFAULTS = Obj.extend(AppRenderDefaults, {
  name,
  displayName: Pkg.toString(pkg, name),
  align,
});
export const D = DEFAULTS;
