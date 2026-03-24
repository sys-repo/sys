import { Fs } from '@sys/fs';
import type * as t from '../src/types.ts';
import { WorkspaceCli } from '../src/m.cli/mod.ts';
import * as fixture from '../src/m.upgrade/-test/u.fixture.ts';

type CliSandbox = {
  readonly cwd: string;
  readonly argv: readonly string[];
  run(): Promise<t.WorkspaceCli.Result>;
};

export async function createCliSandbox(argv: readonly string[]): Promise<CliSandbox> {
  const sandbox = await Fs.makeTempDir({ prefix: 'workspace-cli-' });
  const cwd = sandbox.absolute;
  const nextArgv = argv.filter((value, index) => !(value === '--' && index === 0));

  await fixture.writeDepsYaml(
    sandbox,
    `
    deno.json:
      - import: jsr:@std/path@1.0.7
      - import: npm:react-dom@18.2.0
      - import: npm:react@18.2.0
  `,
  );

  await Fs.writeJson(Fs.join(cwd, 'deno.json'), {
    name: 'workspace-cli-sandbox',
    tasks: { dev: 'deno task dev' },
  });

  return {
    cwd,
    argv: nextArgv,
    async run() {
      let result: t.WorkspaceCli.Result | undefined;

      await fixture.withVersions(
        {
          jsr: {
            '@std/path': fixture.versionsJsr('@std/path', '1.0.8', {
              '1.0.7': {},
              '1.0.8': {},
            }),
          },
          npm: {
            react: fixture.versionsNpm('react', '19.0.0', { '18.2.0': {}, '19.0.0': {} }),
            'react-dom': fixture.versionsNpm('react-dom', '19.0.0', { '18.2.0': {}, '19.0.0': {} }),
          },
        },
        async () => {
          await fixture.withInfo(
            {
              jsr: {
                '@std/path@1.0.8': fixture.infoJsr(
                  '@std/path',
                  '1.0.8',
                  fixture.graphJsr(2, [
                    {
                      path: '/mod.ts',
                      dependencies: [{ specifier: 'jsr:@std/fs@1.0.8', kind: 'import' }],
                    },
                  ]),
                ),
              },
              npm: {
                'react@19.0.0': fixture.infoNpm('react', '19.0.0'),
                'react-dom@19.0.0': fixture.infoNpm('react-dom', '19.0.0', { react: '^19.0.0' }),
              },
            },
            async () => {
              result = await WorkspaceCli.run({ cwd, argv: nextArgv });
            },
          );
        },
      );

      if (!result) throw new Error('Workspace CLI sandbox run did not produce a result.');
      return result;
    },
  };
}
