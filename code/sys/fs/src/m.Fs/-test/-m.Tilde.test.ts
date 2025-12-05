import { describe, expect, it } from '../../-test.ts';
import { Fs } from '../mod.ts';

describe('Fs.Tilde', () => {
  const ORIGINAL_HOME = Deno.env.get('HOME') ?? undefined;

  const restoreHome = () => {
    if (ORIGINAL_HOME == null) {
      if (Deno.env.get('HOME') != null) Deno.env.delete('HOME');
    } else {
      Deno.env.set('HOME', ORIGINAL_HOME);
    }
  };

  describe('Tilde.expand', () => {
    it('returns input unchanged when HOME is not set', () => {
      Deno.env.delete('HOME');

      const input = '~/foo/bar';
      const res = Fs.Tilde.expand(input);
      expect(res).to.eql(input);

      restoreHome();
    });

    it('expands "~" to HOME', () => {
      Deno.env.set('HOME', '/Users/tester');

      const res = Fs.Tilde.expand('~');
      expect(res).to.eql('/Users/tester');

      restoreHome();
    });

    it('expands "~/foo/bar" to HOME-prefixed path', () => {
      Deno.env.set('HOME', '/Users/tester');

      const res = Fs.Tilde.expand('~/foo/bar');
      expect(res).to.eql('/Users/tester/foo/bar');

      restoreHome();
    });

    it('does not touch non-tilde paths or "~user" forms', () => {
      Deno.env.set('HOME', '/Users/tester');

      expect(Fs.Tilde.expand('/absolute/path')).to.eql('/absolute/path');
      expect(Fs.Tilde.expand('relative/path')).to.eql('relative/path');
      expect(Fs.Tilde.expand('~otheruser/foo')).to.eql('~otheruser/foo');

      restoreHome();
    });
  });

  describe('Tilde.collapse', () => {
    it('returns input unchanged when HOME is not set', () => {
      Deno.env.delete('HOME');

      const input = '/Users/tester/foo/bar';
      const res = Fs.Tilde.collapse(input);
      expect(res).to.eql(input);

      restoreHome();
    });

    it('collapses HOME directory to "~"', () => {
      Deno.env.set('HOME', '/Users/tester');

      const res = Fs.Tilde.collapse('/Users/tester');
      expect(res).to.eql('~');

      restoreHome();
    });

    it('collapses HOME directory with trailing slash to "~"', () => {
      Deno.env.set('HOME', '/Users/tester');

      const res = Fs.Tilde.collapse('/Users/tester/');
      expect(res).to.eql('~');

      restoreHome();
    });

    it('collapses HOME-prefixed path to "~/sub/path"', () => {
      Deno.env.set('HOME', '/Users/tester');

      const res = Fs.Tilde.collapse('/Users/tester/foo/bar');
      expect(res).to.eql('~/foo/bar');

      restoreHome();
    });

    it('does not collapse paths that only partially match HOME prefix', () => {
      Deno.env.set('HOME', '/Users/tester');

      const res = Fs.Tilde.collapse('/Users/tester2/foo');
      expect(res).to.eql('/Users/tester2/foo');

      restoreHome();
    });

    it('does not touch non-HOME paths', () => {
      Deno.env.set('HOME', '/Users/tester');

      expect(Fs.Tilde.collapse('/other/user/foo')).to.eql('/other/user/foo');
      expect(Fs.Tilde.collapse('relative/path')).to.eql('relative/path');

      restoreHome();
    });

    it('round-trips expand → collapse for "~"', () => {
      Deno.env.set('HOME', '/Users/tester');

      const expanded = Fs.Tilde.expand('~');
      const collapsed = Fs.Tilde.collapse(expanded);
      expect(collapsed).to.eql('~');

      restoreHome();
    });

    it('round-trips expand → collapse for "~/foo/bar"', () => {
      Deno.env.set('HOME', '/Users/tester');

      const input = '~/foo/bar';
      const expanded = Fs.Tilde.expand(input);
      const collapsed = Fs.Tilde.collapse(expanded);
      expect(collapsed).to.eql(input);

      restoreHome();
    });
  });
});
