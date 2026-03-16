import { cli as tmplCli } from '@sys/tmpl';
import { TmplTesting } from '@sys/tmpl/testing';

import { type t, Fs } from './common.ts';

export async function createDeployableRepoPkg(): Promise<{
  readonly root: t.StringDir;
  readonly pkgDir: t.StringDir;
}> {
  const fixture = await TmplTesting.LocalRepoFixture.create({ silent: true });
  const root = fixture.root;
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
