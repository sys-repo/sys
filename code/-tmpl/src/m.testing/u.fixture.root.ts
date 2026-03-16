import { type t, Fs, Is } from './common.ts';

export async function resolveFixtureRoot(
  cwd: t.StringDir,
  targetDir?: t.StringDir,
): Promise<t.FixtureRoot> {
  if (Is.str(targetDir) && targetDir.length > 0) {
    const root = Fs.resolve(cwd, targetDir) as t.StringAbsoluteDir;
    return { parent: cwd, dir: targetDir, root };
  }

  const parent = (await Fs.makeTempDir({ prefix: 'tmpl.testing.repo.' })).absolute as t.StringAbsoluteDir;
  const dir = 'repo';
  const root = Fs.join(parent, dir) as t.StringAbsoluteDir;
  return { parent, dir, root };
}
