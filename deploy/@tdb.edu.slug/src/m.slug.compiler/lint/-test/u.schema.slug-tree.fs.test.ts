import { describe, expect, it } from '../../-test.ts';
import { LintProfileSchema } from '../u.schema.ts';
import { Yaml } from '../common.ts';

describe('LintProfileSchema', () => {
  it('accepts the initial document', () => {
    const doc = LintProfileSchema.initial();
    const res = LintProfileSchema.validate(doc);
    expect(res.ok).to.eql(true);
    expect(res.errors.length).to.eql(0);
  });

  it('rejects unknown facets', () => {
    const doc = {
      facets: ['aliases', 'nope:facet'],
    };
    const res = LintProfileSchema.validate(doc);
    expect(res.ok).to.eql(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });

  it('rejects unknown fields', () => {
    const doc = {
      facets: ['aliases'],
      other: { value: 1 },
    };
    const res = LintProfileSchema.validate(doc);
    expect(res.ok).to.eql(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });

  it('accepts crdt config shape', () => {
    const doc = {
      'bundle:slug-tree:fs': {
        crdt: {
          docid: 'slug:test',
          path: '/slug',
        },
      },
    };
    const res = LintProfileSchema.validate(doc);
    expect(res.ok).to.eql(true);
    expect(res.errors.length).to.eql(0);
  });

  it('accepts slug-tree target.manifest string', () => {
    const doc = {
      'bundle:slug-tree:fs': {
        crdt: { docid: 'slug:test', path: '/slug' },
        target: {
          manifest: './out/slug-tree.json',
        },
      },
    };
    const res = LintProfileSchema.validate(doc);
    expect(res.ok).to.eql(true);
    expect(res.errors.length).to.eql(0);
  });

  it('accepts slug-tree target.manifest array', () => {
    const doc = {
      'bundle:slug-tree:fs': {
        crdt: { docid: 'slug:test', path: '/slug' },
        target: {
          manifest: ['./out/slug-tree.json', './out/slug-tree.yaml'],
        },
      },
    };
    const res = LintProfileSchema.validate(doc);
    expect(res.ok).to.eql(true);
    expect(res.errors.length).to.eql(0);
  });

  it('accepts slug-tree target.dir array', () => {
    const doc = {
      'bundle:slug-tree:fs': {
        crdt: { docid: 'slug:test', path: '/slug' },
        target: {
          dir: [
            { kind: 'source', path: './out/source' },
            { kind: 'sha256', path: './out/sha256' },
          ],
        },
      },
    };
    const res = LintProfileSchema.validate(doc);
    expect(res.ok).to.eql(true);
    expect(res.errors.length).to.eql(0);
  });

  it('accepts slug-tree shape with source + include + ignore + sort + readmeAsIndex', () => {
    const doc = {
      'bundle:slug-tree:fs': {
        source: './docs',
        include: ['.md'],
        ignore: ['node_modules'],
        sort: true,
        readmeAsIndex: false,
        crdt: { docid: 'slug:test', path: '/slug' },
      },
    };
    const res = LintProfileSchema.validate(doc);
    expect(res.ok).to.eql(true);
    expect(res.errors.length).to.eql(0);
  });

  it('accepts slug-tree target.dir object', () => {
    const doc = {
      'bundle:slug-tree:fs': {
        crdt: { docid: 'slug:test', path: '/slug' },
        target: {
          dir: { kind: 'source', path: './out/source' },
        },
      },
    };
    const res = LintProfileSchema.validate(doc);
    expect(res.ok).to.eql(true);
    expect(res.errors.length).to.eql(0);
  });

  it('accepts slug-tree target.dir string', () => {
    const doc = {
      'bundle:slug-tree:fs': {
        crdt: { docid: 'slug:test', path: '/slug' },
        target: {
          dir: './out/source',
        },
      },
    };
    const res = LintProfileSchema.validate(doc);
    expect(res.ok).to.eql(true);
    expect(res.errors.length).to.eql(0);
  });

  it('rejects slug-tree config without crdt.docid', () => {
    const doc = {
      'bundle:slug-tree:fs': {
        crdt: { path: '/slug' },
      },
    };
    const res = LintProfileSchema.validate(doc);
    expect(res.ok).to.eql(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });

  it('round-trips initial YAML', () => {
    const yaml = LintProfileSchema.initialYaml();
    const parsed = Yaml.parse(yaml).data;
    expect(parsed).to.eql(LintProfileSchema.initial());
    const text = String(yaml);
    expect(text).to.contain('bundle:slug-tree:fs:');
    expect(text).to.contain('include: [.md]');
    expect(text).to.contain('crdt:');
    expect(text).to.contain('docid: <docid>');
    expect(text).to.contain('path: /slug');
    expect(text).to.contain('source: .');
    expect(text).to.contain('target:');
    expect(text).to.contain('manifest:');
    expect(text).to.contain('- ./manifest/slug-tree.json');
    expect(text).to.contain('- ./manifest/slug-tree.yaml');
    expect(text).to.not.contain('readmeAsIndex');
    expect(text).to.not.contain('sort:');
    expect(text).to.not.contain('ignore:');
  });
});
