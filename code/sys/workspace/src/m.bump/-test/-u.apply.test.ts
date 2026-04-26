import { describe, expect, Fs, it, Json, Testing } from '../../-test.ts';
import { apply } from '../u.apply.ts';

const FS_MOD = new URL('../../../../fs/src/mod.ts', import.meta.url).href;

describe('@sys/workspace/bump apply', () => {
  it('writes bumped package versions and runs followups', async () => {
    const fs = await Testing.dir('WorkspaceBump.apply');
    const pkgPath = Fs.join(fs.dir, 'code/pkg-a');
    const denoFilePath = Fs.join(pkgPath, 'deno.json');
    const marker = Fs.join(fs.dir, '.followup.txt');

    await Fs.writeJson(denoFilePath, {
      name: '@scope/a',
      version: '1.0.0',
      exports: { '.': './src/mod.ts' },
    });
    await Fs.write(Fs.join(pkgPath, 'src/mod.ts'), `export const a = 'a';\n`);

    const plan = {
      roots: [{
        pkgPath,
        denoFilePath,
        name: '@scope/a',
        version: {
          current: version(0),
          next: version(1),
        },
      }],
      selected: [{
        pkgPath,
        denoFilePath,
        name: '@scope/a',
        version: {
          current: version(0),
          next: version(1),
        },
      }],
      selectedPaths: [pkgPath],
    };

    const res = await apply({
      cwd: fs.dir,
      plan,
      policy: {
        followups: ({ cwd }) => [{
          label: 'write marker',
          cmd: 'deno',
          args: [
            'eval',
            `import { Fs } from ${Json.stringify(FS_MOD)}; await Fs.write(${
              Json.stringify(marker)
            }, ${Json.stringify(cwd)})`,
          ],
        }],
      },
    });

    const denoJson = await Fs.readJson<{ version?: string }>(denoFilePath);
    const followup = await Fs.readText(marker);

    expect(res.writes).to.eql([{
      pkgPath,
      denoFilePath,
      previous: version(0),
      next: version(1),
    }]);
    expect(res.followups).to.have.length(1);
    expect(denoJson.data?.version).to.eql('1.0.1');
    expect(followup.data).to.eql(fs.dir);
  });
});

function version(patch: number) {
  return { major: 1, minor: 0, patch, prerelease: [], build: [] };
}
