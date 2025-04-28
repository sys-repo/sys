import { Value, type t } from './common.ts';

/**
 * Helpers for working with change patches.
 */
export const Patch: t.CmdPatchLib = {
  startsWith(patch: t.CmdPatch, def: t.ObjectPath) {
    const path = Patch.path(patch);
    return !path ? false : Value.Arr.compare(path).startsWith(def);
  },

  path(patch: t.CmdPatch): t.ObjectPath {
    if (!patch || typeof patch !== 'object' || patch === null) return [];
    if (Array.isArray(patch.path)) return patch.path;
    if (typeof patch.path !== 'string') return [];
    return patch.path.trim().split('/').filter(Boolean);
  },

  includesQueueChange(patches: t.CmdPatch[], paths: t.CmdPaths) {
    return patches.some((patch) => Patch.isQueueChange(patch, paths));
  },

  isQueueChange(patch: t.CmdPatch, paths: t.CmdPaths) {
    return Patch.startsWith(patch, paths.queue);
  },
} as const;
