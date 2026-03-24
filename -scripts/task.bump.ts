import { DenoFile } from '@sys/driver-deno/runtime';
import { type t, c, Cli, Path, Paths, R, Semver, Str } from './common.ts';
import { main as prepCi } from './task.prep.ci.ts';
import { main as prepCiDeno } from './task.prep.ci.deno.ts';

type Options = {
  release?: t.SemverReleaseType;
  dryRun?: boolean;
  nonInteractive?: boolean;
  argv?: string[];
};

type TArgs = {
  release?: t.SemverReleaseType;
  'dry-run'?: boolean;
  'non-interactive'?: boolean;
};

export async function main(options: Options = {}) {
  const args = Cli.args<TArgs>(options.argv ?? Deno.args, {
    boolean: ['dry-run', 'non-interactive'],
  });
  const release = wrangle.release(options, args);
  const dryRun = wrangle.dryRun(options, args);
  const nonInteractive = wrangle.nonInteractive(options, args);
  const releaseColored = `${c.green(Str.capitalize(release))}`;
  console.info();
  console.info(c.gray(`${c.bold(releaseColored)} Version`));

  /**
   * Load the workspace.
   */
  const ws = await DenoFile.workspace();
  if (!ws.exists) {
    const err = `Could not find a workspace. Ensure the root deno.json file as a "workspace" configuration.`;
    console.warn(err);
    return;
  }

  const exclude = (path: t.StringPath) => {
    if (path.includes('deploy/@tdb.slc/')) return true;
    return false;
  };

  /**
   * Retrieve the child modules within the workspace.
   */
  const children = orderChildren(
    ws.children
    .filter((child) => !exclude(child.path.denofile))
    .filter((child) => !!child.denofile.version)
    .filter((child) => typeof child.denofile.version === 'string')
    .filter((child) => typeof child.denofile.name === 'string')
    .map((child) => {
      const json = child.denofile;
      const path = child.path.denofile;
      const { name = '', version = '' } = json;
      const current = Semver.parse(version).version;
      const next = wrangle.increment(current, release);
      return { path, json, name, version: { current, next } };
    }),
    Paths.all,
  );

  // Prepare the set of next versions to bump to.
  const table = Cli.table(['Module', 'Current', '', 'Next']);
  children.forEach((child) => {
    const { name, version } = child;
    const modParts = name.split('/');
    const modScope = modParts[0];
    const modName = modParts.splice(1).join('/');
    const pkg = `${c.gray(modScope)}/${c.white(c.bold(modName))}`;

    const vCurrent = Semver.toString(version.current);
    const vNext = Semver.Fmt.colorize(version.next, { highlight: release });

    const title = `${c.cyan(' •')} ${pkg}`;
    table.push([title, vCurrent, '→', vNext]);
  });

  console.info();
  console.info(c.gray(table.toString()));
  console.info();

  if (dryRun) {
    console.info(c.gray(c.italic('Dry run only. No files updated.')));
    console.info();
    return true;
  }

  /**
   * Prompt to continue.
   */
  const yes = nonInteractive ? true : await Cli.Input.Confirm.prompt('Update files?:');
  if (!yes) return false;

  /**
   * Write version to files.
   */
  for (const child of children) {
    const denofile = R.clone(child.json) as t.DenoFileJson;
    denofile.version = Semver.toString(child.version.next);
    const json = `${JSON.stringify(denofile, null, '  ')}\n`;
    await Deno.writeTextFile(child.path, json);
  }

  const prepare = await import('./task.prep.ts');
  const prepared = await prepare.main('bump');
  await prepCiDeno();
  await prepCi({ prepared, final: true });

  return true;
} 

export function orderChildren<T extends { path: t.StringPath }>(
  children: readonly T[],
  orderedPaths: readonly t.StringPath[],
) {
  const childByPath = new Map(children.map((child) => [Path.dirname(child.path), child] as const));
  const ordered = orderedPaths.flatMap((path) => {
    const child = childByPath.get(path);
    return child ? [child] : [];
  });

  const seen = new Set(ordered.map((child) => Path.dirname(child.path)));
  const remainder = children
    .filter((child) => !seen.has(Path.dirname(child.path)))
    .toSorted((a, b) => Path.dirname(a.path).localeCompare(Path.dirname(b.path)));

  return [...ordered, ...remainder];
}

/**
 * Helpers
 */
const wrangle = {
  release(options: Options, argv: TArgs): t.SemverReleaseType {
    if (options.release !== undefined) return options.release;

    if (argv.release !== undefined) {
      const release = argv.release.toLowerCase() as t.SemverReleaseType;
      const supported: t.SemverReleaseType[] = ['major', 'minor', 'patch'];
      if (supported.includes(release)) return release;

      // Unsupported semver release/bump type.
      const argValue = c.white(c.bold(release));
      const title = c.bold('Warning');
      const msg = `--release="${argValue}" argument not supported.`;
      const warning = c.yellow(`${title}: ${msg}`);
      console.warn(warning);
    }

    return 'patch'; // (Default).
  },

  dryRun(options: Options, argv: TArgs) {
    return options.dryRun ?? argv['dry-run'] ?? false;
  },

  nonInteractive(options: Options, argv: TArgs) {
    return options.nonInteractive ?? argv['non-interactive'] ?? false;
  },

  increment(current: t.Semver, release: t.SemverReleaseType) {
    const isPrerelease = (current.prerelease ?? []).length > 0;
    if (release === 'patch' && isPrerelease) release = 'prerelease';
    return Semver.increment(current, release);
  },
} as const;
