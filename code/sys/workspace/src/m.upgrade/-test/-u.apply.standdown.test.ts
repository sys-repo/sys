import { describe, expect, expectError, Fs, it, Str, Testing } from '../../-test.ts';
import { Fmt } from '../../m.cli/u.fmt/u.fmt.ts';
import {
  apply,
  infoNpm,
  registry as createRegistry,
  standdownTime as T,
  versionsNpm,
  writeDepsYaml,
} from './u.fixture.ts';

const DAY = T.day;

describe('Workspace.Upgrade.apply standdown', () => {
  for (const reverse of [false, true]) {
    for (const excluded of [false, true]) {
      it(`binds alias decisions (reverse=${reverse}, excluded=${excluded})`, async () => {
        const fs = await Testing.dir('WorkspaceUpgrade.apply.alias');
        const retained = excluded ? '1.0.0' : '3.0.0';
        const rows = [
          Str.dedent(`
            - name: older
              import: npm:sample@1.0.0
          `),
          Str.dedent(`
            - name: retained
              import: npm:sample@${retained}
          `),
        ];
        const body = (reverse ? rows.toReversed() : rows).join('\n');
        await Fs.write(fs.join('deps.yaml'), `deno.json:\n${body}\n`);
        await Fs.writeJson(fs.join('deno.json'), { tasks: { dev: 'keep' } });
        const registry = createRegistry({
          versions: {
            jsr: {},
            npm: {
              sample: versionsNpm('sample', '3.0.0', {
                '1.0.0': {},
                '2.0.0': { publishedAt: T.older },
                '3.0.0': { publishedAt: T.tooNew },
              }),
            },
          },
          info: { jsr: {}, npm: { 'sample@2.0.0': infoNpm('sample', '2.0.0') } },
        });
        const result = await apply(registry, { cwd: fs.dir, deps: fs.join('deps.yaml') }, {
          policy: { mode: 'latest', exclude: excluded ? ['retained'] : [] },
          minimumDependencyAge: 2 * DAY,
          evaluatedAt: T.now,
        });
        const pins = result.entries.map((entry) => [entry.module.alias, entry.module.version]);
        expect(pins.toSorted()).to.eql([['older', '2.0.0'], ['retained', retained]]);
        const yaml = (await Fs.readText(fs.join('deps.yaml'))).data;
        expect(yaml).to.include('npm:sample@2.0.0');
        expect(yaml).to.include(`npm:sample@${retained}`);
        const json = await Fs.readJson<{ imports: Record<string, string>; tasks: unknown }>(
          fs.join('deno.json'),
        );
        expect(json.data?.imports).to.eql({
          older: 'npm:sample@2.0.0',
          retained: `npm:sample@${retained}`,
        });
        expect(json.data?.tasks).to.eql({ dev: 'keep' });
        expect(Fmt.updatedRows(result).map((row) => row.entry.module.alias)).to.eql(['older']);
        const diagnostics = Fmt.rows(result.upgrade);
        const older = diagnostics.find((row) => row.candidate.entry.module.alias === 'older');
        const sibling = diagnostics.find((row) => row.candidate.entry.module.alias === 'retained');
        expect(older?.selected).to.eql('2.0.0');
        expect(sibling?.selected).to.eql(undefined);
      });
    }
  }

  it('keeps duplicate successful aliases subject to existing graph refusal', async () => {
    const fs = await Testing.dir('WorkspaceUpgrade.apply.alias-graph');
    await writeDepsYaml(
      fs,
      `
      deno.json:
        - name: first
          import: npm:sample@1.0.0
        - name: second
          import: npm:sample@1.0.0
    `,
    );
    const registry = createRegistry({
      versions: {
        jsr: {},
        npm: { sample: versionsNpm('sample', '2.0.0', { '2.0.0': { publishedAt: T.older } }) },
      },
      info: { jsr: {}, npm: { 'sample@2.0.0': infoNpm('sample', '2.0.0') } },
    });
    const before = (await Fs.readText(fs.join('deps.yaml'))).data;
    const error = await expectError(() =>
      apply(registry, { cwd: fs.dir, deps: fs.join('deps.yaml') }, {
        policy: { mode: 'latest' },
        minimumDependencyAge: 2 * DAY,
        evaluatedAt: T.now,
      })
    );
    expect(error.message).to.include('dependency graph is invalid');
    expect((await Fs.readText(fs.join('deps.yaml'))).data).to.eql(before);
    expect(await Fs.exists(fs.join('deno.json'))).to.eql(false);
  });

  it('rejects invalid options and required arithmetic before any writes', async () => {
    const fs = await Testing.dir('WorkspaceUpgrade.apply.arithmetic');
    await writeDepsYaml(
      fs,
      `
      deno.json:
        - import: npm:sample@1.0.0
    `,
    );
    const registry = createRegistry({
      versions: {
        jsr: {},
        npm: { sample: versionsNpm('sample', '2.0.0', { '2.0.0': { publishedAt: T.older } }) },
      },
    });
    const before = (await Fs.readText(fs.join('deps.yaml'))).data;
    for (const minimumDependencyAge of [0.0001, Number.MAX_SAFE_INTEGER]) {
      const error = await expectError(() =>
        apply(registry, { cwd: fs.dir, deps: fs.join('deps.yaml') }, {
          policy: { mode: 'latest' },
          minimumDependencyAge,
          evaluatedAt: T.now,
        })
      );
      expect(error.message).to.include(
        minimumDependencyAge < 1
          ? 'Invalid minimumDependencyAge'
          : 'Unsupported dependency standdown deadline',
      );
      expect((await Fs.readText(fs.join('deps.yaml'))).data).to.eql(before);
      expect(await Fs.exists(fs.join('deno.json'))).to.eql(false);
    }
  });
});
