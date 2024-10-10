import { Confirm } from '@cliffy/prompt';
import { Denofile } from '@sys/driver-deno';
import { c, Cli, R, Semver, type t, Value } from './common.ts';

type Options = {
  release?: t.SemVerReleaseType;
  argv?: string[];
};

type TArgs = {
  release?: t.SemVerReleaseType;
};

export async function main(options: Options = {}) {
  const args = Cli.args<TArgs>(options.argv ?? Deno.args);
  const release = wrangle.release(options, args);
  const releaseColored = `${c.green(Value.String.capitalize(release))}`;
  console.info();
  console.info(c.gray(`${c.bold(releaseColored)} Version`));

  /**
   * Load the workspace.
   */
  const ws = await Denofile.workspace();
  if (!ws.exists) {
    const err = `Could not find a workspace. Ensure the root deno.json file as a "workspace" configuration.`;
    console.warn(err);
    return;
  }

  /**
   * Retrieve the child modules within the workspace.
   */
  const children = (await ws.children.load())
    .filter((file) => file.exists)
    .filter((file) => !!file.json)
    .filter((file) => typeof file.json?.version === 'string')
    .filter((file) => typeof file.json?.name === 'string')
    .map((file) => {
      const json = file.json!;
      const { name = '', version = '' } = json;
      const current = Semver.parse(version);
      const next = Semver.increment(current, release);
      const path = file.path;
      return { path, json, name, version: { current, next } };
    });

  const formatSemverColor = (version: t.SemVer, release: t.SemVerReleaseType) => {
    const fmt = (kind: t.SemVerReleaseType, value: number): string => {
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
    const vNext = formatSemverColor(version.next, release);

    const title = `${c.green('•')} ${pkg}`;
    table.push([title, vCurrent, '→', vNext]);
  });

  console.info();
  console.info(c.gray(table.toString()));
  console.info();

  /**
   * Prompt to continue.
   */
  const res = await Confirm.prompt('Update files?:');
  if (!res) return false;

  /**
   * Make file changes.
   */
  for (const child of children) {
    const denofile = R.clone(child.json) as t.DenofileJson;
    denofile.version = Semver.toString(child.version.next);
    const json = `${JSON.stringify(denofile, null, '  ')}\n`;
    await Deno.writeTextFile(child.path, json);
  }

  return true;
}

/**
 * Helpers
 */
const wrangle = {
  release(options: Options, argv: TArgs): t.SemVerReleaseType {
    if (options.release !== undefined) return options.release;

    if (argv.release !== undefined) {
      const release = argv.release.toLowerCase() as t.SemVerReleaseType;
      const supported: t.SemVerReleaseType[] = ['major', 'minor', 'patch'];
      if (supported.includes(release)) return release;

      // Unsupported semver release/bump type.
      const argValue = c.white(c.bold(release));
      const title = c.bold('Warning');
      const msg = `--release="${argValue}" argument not supported.`;
      const warning = c.yellow(`${title}: ${msg}`);
      console.warn(warning);
    }

    return 'patch'; // Default.
  },
} as const;
