import { type t, describe, expect, it } from '../../../-test.ts';

import { Type as T, Yaml } from '../common.ts';
import { Validation } from '../m.Validation.ts';

describe('schema.validation: SlugTree deep validation', () => {
  /**
   * Sample fixtures:
   */
  const SampleSchema: t.TSchema = T.Object(
    { src: T.Optional(T.String({ minLength: 1 })) },
    { additionalProperties: false },
  );
  const registry: t.SlugTraitRegistry = {
    all: [{ id: 'sample-trait', propsSchema: SampleSchema }],
    get: (id) => registry.all.find((e) => e.id === id),
  };

  it('orphan data alias → diagnostic at .../data/vid1', () => {
    const yaml = `
      slug:
        traits:
          - of: slug-tree
            as: foo
        data:
          foo:
            - slug: Thing B
              traits:
                - of: video-player
                  as: vid
              data:
                vid1:
                  src: "https://example.com/clip.mp4"
      `.trim();

    const ast = Yaml.parseAst(yaml);
    const tree = [
      {
        slug: 'Thing B',
        traits: [{ of: 'sample-trait', as: 'vid' }],
        data: { vid1: { src: 'https://example.com/clip.mp4' } },
      },
    ] satisfies t.SlugTreeProps;

    const diags = Validation.SlugTree.validateWithRanges({
      ast,
      registry,
      tree,
      basePath: ['data', 'foo'],
      severity: 'Error',
    });

    expect(diags.length).to.be.greaterThan(0);
    // Assert at least one diagnostic points exactly at ['data','foo',0,'data','vid1']
    const hit = diags.find(
      (d) => Array.isArray(d.path) && d.path.join('/') === 'data/foo/0/data/vid1',
    );
    expect(!!hit).to.eql(true);
  });

  it('invalid prop inside trait data → diagnostic at .../data/vid/src1', () => {
    const yaml = `
      slug:
        traits:
          - of: slug-tree
            as: foo
        data:
          foo:
            - slug: Thing B
              traits:
                - of: video-player
                  as: vid
              data:
                vid:
                  src1: "oops"
      `;

    const ast = Yaml.parseAst(yaml);
    const tree: t.SlugTreeProps = [
      {
        slug: 'Thing B',
        traits: [{ of: 'sample-trait', as: 'vid' }],
        data: { vid: { src1: 'oops' } },
      },
    ];

    const diags = Validation.SlugTree.validateWithRanges({
      ast,
      registry,
      tree,
      basePath: ['data', 'foo'],
      severity: 'Error',
    });

    // Expect a diagnostic pointing to the bad key:
    const hit = diags.find(
      (d) => Array.isArray(d.path) && d.path.join('/') === 'data/foo/0/data/vid/src1',
    );
    expect(!!hit).to.eql(true);
  });

  it('ref-only node → no diagnostics', () => {
    const yaml = `
      slug:
        traits:
          - of: slug-tree
            as: foo
        data:
          foo:
            - slug: Intro
              ref: crdt:create
      `;

    const ast = Yaml.parseAst(yaml);
    const tree: t.SlugTreeProps = [{ slug: 'Intro', ref: 'crdt:create' }];

    const diags = Validation.SlugTree.validateWithRanges({
      ast,
      registry,
      tree,
      basePath: ['data', 'foo'],
      severity: 'Error',
    });

    expect(diags.length).to.eql(0);
  });

  it('invariant: each diagnostic path composes node base exactly once (P = data/foo/0)', () => {
    const yaml = `
      slug:
        traits:
          - of: slug-tree
            as: foo
        data:
          foo:
            - slug: Thing B
              traits:
                - of: video-player
                  as: vid
              data:
                vid1:
                  src: "https://example.com/clip.mp4"
      `;

    const ast = Yaml.parseAst(yaml);
    const base = ['data', 'foo'] as const;
    const tree: t.SlugTreeProps = [
      {
        slug: 'Thing B',
        traits: [{ of: 'sample-trait', as: 'vid' }],
        data: { vid1: { src: 'https://example.com/clip.mp4' } },
      },
    ];

    const diags = Validation.SlugTree.validateWithRanges({
      ast,
      registry,
      tree,
      basePath: [...base],
      severity: 'Error',
    });

    // Sanity: we expect at least missing-data + orphan-data here.
    expect(diags.length).to.be.greaterThan(0);

    const P = [...base, 0] as t.ObjectPath;


    for (const d of diags) {
      const p = (d as { path?: t.ObjectPath }).path;
      expect(Array.isArray(p)).to.eql(true);

      // Must start with P:
      const startsWithP = p!.slice(0, P.length).every((seg, i) => seg === P[i]);
      expect(startsWithP).to.eql(true);

      // And P must occur exactly once (no double-prefixing):
      expect(occurrencesOf(p!, P)).to.eql(1);
    }
  });
});
