import { DenoFile } from '@sys/driver-deno/runtime';
import { type t, c, Cli, R, Semver, Value } from './common.ts';

type Options = {
  release?: t.SemverReleaseType;
  argv?: string[];
};

type TArgs = {
  release?: t.SemverReleaseType;
};

export async function main(options: Options = {}) {
  const args = Cli.args<TArgs>(options.argv ?? Deno.args);
  const release = wrangle.release(options, args);
  const releaseColored = `${c.green(Value.Str.capitalize(release))}`;
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
    if (path.includes('code/-tmpl/')) return true;
    return false;
  };

  /**
   * Retrieve the child modules within the workspace.
   */
  const children = ws.children
    .filter((child) => !exclude(child.path))
    .filter((child) => !!child.file.version)
    .filter((child) => typeof child.file.version === 'string')
    .filter((child) => typeof child.file.name === 'string')
    .map((child) => {
      const json = child.file;
      const path = child.path;
      const { name = '', version = '' } = json;
      const current = Semver.parse(version).version;
      const next = Semver.increment(current, release);
      return { path, json, name, version: { current, next } };
    });

  const formatSemverColor = (version: t.Semver, release: t.SemverReleaseType) => {
    const fmt = (kind: t.SemverReleaseType, value: number): string => {
      const text = String(value);
      return kind === release ? c.bold(text) : text;
    };
    const major = fmt('major', version.major);
    const minor = fmt('minor', version.minor);
    const patch = fmt('patch', version.patch);
    return c.green(`${major}.${minor}.${patch}`);
  };

  // Prepare the set of next versions to bump to.
  const table = Cli.table(['Module', 'Current', '', 'Next']);
  children.forEach((child) => {
    const { name, version } = child;
    const modParts = name.split('/');
    const modScope = modParts[0];
    const modName = modParts.splice(1).join('/');
    const pkg = `${c.gray(modScope)}/${c.white(c.bold(modName))}`;

    const vCurrent = Semver.toString(version.current);
    const vNext = Semver.Fmt.colorize(version.next, { highlight: release, baseColor: c.green });

    const title = `${c.green(' •')} ${pkg}`;
    table.push([title, vCurrent, '→', vNext]);
  });

  console.info();
  console.info(c.gray(table.toString()));
  console.info();

  /**
   * Prompt to continue.
   */
  const yes = await Cli.confirm('Update files?:');
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

  const prepare = await import('./Task.-prep.ts');
  await prepare.main();

  return true;
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
} as const;
