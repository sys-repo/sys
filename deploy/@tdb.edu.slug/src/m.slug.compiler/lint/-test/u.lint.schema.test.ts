import { describe, expect, it } from '../../-test.ts';
import { LintProfileSchema } from '../u.lint.schema.ts';
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

  it('accepts crdt target shape', () => {
    const doc = {
      'fs:slug-tree': {
        target: {
          crdt: {
            ref: 'crdt:abc123',
            path: 'data/venture.library.examples',
          },
        },
      },
    };
    const res = LintProfileSchema.validate(doc);
    expect(res.ok).to.eql(true);
    expect(res.errors.length).to.eql(0);
  });

  it('round-trips initial YAML', () => {
    const yaml = LintProfileSchema.initialYaml();
    const parsed = Yaml.parse(yaml).data;
    expect(parsed).to.eql(LintProfileSchema.initial());
    const text = String(yaml);
    expect(text).to.contain('fs:slug-tree:');
    expect(text).to.contain('include: [.md]');
    expect(text).to.contain('source: .');
    expect(text).to.contain('target:');
    expect(text).to.contain('dir:');
    expect(text).to.contain('- ./manifest/slug-tree.json');
    expect(text).to.contain('- ./manifest/slug-tree.yaml');
    expect(text).to.not.contain('readmeAsIndex');
    expect(text).to.not.contain('sort:');
    expect(text).to.not.contain('ignore:');
  });
});
