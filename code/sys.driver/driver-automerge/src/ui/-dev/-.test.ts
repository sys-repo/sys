import { describe, expect, it } from '../../-test.ts';
import { CrdtObjectView, Dev } from './mod.ts';

describe('Crdt: Layout', () => {
  it('API', async () => {
    const m = await import('@sys/driver-automerge/web/ui');
    expect(m.Crdt.UI.Dev).to.equal(Dev);
    expect(m.Dev).to.equal(Dev);
    expect(m.Dev.ObjectView).to.equal(CrdtObjectView);
  });

  describe('<ObjectView> JSON paths:', () => {
    describe('Dev.fieldFromPath', () => {
      it('returns "doc:(none)" for undefined path', () => {
        expect(Dev.fieldFromPath()).to.eql('doc:(none)');
      });

      it('joins path segments with "/" and prefixes with a leading "/"', () => {
        const res = Dev.fieldFromPath(['yaml', 'parsed']);
        expect(res).to.eql('doc:/yaml/parsed');
      });

      it('replaces "." with ":" within segments', () => {
        const res = Dev.fieldFromPath(['foo.bar', 'baz']);
        expect(res).to.eql('doc:/foo:bar/baz');
      });

      it('applies custom prefix', () => {
        const res = Dev.fieldFromPath(['slug', 'props'], { prefix: 'slug' });
        expect(res).to.eql('slug:/slug/props');
      });

      it('handles empty path array → "(none)"', () => {
        const res = Dev.fieldFromPath([]);
        expect(res).to.eql('doc:(none)');
      });
    });

    describe('Dev.expandPaths', () => {
      it('returns ["$"] when called with empty list', () => {
        expect(Dev.expandPaths([])).to.eql(['$']);
      });

      it('expands a single path', () => {
        const res = Dev.expandPaths([['yaml', 'parsed']]);
        expect(res).to.eql(['$', '$.doc:/yaml/parsed']);
      });

      it('expands multiple paths', () => {
        const res = Dev.expandPaths([
          ['yaml', 'parsed'],
          ['slug', 'props'],
        ]);
        expect(res).to.eql(['$', '$.doc:/yaml/parsed', '$.doc:/slug/props']);
      });

      it('applies custom prefix', () => {
        const res = Dev.expandPaths([['slug', 'props']], { prefix: 'slug' });
        expect(res).to.eql(['$', '$.slug:/slug/props']);
      });

      it('ignores empty path arrays', () => {
        const res = Dev.expandPaths([[]]);
        expect(res).to.eql(['$']);
      });

      it('replaces "." with ":" in nested segments', () => {
        const res = Dev.expandPaths([['foo.bar', 'baz']]);
        expect(res).to.eql(['$', '$.doc:/foo:bar/baz']);
      });
    });
  });
});
