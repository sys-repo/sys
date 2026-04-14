import { describe, expect, Fs, it, Testing } from '../../-test.ts';
import { apply } from '../u.apply.ts';

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
      root: {
        pkgPath,
        denoFilePath,
        name: '@scope/a',
        version: {
          current: version(0),
          next: version(1),
        },
      },
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
          args: ['eval', `await Deno.writeTextFile(${JSON.stringify(marker)}, ${JSON.stringify(cwd)})`],
          cwd,
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
