import { describe, expect, it } from '../../-test.ts';
import { AliasResolver } from '../mod.ts';

const expand = AliasResolver.expand;

describe('AliasResolver.expand', () => {
  it('returns identity for paths with no alias tokens', () => {
    const map = {};
    const res = expand('/slug/data/prog.core', map as any);

    expect(res.value).to.eql('/slug/data/prog.core');
    expect(res.used).to.eql([]);
    expect(res.remaining).to.eql([]);
  });

  it('expands a single alias', () => {
    const map = {
      ':core': '/slug/data/prog.core',
    };

    const res = expand('/:core', map);

    // NB: pure replacement → the leading "/" from the call-site is preserved,
    // plus the leading "/" in the alias value → "//slug/data/prog.core".
    expect(res.value).to.eql('//slug/data/prog.core');
    expect(res.used).to.eql([':core']);
    expect(res.remaining).to.eql([]);
  });

  it('expands nested aliases in multiple passes', () => {
    const map = {
      ':index': 'crdt:123',
      ':core': '/slug/data/prog.core',
      ':core-slugs': '/:index/alias/:core',
    };

    const res = expand('/:core-slugs/3.1-foo', map);

    // Expansion steps:
    //   "/:core-slugs/3.1-foo"
    //   → "//:index/alias/:core/3.1-foo"
    //   → "//crdt:123/alias/:core/3.1-foo"
    //   → "//crdt:123/alias//slug/data/prog.core/3.1-foo"
    expect(res.value).to.eql('//crdt:123/alias//slug/data/prog.core/3.1-foo');
    expect(res.used).to.include.members([':core-slugs', ':index', ':core']);
    expect(res.remaining).to.eql([]);
  });

  it('leaves unresolved aliases in place and reports them in "remaining"', () => {
    const map = {
      ':core': '/slug/data/prog.core',
      ':core-slugs': '/:index/alias/:core',
    };

    const res = expand('/:core-slugs/3.1-foo', map);

    // ":index" has no mapping, so it stays in the final string.
    // Steps:
    //   "/:core-slugs/3.1-foo"
    //   → "//:index/alias/:core/3.1-foo"
    //   → "//:index/alias//slug/data/prog.core/3.1-foo"
    expect(res.value).to.eql('//:index/alias//slug/data/prog.core/3.1-foo');
    expect(res.used).to.include.members([':core-slugs', ':core']);
    expect(res.remaining).to.eql([':index']);
  });

  it('deduplicates remaining tokens but may record used tokens multiple times', () => {
    const map = {
      ':core': '/slug/data/prog.core',
    };

    const res = expand('/:core/x/:core/y', map);

    // Both ":core" occurrences are replaced; we don’t normalize the "//".
    expect(res.value).to.eql('//slug/data/prog.core/x//slug/data/prog.core/y');
    expect(res.used).to.include(':core'); // may appear more than once
    expect(res.remaining).to.eql([]); // all aliases resolved
  });

  it('honors maxDepth to prevent infinite cycles', () => {
    const map = {
      ':a': '/:b',
      ':b': '/:a',
    };

    const res = expand('/:a/path', map, { maxDepth: 1 });

    // One pass:
    //   "/:a/path" → "//:b/path"
    expect(res.value).to.eql('//:b/path');
    expect(res.used).to.eql([':a']);
    expect(res.remaining).to.eql([':b']);
  });

  it('eventually stops on cycles with default maxDepth and reports remaining aliases', () => {
    const map = {
      ':a': '/:b',
      ':b': '/:a',
    };

    const res = expand('/:a/path', map);

    // We don’t care about the exact final string here, only that:
    // - expansion did something
    // - some alias tokens remain (cycle not fully resolvable)
    expect(res.used.length).to.be.greaterThan(0);
    expect(res.remaining.length).to.be.greaterThan(0);
  });
});
