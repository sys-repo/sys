import { type t } from './common.ts';
import { refreshRootDist } from './u.dist.ts';
import { refreshMounts } from './u.mounts.ts';

/**
 * Refresh root staged metadata from current filesystem state.
 */
export const refreshRoot: t.SlcDataPipeline.RefreshRoot.Run = async (args) => {
  const mountsPath = await refreshMounts(args.root);
  const distPath = await refreshRootDist(args.root);
  return {
    kind: 'refresh-root',
    ok: true,
    root: args.root,
    mountsPath,
    distPath,
  };
};
