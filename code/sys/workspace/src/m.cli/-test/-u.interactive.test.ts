import { describe, expect, Fs, it, Testing } from '../../-test.ts';
import { Cli } from '../common.ts';
import { runInteractive } from '../u.interactive.ts';
import * as fixture from '../../m.upgrade/-test/u.fixture.ts';

describe('Workspace.Cli.runInteractive', () => {
  it('applies only the explicitly picked blocked dependency', async () => {
    const fs = await Testing.dir('WorkspaceCli.runInteractive.picked-blocked-only');
    await fixture.writeDepsYaml(
      fs,
      `
      deno.json:
        - import: npm:happy-dom@20.8.4
        - import: npm:react-spinners@0.17.0
      `,
    );
    await Fs.writeJson(fs.join('deno.json'), { name: 'interactive-upgrade-app' });

    await fixture.withVersions(
      {
        jsr: {},
        npm: {
          'happy-dom': fixture.versionsNpm('happy-dom', '20.8.8', {
            '20.8.4': {},
            '20.8.8': {},
          }),
          'react-spinners': fixture.versionsNpm('react-spinners', '1.0.0', {
            '0.17.0': {},
            '1.0.0': {},
          }),
        },
      },
      async () => {
        await fixture.withInfo(
          {
            jsr: {},
            npm: {
              'happy-dom@20.8.8': fixture.infoNpm('happy-dom', '20.8.8'),
              'react-spinners@1.0.0': fixture.infoNpm('react-spinners', '1.0.0'),
            },
          },
          async () => {
            const original = Cli.Input.Checkbox.prompt;

            Object.defineProperty(Cli.Input.Checkbox, 'prompt', {
              value: async () => ['react-spinners'],
            });

            try {
              const result = await runInteractive(
                { cwd: fs.dir, deps: fs.join('deps.yaml') },
                {
                deps: fs.join('deps.yaml'),
                mode: 'interactive',
                policy: 'minor',
                prerelease: false,
                include: [],
                exclude: [],
                dryRun: false,
              },
            );

              expect(result.selection).to.eql({
                include: ['react-spinners'],
                exclude: ['happy-dom'],
              });
              expect(result.applied).to.not.eql(undefined);
              expect(result.applied?.entries.map((entry) => entry.module.toString())).to.eql([
                'npm:happy-dom@20.8.4',
                'npm:react-spinners@1.0.0',
              ]);
            } finally {
              Object.defineProperty(Cli.Input.Checkbox, 'prompt', { value: original });
            }
          },
        );
      },
    );
  });
});
