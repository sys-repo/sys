import * as StdFs from '@std/fs';

import { describe, expect, it } from '../../-test.ts';
import { Glob } from '../../m.Glob/mod.ts';
import { Path } from '../common.ts';
import { Fs } from '../mod.ts';

describe('Fs: filesystem', () => {
  it('API', () => {
    expect(Fs.glob).to.equal(Glob.create);
    expect(Fs.ls).to.equal(Glob.ls);
    expect(Fs.trimCwd).to.equal(Path.trimCwd);

    expect(Fs.ensureDir).to.eql(StdFs.ensureDir);
    expect(Fs.ensureSymlink).to.eql(StdFs.ensureSymlink);
    expect(Fs.move).to.eql(StdFs.move);
  });

  describe('Fs.cwd', () => {
    it('returns the CWD', () => {
      expect(Fs.cwd()).to.eql(Deno.cwd());
      expect(Fs.cwd('process')).to.eql(Deno.cwd());
    });

    it('returns the initiating terminal CWD', () => {
      const dir = Fs.cwd('terminal');
      expect(dir).to.eql(Deno.env.get('INIT_CWD'));
    });
  });

  describe('Fs.expandTilde', () => {
    const ORIGINAL_HOME = Deno.env.get('HOME') ?? undefined;

    const restoreHome = () => {
      if (ORIGINAL_HOME == null) {
        if (Deno.env.get('HOME') != null) Deno.env.delete('HOME');
      } else {
        Deno.env.set('HOME', ORIGINAL_HOME);
      }
    };

    it('returns input unchanged when HOME is not set', () => {
      Deno.env.delete('HOME');

      const input = '~/foo/bar';
      const res = Fs.expandTilde(input);
      expect(res).to.eql(input);

      restoreHome();
    });

    it('expands "~" to HOME', () => {
      Deno.env.set('HOME', '/Users/tester');

      const res = Fs.expandTilde('~');
      expect(res).to.eql('/Users/tester');

      restoreHome();
    });

    it('expands "~/foo/bar" to HOME-prefixed path', () => {
      Deno.env.set('HOME', '/Users/tester');

      const res = Fs.expandTilde('~/foo/bar');
      expect(res).to.eql('/Users/tester/foo/bar');

      restoreHome();
    });

    it('does not touch non-tilde paths or "~user" forms', () => {
      Deno.env.set('HOME', '/Users/tester');

      expect(Fs.expandTilde('/absolute/path')).to.eql('/absolute/path');
      expect(Fs.expandTilde('relative/path')).to.eql('relative/path');
      expect(Fs.expandTilde('~otheruser/foo')).to.eql('~otheruser/foo');

      restoreHome();
    });
  });
});
