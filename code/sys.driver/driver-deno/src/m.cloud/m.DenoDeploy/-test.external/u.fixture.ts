import { cli as tmplCli } from '@sys/tmpl';

import { type t, Fs } from './common.ts';
import { prepare } from '../m.pipeline/u.prepare.ts';
import { Fmt } from '../u.fmt.ts';

export async function createDeployableRepoPkg(): Promise<{
  readonly root: t.StringDir;
  readonly pkgDir: t.StringDir;
}> {
  const root = await createPublishedRepoFixture();
  const pkgDir = Fs.join(root, 'code', 'projects', 'foo');

  await tmplCli(root, {
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
  });

  return { root, pkgDir };
}

export async function snapshotPackageDenoJson() {
  const path = Fs.Path.fromFileUrl(new URL('../../../../deno.json', import.meta.url));
  const text = (await Fs.readText(path)).data ?? '';
  return { path, text } as const;
}

export async function restorePackageDenoJsonIfPolluted(snapshot: { readonly path: string; readonly text: string }) {
  const current = (await Fs.readText(snapshot.path)).data ?? '';
  if (current === snapshot.text) return;
  await Fs.write(snapshot.path, snapshot.text);
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

export async function prepareStageForExistingApp(stage: t.DenoDeploy.Stage.Result) {
  return await prepare(stage);
}

export function printDeployEntrypointInfo(args: {
  readonly stagedDir: string;
  readonly entrypoint: string;
  readonly entryPaths: string;
  readonly appEntrypoint: string;
  readonly workspaceTarget: string;
  readonly distDir: string;
}) {
  for (const line of Fmt.info({
    title: 'Staged Deploy Entrypoint',
    rows: [
      { label: 'staged dir', value: args.stagedDir, color: 'white' },
      { label: 'entry', value: args.entrypoint, color: 'white' },
      { label: 'entry paths', value: args.entryPaths, color: 'white' },
      { label: 'app config', value: args.appEntrypoint, color: 'white' },
      { label: 'workspace', value: args.workspaceTarget, color: 'white' },
      { label: 'dist', value: args.distDir, color: 'white' },
    ],
  })) {
    console.info(line);
  }
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
