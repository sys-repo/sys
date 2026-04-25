import { describe, expect, it } from '../../-test.ts';
import { terminalCwd } from '../u.cwd.ts';

describe('Root CWD', () => {
  it('ignores stale INIT_CWD and uses the direct process cwd', () => {
    const key = 'INIT_CWD';
    const before = Deno.env.get(key);

    try {
      Deno.env.set(key, '/tmp/sys-tools-root-cwd');
      expect(terminalCwd()).to.eql(Deno.cwd());
    } finally {
      before === undefined ? Deno.env.delete(key) : Deno.env.set(key, before);
    }
  });

  it('matches Deno.cwd() when INIT_CWD is absent', () => {
    const key = 'INIT_CWD';
    const before = Deno.env.get(key);

    try {
      Deno.env.delete(key);
      expect(terminalCwd()).to.eql(Deno.cwd());
    } finally {
      before === undefined ? Deno.env.delete(key) : Deno.env.set(key, before);
    }
  });
});
