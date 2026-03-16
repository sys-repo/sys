import { type t, Fs } from './common.ts';
import { readRepoAuthorities } from './u.authorities.read.ts';
import { localizeAuthorities } from './u.authorities.sync.ts';
import { loadWorkspaceAuthorities, resolveWorkspaceRoot } from './u.authorities.workspace.ts';

export const LocalRepoAuthorities: t.TmplTesting.LocalRepoAuthoritiesLib = {
  async rewrite(args) {
    const root = args.root;
    const workspaceRoot = await resolveWorkspaceRoot(args.workspaceRoot);
    const current = await readRepoAuthorities(root);
    const workspace = await loadWorkspaceAuthorities(workspaceRoot);
    const next = localizeAuthorities(current, workspace);

    await Fs.writeJson(Fs.join(root, 'imports.json'), { imports: next.imports });
    await Fs.writeJson(Fs.join(root, 'package.json'), next.packageJson);
    return next;
  },

  async read(root) {
    return await readRepoAuthorities(root);
  },
};
