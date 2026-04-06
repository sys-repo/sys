import { cli as tmplCli } from '@sys/tmpl';

import { Cli, Fs, Process, type t } from './common.ts';
import { InfoFmt } from '../m.fmt/u.info.ts';
import { ListenFmt } from '../m.fmt/u.listen.ts';
import { print } from '../m.fmt/u.shared.ts';
import { prepare } from '../m.pipeline/u.prepare.ts';
import { executeStage } from '../m.stage/u.executeStage.ts';

export async function createDeployableRepoPkg(): Promise<{
  readonly root: t.StringDir;
  readonly pkgDir: t.StringDir;
}> {
  const root = await createPublishedRepoFixture();
  const pkgDir = Fs.join(root, 'code', 'projects', 'foo');
  await createPkg(root, 'code/projects/foo', '@tmp/foo');
  await createPkg(root, 'code/projects/bar', '@tmp/bar');
  await createPkg(root, 'code/projects/baz', '@tmp/baz');
  await Fs.write(
    Fs.join(root, 'code', 'projects', 'foo', 'src', 'mod.ts'),
    `import { bar } from '../../bar/src/mod.ts';\nexport default 'foo-default';\nexport const foo = \`foo-\${bar}\`;\n`,
  );
  await runPrep(root);

  return { root, pkgDir };
}

export async function prepareStageForExistingApp(stage: t.DenoDeploy.Stage.Result) {
  return await prepare(stage);
}

export async function prepareStageForCreate(args: {
  readonly app: string;
  readonly org?: string;
  readonly token?: string;
}) {
  const { pkgDir } = await createDeployableRepoPkg();

  const interactive = wrangle.interactive();
  let spin: ReturnType<typeof ListenFmt.spinner> | undefined;
  const status = (text: string) => {
    if (!interactive) {
      print([text]);
      return;
    }

    if (spin) {
      spin.text = text;
      return;
    }

    spin = ListenFmt.spinner(text).start();
  };

  const stage = await executeStage(
    {
      target: { dir: pkgDir },
      root: { kind: 'temp' },
    },
    {
      onRoot({ root }) {
        print(InfoFmt.Deploy.config({
          app: args.app,
          ...(args.org ? { org: args.org } : {}),
          ...(args.token ? { token: args.token } : {}),
          sourceDir: pkgDir,
          stagedDir: root,
        }));
        status(ListenFmt.spinnerText('preparing staged root...'));
      },
      onBuildStart() {
        status(ListenFmt.spinnerText('building package in source workspace...'));
      },
      onStageStart() {
        status(ListenFmt.stageSpinnerText());
      },
      onBuildFailed(ctx) {
        spin?.stop();
        print(InfoFmt.Deploy.failure({ phase: 'build', error: ctx.error }));
      },
      onStageFailed(ctx) {
        spin?.stop();
        print(InfoFmt.Deploy.failure({ phase: 'stage', error: ctx.error }));
      },
    },
  );

  let prepared;
  try {
    prepared = await prepare(stage);
  } catch (error) {
    spin?.stop();
    print(InfoFmt.Deploy.failure({ phase: 'prepare', error }));
    throw error;
  }
  spin?.stop();
  await sanitizePreparedRootForCreate(prepared.stagedDir);
  print(InfoFmt.Staged.entrypoint(prepared));
  return prepared;
}

async function createPublishedRepoFixture(): Promise<t.StringDir> {
  const root = (await Fs.makeTempDir({ prefix: 'sys.tmpl.deploy.repo.' })).absolute as t.StringDir;
  await quietly(() =>
    tmplCli(root, {
      _: ['repo'],
      tmpl: 'repo',
      interactive: false,
      dryRun: false,
      force: true,
      bundle: false,
      dir: '.',
      help: false,
      'no-interactive': true,
    }),
  );
  return root;
}

async function createPkg(root: t.StringDir, dir: string, pkgName: string) {
  await quietly(() =>
    tmplCli(root, {
      _: ['pkg'],
      tmpl: 'pkg',
      interactive: false,
      dryRun: false,
      force: true,
      bundle: false,
      dir,
      pkgName,
      help: false,
      'no-interactive': true,
    }),
  );
}

async function runPrep(root: t.StringDir): Promise<void> {
  const out = await Process.invoke({
    cmd: 'deno',
    args: ['task', 'prep'],
    cwd: root,
    silent: true,
  });
  if (out.success) return;

  throw new Error(`Failed to prepare generated deploy fixture:\n${out.text.stderr.trim()}`);
}

async function quietly<T>(run: () => Promise<T>): Promise<T> {
  const info = console.info;
  const warn = console.warn;
  try {
    console.info = () => undefined;
    console.warn = () => undefined;
    return await run();
  } finally {
    console.info = info;
    console.warn = warn;
  }
}

const wrangle = {
  interactive() {
    try {
      return Deno.stdin.isTerminal() && Deno.stdout.isTerminal();
    } catch {
      return false;
    }
  },

  spinnerText(text: string) {
    return Cli.Fmt.spinnerText(text);
  },
} as const;

async function sanitizePreparedRootForCreate(root: string) {
  const path = Fs.join(root, 'deno.json');
  const res = await Fs.readJson<Record<string, unknown>>(path);
  if (!res.ok || !res.data) throw new Error(`Failed to read staged deno.json: ${path}`);

  const current = res.data;
  const { deploy, ...rest } = current;
  void deploy;
  await Fs.write(path, `${JSON.stringify(rest, null, 2)}\n`);
}
