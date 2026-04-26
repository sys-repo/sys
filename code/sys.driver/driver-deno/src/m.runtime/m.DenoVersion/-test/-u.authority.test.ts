import { describe, expect, it } from '../../../-test.ts';
import { detect, toAuthorityKind } from '../u.authority.ts';
import { procOutput } from './u.fixture.ts';

describe('DenoVersion.Authority', () => {
  it('classifies Homebrew cellar paths', () => {
    const res = toAuthorityKind('/opt/homebrew/Cellar/deno/2.7.13/bin/deno');
    expect(res).to.eql('brew');
  });

  it('classifies `~/.deno/bin/deno` as `deno-upgrade`', () => {
    const res = toAuthorityKind('/Users/tester/.deno/bin/deno', '/Users/tester');
    expect(res).to.eql('deno-upgrade');
  });

  it('classifies unknown paths conservatively', () => {
    const res = toAuthorityKind('/tmp/custom/bin/deno', '/Users/tester');
    expect(res).to.eql('unknown');
  });

  it('detects authority from a looked-up command path', async () => {
    const res = await detect({ cmd: 'deno-custom' }, {
      which: async () => procOutput('/opt/homebrew/bin/deno\n'),
      realPath: async () => '/opt/homebrew/Cellar/deno/2.7.13/bin/deno',
      home: () => '/Users/tester',
      execPath: () => '/ignored',
    });

    expect(res).to.eql({
      ok: true,
      data: {
        kind: 'brew',
        path: '/opt/homebrew/Cellar/deno/2.7.13/bin/deno',
      },
      error: undefined,
    });
  });

  it('falls back to `unknown` when command lookup yields no path', async () => {
    const res = await detect({ cmd: 'missing-deno' }, {
      which: async () => procOutput('', { success: false, code: 1 }),
      home: () => '/Users/tester',
      execPath: () => '/ignored',
    });

    expect(res).to.eql({
      ok: true,
      data: {
        kind: 'unknown',
        path: undefined,
      },
      error: undefined,
    });
  });
});
