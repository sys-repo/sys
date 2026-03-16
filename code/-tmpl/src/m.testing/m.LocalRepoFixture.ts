import { type t, Fs } from './common.ts';
import { cli } from '../m.tmpl/mod.ts';
import { LocalRepoAuthorities } from './m.LocalRepoAuthorities.ts';
import { resolveFixtureRoot } from './u.fixture.root.ts';

export const LocalRepoFixture: t.TmplTesting.LocalRepoFixtureLib = {
  async create(args = {}) {
    if (args.dryRun === true) {
      const err = 'LocalRepoFixture.create does not support dryRun because it returns a materialized repo.';
      throw new Error(err);
    }

    const cwd = args.cwd ?? Fs.cwd('terminal');
    const target = await resolveFixtureRoot(cwd, args.targetDir);

    await cli(target.parent, {
      _: ['repo'],
      tmpl: 'repo',
      interactive: false,
      dryRun: false,
      force: args.force === true,
      bundle: false,
      dir: target.dir,
      help: false,
      'no-interactive': true,
    });

    const authorities = await LocalRepoAuthorities.rewrite({ root: target.root });
    return { root: target.root, authorities };
  },
};
