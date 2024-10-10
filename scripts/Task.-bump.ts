import { Denofile } from '@sys/driver-deno';
import { c, Cli, Semver, type t, Value } from './common.ts';

export async function main(options: { releaseType?: t.SemVerReleaseType } = {}) {
  const { releaseType = 'patch' } = options;
  const releaseColored = `${c.green(Value.String.capitalize(releaseType))}`;
  console.info();
  console.info(c.gray(`Version ${c.bold(releaseColored)}`));

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
    .filter((file) => typeof file.json?.name === 'string');

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
    const { name = '', version = '' } = child.json!;
    const current = Semver.parse(version);
    const next = Semver.increment(current, releaseType);

    const modParts = name.split('/');
    const modScope = modParts[0];
    const modName = modParts.splice(1).join('/');
    const pkg = `${c.gray(modScope)}/${c.white(c.bold(modName))}`;

    const vCurrent = Semver.format(current);
    const vNext = formatSemverColor(next, releaseType);

    const title = `${c.green('•')} ${pkg}`;
    table.push([title, vCurrent, '→', vNext]);
  });

  console.info();
  console.info(c.gray(table.toString()));
  console.info();

  /**
   * TODO 🐷
   * - take argument --patch, --minor --major
   * - prompt yes/no
   * - save new version to all the modulees.
   */
}
