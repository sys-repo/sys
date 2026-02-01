import { describe, expect, it } from '../../-test.ts';
import { Schema } from '../common.ts';
import { SchemaSlugTreeFs } from '../schema/mod.ts';

describe('SchemaSlugTreeFs', () => {
  it('accepts minimal crdt config', () => {
    const doc = {
      crdt: {
        docid: 'slug:test',
        path: '/slug',
      },
    };
    const ok = Schema.Value.Check(SchemaSlugTreeFs, doc);
    expect(ok).to.eql(true);
  });

  it('accepts slug-tree target.manifest string', () => {
    const doc = {
      crdt: { docid: 'slug:test', path: '/slug' },
      target: {
        manifest: './out/slug-tree.json',
      },
    };
    const ok = Schema.Value.Check(SchemaSlugTreeFs, doc);
    expect(ok).to.eql(true);
  });

  it('accepts slug-tree target.manifest array', () => {
    const doc = {
      crdt: { docid: 'slug:test', path: '/slug' },
      target: {
        manifest: ['./out/slug-tree.json', './out/slug-tree.yaml'],
      },
    };
    const ok = Schema.Value.Check(SchemaSlugTreeFs, doc);
    expect(ok).to.eql(true);
  });

  it('accepts slug-tree target.dir array', () => {
    const doc = {
      crdt: { docid: 'slug:test', path: '/slug' },
      target: {
        dir: [
          { kind: 'source', path: './out/source' },
          { kind: 'sha256', path: './out/sha256' },
        ],
      },
    };
    const ok = Schema.Value.Check(SchemaSlugTreeFs, doc);
    expect(ok).to.eql(true);
  });

  it('accepts slug-tree shape with source + include + ignore + sort + readmeAsIndex', () => {
    const doc = {
      source: './docs',
      include: ['.md'],
      ignore: ['node_modules'],
      sort: true,
      readmeAsIndex: false,
      crdt: { docid: 'slug:test', path: '/slug' },
    };
    const ok = Schema.Value.Check(SchemaSlugTreeFs, doc);
    expect(ok).to.eql(true);
  });

  it('accepts slug-tree target.dir object', () => {
    const doc = {
      crdt: { docid: 'slug:test', path: '/slug' },
      target: {
        dir: { kind: 'source', path: './out/source' },
      },
    };
    const ok = Schema.Value.Check(SchemaSlugTreeFs, doc);
    expect(ok).to.eql(true);
  });

  it('accepts slug-tree target.dir string', () => {
    const doc = {
      crdt: { docid: 'slug:test', path: '/slug' },
      target: {
        dir: './out/source',
      },
    };
    const ok = Schema.Value.Check(SchemaSlugTreeFs, doc);
    expect(ok).to.eql(true);
  });

  it('rejects slug-tree config without crdt.docid', () => {
    const doc = {
      crdt: { path: '/slug' },
    };
    const ok = Schema.Value.Check(SchemaSlugTreeFs, doc);
    expect(ok).to.eql(false);
  });
});
