import { Denofile } from '@sys/driver-deno';
import { c, Cli, Semver } from './u.ts';

export async function main() {
  // Load the workspace.
  const ws = await Denofile.workspace();
  if (!ws.exists) {
    const err = `Could not find a workspace. Ensure the root deno.json file as a "workspace" configuration.`;
    console.warn(err);
    return;
  }

  // const dir = Fs.dirname(ws.file);
  const children = (await ws.children.load())
    .filter((file) => file.exists)
    .filter((file) => !!file.json)
    .filter((file) => typeof file.json?.version === 'string')
    .filter((file) => typeof file.json?.name === 'string');

  // Prepare the set of next versions to bump to.
  const table = Cli.table(['Module', 'Current', '', 'Next']);
  children.forEach((child) => {
    const { name = '', version = '' } = child.json!;
    const current = Semver.parse(version);
    const next = Semver.increment(current, 'patch');
    const title = `${c.green('•')} ${c.white(name)}`;
    table.push([title, Semver.format(current), '→', c.green(Semver.format(next))]);
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
