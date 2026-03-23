import { describe, expect, it, Testing } from '../../-test.ts';
import { WorkspaceUpgrade } from '../mod.ts';
import { fetchFail, infoJsr, infoNpm, versionsJsr, versionsNpm, withInfo, withVersions, writeDepsYaml } from './u.fixture.ts';

describe('Workspace.Upgrade.upgrade', () => {
  it('composes collection, policy, and deterministic topological ordering', async () => {
    const fs = await Testing.dir('WorkspaceUpgrade.upgrade');
    await writeDepsYaml(fs, `
      deno.json:
        - import: npm:react-dom@18.2.0
        - import: npm:react@18.2.0
    `);

    await withVersions(
      {
        jsr: {},
        npm: {
          'react-dom': versionsNpm('react-dom', '19.0.0', { '18.2.0': {}, '19.0.0': {} }),
          react: versionsNpm('react', '19.0.0', { '18.2.0': {}, '19.0.0': {} }),
        },
      },
      async () => {
        await withInfo(
          {
            jsr: {},
            npm: {
              'react@19.0.0': infoNpm('react', '19.0.0'),
              'react-dom@19.0.0': infoNpm('react-dom', '19.0.0', { react: '^19.0.0' }),
            },
          },
          async () => {
            const result = await WorkspaceUpgrade.upgrade(
              { cwd: fs.dir, deps: fs.join('deps.yaml') },
              { policy: { mode: 'latest' } },
            );

            expect(result.collect.totals).to.eql({
              dependencies: 2,
              collected: 2,
              skipped: 0,
              failed: 0,
            });
            expect(result.totals).to.eql({
              dependencies: 2,
              allowed: 2,
              blocked: 0,
              planned: 2,
            });
            expect(result.graph.edges).to.eql([{ from: 'npm:react', to: 'npm:react-dom' }]);
            expect(result.graph.unresolved).to.eql([]);
            expect(result.policy.decisions.every((decision) => decision.ok)).to.eql(true);
            expect(result.topological.ok).to.eql(true);
            if (result.topological.ok) {
              expect(result.topological.items.map((item) => item.node.key)).to.eql([
                'npm:react',
                'npm:react-dom',
              ]);
            }
          },
        );
      },
    );
  });

  it('keeps blocked dependencies out of the ordered plan', async () => {
    const fs = await Testing.dir('WorkspaceUpgrade.upgrade.none');
    await writeDepsYaml(fs, `
      deno.json:
        - import: jsr:@sys/std@0.0.1
        - import: npm:react@18.2.0
    `);

    await withVersions(
      {
        jsr: { '@sys/std': versionsJsr('@sys/std', '0.0.3', { '0.0.1': {}, '0.0.3': {} }) },
        npm: { react: versionsNpm('react', '19.0.0', { '18.2.0': {}, '19.0.0': {} }) },
      },
      async () => {
        await withInfo(
          {
            jsr: { '@sys/std@0.0.3': infoJsr('@sys/std', '0.0.3') },
            npm: { 'react@19.0.0': infoNpm('react', '19.0.0') },
          },
          async () => {
            const result = await WorkspaceUpgrade.upgrade(
              { cwd: fs.dir, deps: fs.join('deps.yaml') },
              { policy: { mode: 'none' } },
            );

            expect(result.totals).to.eql({
              dependencies: 2,
              allowed: 0,
              blocked: 2,
              planned: 0,
            });
            expect(result.policy.decisions.every((decision) => !decision.ok)).to.eql(true);
            expect(result.graph).to.eql({ nodes: [], edges: [], unresolved: [] });
            expect(result.topological).to.eql({ ok: true, items: [] });
          },
        );
      },
    );
  });

  it('preserves collection failures while still composing the remaining plan', async () => {
    const fs = await Testing.dir('WorkspaceUpgrade.upgrade.partial');
    await writeDepsYaml(fs, `
      deno.json:
        - import: jsr:@sys/std@0.0.1
        - import: npm:react@18.2.0
        - import: npm:zod@3.20.0
    `);

    await withVersions(
      {
        jsr: { '@sys/std': versionsJsr('@sys/std', '0.0.3', { '0.0.1': {}, '0.0.3': {} }) },
        npm: {
          react: versionsNpm('react', '19.0.0', { '18.2.0': {}, '19.0.0': {} }),
          zod: fetchFail('https://registry.npmjs.org/zod'),
        },
      },
      async () => {
        await withInfo(
          {
            jsr: { '@sys/std@0.0.3': infoJsr('@sys/std', '0.0.3') },
            npm: { 'react@19.0.0': infoNpm('react', '19.0.0') },
          },
          async () => {
            const result = await WorkspaceUpgrade.upgrade(
              { cwd: fs.dir, deps: fs.join('deps.yaml') },
              { policy: { mode: 'latest' } },
            );

            expect(result.collect.totals).to.eql({
              dependencies: 3,
              collected: 2,
              skipped: 0,
              failed: 1,
            });
            expect(result.collect.uncollected[0]?.entry.module.name).to.eql('zod');
            expect(result.collect.uncollected[0]?.reason.code).to.eql('registry:fetch');
            expect(result.graph.unresolved).to.eql([
              {
                entry: result.collect.candidates.find((item) => item.entry.module.name === '@sys/std')!.entry,
                reason: {
                  code: 'registry:graph-unsupported',
                  message: 'JSR dependency graph derivation is not implemented yet',
                },
              },
            ]);
            expect(result.totals).to.eql({
              dependencies: 3,
              allowed: 2,
              blocked: 0,
              planned: 2,
            });
          },
        );
      },
    );
  });
});
