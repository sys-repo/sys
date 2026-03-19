import { cli as tmplCli } from '@sys/tmpl';

import { Fs, type t } from './common.ts';
import { prepare } from '../m.pipeline/u.prepare.ts';

export async function createDeployableRepoPkg(): Promise<{
  readonly root: t.StringDir;
  readonly pkgDir: t.StringDir;
}> {
  const root = await createPublishedRepoFixture();
  const pkgDir = Fs.join(root, 'code', 'projects', 'foo');

  await quietly(() =>
    tmplCli(root, {
      _: ['pkg'],
      tmpl: 'pkg',
      interactive: false,
      dryRun: false,
      force: true,
      bundle: false,
      dir: 'code/projects/foo',
      pkgName: '@tmp/foo',
      help: false,
      'no-interactive': true,
    }),
  );

  return { root, pkgDir };
}

export async function prepareStageForExistingApp(stage: t.DenoDeploy.Stage.Result) {
  return await prepare(stage);
}

async function createPublishedRepoFixture(): Promise<t.StringDir> {
  const root = (await Fs.makeTempDir({ prefix: 'tmpl.deploy.repo.' })).absolute as t.StringDir;
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

async function quietly<T>(run: () => Promise<T>): Promise<T> {
  const info = console.info;
  const log = console.log;
  const warn = console.warn;
  try {
    console.info = () => undefined;
    console.log = () => undefined;
    console.warn = () => undefined;
    return await run();
  } finally {
    console.info = info;
    console.log = log;
    console.warn = warn;
  }
}
