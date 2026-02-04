import { describe, expect, it, Pkg } from '../../../-test.ts';
import { Schema } from '../../common.ts';
import { SchemaSlugTreeFs } from '../mod.ts';

describe('SchemaSlugTreeFs', () => {
  it('accepts minimal slug-tree fs config', () => {
    const doc = {
      docid: 'kb',
    };
    const ok = Schema.Value.Check(SchemaSlugTreeFs, doc);
    expect(ok).to.eql(true);
  });

  it('accepts slug-tree target.manifests string', () => {
    const doc = {
      docid: 'kb',
      target: {
        manifests: './out/slug-tree.json',
      },
    };
    const ok = Schema.Value.Check(SchemaSlugTreeFs, doc);
    expect(ok).to.eql(true);
  });

  it('accepts slug-tree target.manifests array', () => {
    const doc = {
      docid: 'kb',
      target: {
        manifests: ['./out/slug-tree.json', './out/slug-tree.yaml'],
      },
    };
    const ok = Schema.Value.Check(SchemaSlugTreeFs, doc);
    expect(ok).to.eql(true);
  });

  it('accepts slug-tree target.dir array', () => {
    const doc = {
      docid: 'kb',
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
      docid: 'kb',
    };
    const ok = Schema.Value.Check(SchemaSlugTreeFs, doc);
    expect(ok).to.eql(true);
  });

  it('accepts slug-tree target.dir object', () => {
    const doc = {
      docid: 'kb',
      target: {
        dir: { kind: 'source', path: './out/source' },
      },
    };
    const ok = Schema.Value.Check(SchemaSlugTreeFs, doc);
    expect(ok).to.eql(true);
  });

  it('accepts slug-tree target.dir string', () => {
    const doc = {
      docid: 'kb',
      target: {
        dir: './out/source',
      },
    };
    const ok = Schema.Value.Check(SchemaSlugTreeFs, doc);
    expect(ok).to.eql(true);
  });

  it('accepts slug-tree config without docid', () => {
    const doc = {
      source: './docs',
    };
    const ok = Schema.Value.Check(SchemaSlugTreeFs, doc);
    expect(ok).to.eql(true);
  });
});
