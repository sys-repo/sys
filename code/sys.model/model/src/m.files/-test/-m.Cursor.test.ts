import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Cursor } from '../m.Cursor/mod.ts';
import { Files } from '../mod.ts';

describe('Files.Cursor', () => {
  it('API', () => {
    expect(Files.Cursor).to.equal(Cursor);
    expect(Cursor.prefix).to.eql('files:cursor');
    expect(Cursor.version).to.eql('v1');
    expect(Cursor.Kind).to.eql({ list: 'list', watch: 'watch', manifest: 'manifest' });
    expectTypeOf(Cursor).toEqualTypeOf<t.Files.Cursor.Lib>();
  });

  it('create: returns versioned scoped cursor strings', () => {
    const list = Cursor.create('list', 'page-1');
    const watch = Cursor.create('watch', 'seq-20');
    const manifest = Cursor.create('manifest', 'page-2');

    expect(list).to.eql('files:cursor:list:v1:page-1');
    expect(watch).to.eql('files:cursor:watch:v1:seq-20');
    expect(manifest).to.eql('files:cursor:manifest:v1:page-2');

    expectTypeOf(list).toEqualTypeOf<t.Files.Cursor.List>();
    expectTypeOf(watch).toEqualTypeOf<t.Files.Cursor.Watch>();
    expectTypeOf(manifest).toEqualTypeOf<t.Files.Cursor.Manifest>();
  });

  it('create: rejects invalid runtime tokens', () => {
    expect(() => Cursor.create('list', '')).to.throw(
      'Files cursor token must be a non-empty string',
    );
    expect(() => Cursor.create('missing' as t.Files.Cursor.Kind, 'page-1')).to.throw(
      'Invalid Files cursor kind: missing',
    );
  });

  it('parse: returns structured opaque cursor metadata', () => {
    const cursor = Cursor.create('list', 'page:with:colons');
    const parsed = Cursor.parse(cursor);

    expect(parsed).to.eql({
      prefix: 'files:cursor',
      kind: 'list',
      version: 'v1',
      token: 'page:with:colons',
      value: cursor,
    });

    if (parsed) {
      expectTypeOf(parsed).toMatchTypeOf<t.Files.Cursor.Parsed>();
      if (parsed.kind === 'list') expectTypeOf(parsed.value).toEqualTypeOf<t.Files.Cursor.List>();
      expect(parsed.value).to.eql(cursor);
    }
  });

  it('parse: rejects malformed cursor strings', () => {
    const invalid = [
      undefined,
      '',
      'files:cursor:list:page-1',
      'files:cursor:list:v2:page-1',
      'files:cursor:read:v1:page-1',
      'files:cursor:list:v1:',
      'other:cursor:list:v1:page-1',
    ];

    const results = invalid.map((input) => Cursor.parse(input));
    expect(results).to.eql(invalid.map(() => undefined));
  });

  it('Is: narrows cursor strings by scope', () => {
    const list: unknown = Cursor.create('list', 'page-1');
    const watch: unknown = Cursor.create('watch', 'seq-1');
    const manifest: unknown = Cursor.create('manifest', 'page-1');

    expect(Cursor.Is.cursor(list)).to.eql(true);
    expect(Cursor.Is.list(list)).to.eql(true);
    expect(Cursor.Is.watch(list)).to.eql(false);
    expect(Cursor.Is.manifest(list)).to.eql(false);
    expect(Cursor.Is.kind('list', list)).to.eql(true);
    expect(Cursor.Is.kind('manifest', list)).to.eql(false);

    if (Cursor.Is.list(list)) expectTypeOf(list).toEqualTypeOf<t.Files.Cursor.List>();
    if (Cursor.Is.watch(watch)) expectTypeOf(watch).toEqualTypeOf<t.Files.Cursor.Watch>();
    if (Cursor.Is.manifest(manifest)) {
      expectTypeOf(manifest).toEqualTypeOf<t.Files.Cursor.Manifest>();
    }
  });
});
