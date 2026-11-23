import { WorkspaceCli } from '@sys/workspace/cli';
import { PATH, syncPiAgentImport } from '../code/sys.driver/driver-pi/-scripts/-prep.u.ts';
import { c, Fs, Num, Process, Str, type t } from './common.ts';

type UpgradeResult =
  | { readonly kind: Exclude<t.WorkspaceCli.Result['kind'], 'apply'> }
  | { readonly kind: 'apply'; readonly options: Pick<t.WorkspaceCli.ResolvedOptions, 'deps'> };

type Lib = {
  readonly root?: t.StringDir;
  run(input: t.WorkspaceCli.Input): Promise<UpgradeResult>;
  refresh(root: t.StringDir): Promise<void>;
  invoke: t.Process.Lib['inherit'];
};

const retained = 'Applied dependency files and any Pi metadata writes are retained.';

/** Only an apply to the repository's `deps.yaml` runs root dependency verification. */
export async function main(argv: readonly string[], lib: Lib = {
  run: WorkspaceCli.run,
  refresh: refreshDependencyMetadata,
  invoke: Process.inherit,
}) {
  const root = lib.root ?? Fs.resolve(import.meta.dirname ?? '.', '..');
  return await lib.run({
    argv: ['upgrade', ...argv],
    async finalizeUpgrade(applied) {
      if (!await isRootManifest(applied.input.deps, Fs.join(root, 'deps.yaml'))) return;

      await verifyRootUpgrade(root, lib);
      console.info();
      console.info(Str.dedent(`
        Frozen install and checked Markdown stringify passed.
        Workspace preparation and broader verification remain.

        Next: ${c.cyan('deno task prep')}
              ${c.gray('Refresh generated artifacts, including CI workflows.')}

        If you apply a bump, ${c.cyan('deno task bump')} runs post-bump preparation.
        It does not replace verification.
      `));
    },
  });
}

if (import.meta.main) await main(Deno.args);

async function isRootManifest(applied: string, canonical: string): Promise<boolean> {
  try {
    const [appliedPath, rootPath] = await Promise.all([
      Fs.realPath(applied),
      Fs.realPath(canonical),
    ]);
    if (appliedPath === rootPath) return true;

    // Hard links have different real paths. Only a known identity mismatch may skip verification.
    const [selected, root] = await Promise.all([Deno.stat(appliedPath), Deno.stat(rootPath)]);
    for (const { dev, ino } of [selected, root]) {
      if (!Num.Is.safeInt(dev) || dev < 0 || !Num.Is.safeInt(ino) || ino <= 0) {
        throw new Error('Filesystem did not supply a reliable device and inode.');
      }
    }
    return selected.dev === root.dev && selected.ino === root.ino;
  } catch (cause) {
    throw new Error(
      `Cannot establish whether ${applied} is ${canonical}; dependency writes are retained. ` +
        'Inspect both manifest paths before continuing. Do not rerun upgrade.',
      { cause },
    );
  }
}

async function verifyRootUpgrade(root: t.StringDir, lib: Lib): Promise<void> {
  try {
    await lib.refresh(root);
  } catch (cause) {
    const retry = retryFrom('deno task prep:deps', 'code/sys.driver/driver-pi');
    throw new Error(`Pi dependency metadata refresh failed. ${retained} ${retry}`, { cause });
  }

  await runPhase('Lockfile sync', '.', ['task', 'lock:sync'], 'The lockfile may have changed.');

  const synced = 'The synchronized lockfile is retained.';
  await runPhase('Frozen install', '.', ['task', 'install'], synced);
  await runPhase(
    'Checked Markdown stringify',
    'code/sys/markdown',
    ['task', 'test', '--frozen-lockfile', './src/m.Markdown/-test/-u.stringify.test.ts'],
    synced,
  );

  async function runPhase(name: string, dir: string, args: string[], lockState: string) {
    const command = `deno ${args.join(' ')}`;
    const retry = retryFrom(command, dir);
    const context = `${retained} ${lockState} ${retry}`;
    console.info(`${name}: ${command}`);

    // Inherited stdio leaves the child diagnostic in the terminal.
    let result: t.Process.InheritOutput;
    try {
      result = await lib.invoke({ cmd: Deno.execPath(), args, cwd: Fs.join(root, dir) });
    } catch (cause) {
      throw new Error(`${name} could not run. ${context}`, { cause });
    }
    if (!result.success) {
      const status = result.signal
        ? `exit ${result.code}, ${result.signal}`
        : `exit ${result.code}`;
      throw new Error(`${name} failed (${status}). ${context}`);
    }
  }
}

function retryFrom(command: string, dir: string): string {
  const from = dir === '.' ? 'the repository root' : `\`${dir}\``;
  return `Retry \`${command}\` from ${from} without rerunning upgrade.`;
}

async function refreshDependencyMetadata(root: t.StringDir): Promise<void> {
  await syncPiAgentImport(PATH.fromRoot(root));
}
