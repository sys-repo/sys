import { type t, Deps as DepsBase, Fs, Path } from './common.ts';
import { Fmt } from './m.Fmt.ts';

export const PrepDeps: t.WorkspacePrep.Deps.Lib = {
  async sync(args = {}) {
    const cwd = args.cwd ?? Fs.cwd();
    const depsPath = args.depsPath ?? Path.resolve(cwd, 'deps.yaml');
    const denoFilePath = args.denoFilePath ?? Path.resolve(cwd, 'deno.json');
    const packageFilePath = args.packageFilePath ?? Path.resolve(cwd, 'package.json');

    const manifest = await DepsBase.from(depsPath);
    if (!manifest.data) {
      throw new Error(`Workspace.Prep.Deps.sync: failed to read "${depsPath}"`, {
        cause: manifest.error,
      });
    }

    const entries = manifest.data.entries;
    const deno = await DepsBase.applyDeno(denoFilePath, entries);
    const pkg = await DepsBase.applyPackage(packageFilePath, entries);
    const result = {
      total: entries.length,
      depsPath,
      deno,
      package: pkg,
    };

    if (args.log) console.info(Fmt.importMapSync({ cwd, result }));
    return result;
  },
} as const;
