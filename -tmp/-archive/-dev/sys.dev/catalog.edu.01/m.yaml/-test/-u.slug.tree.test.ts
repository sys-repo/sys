import { type t, describe, expect, it } from '../../-test.ts';
import { Type as T, Yaml } from '../common.ts';
import { validateSlugTreeDeep } from '../u.slug.tree.ts';
import { expectDiagAt } from './-u.ts';

describe('YamlPipeline: deep slug-tree validation', () => {
  /**
   * Fixtures:
   */
  const SampleSchema = T.Object(
    { src: T.Optional(T.String({ minLength: 1 })) },
    { additionalProperties: false },
  );
  const registry: t.SlugTraitRegistry = {
    all: [{ id: 'sample-trait', propsSchema: SampleSchema }],
    get: (id: string) => registry.all.find((e) => e.id === id),
  };

  describe('validateSlugTreeDeep()', () => {
    it('no-op for ref-only slugs', () => {
      const ast = Yaml.parseAst('slug:\n  ref: crdt:create\n');
      const slug: t.SlugRef = { ref: 'crdt:create' };
      const diags = validateSlugTreeDeep({ ast, slug, registry });
      expect(diags.length).to.eql(0);
    });

    it('validates array-valued aliases under data as slug-trees (orphan + missing)', () => {
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
      const slug: t.SlugWithData = {
        traits: [{ of: 'slug-tree', as: 'foo' }],
        data: {
          foo: [
            {
              slug: 'Thing B',
              traits: [{ of: 'sample-trait', as: 'vid' }],
              data: { vid1: { src: 'https://example.com/clip.mp4' } },
            },
          ],
        },
      };

      const diags = validateSlugTreeDeep({ ast, slug, registry, severity: 'Error' });
      expect(diags.length).to.be.greaterThan(0);
      expectDiagAt(diags, ['data', 'foo'], [0, 'data', 'vid1']);
    });

    it('ignores non-array values under data (only arrays are candidate trees)', () => {
      const yaml = `
        slug:
          traits:
            - of: slug-tree
              as: foo
          data:
            foo: { not: "an array" }
      `;

      const ast = Yaml.parseAst(yaml);
      const slug: t.SlugWithData = {
        traits: [{ of: 'slug-tree', as: 'foo' }],
        data: { foo: { not: 'an array' } as unknown }, // ← intentionally wrong shape for tree.
      };

      const diags = validateSlugTreeDeep({ ast, slug, registry });
      expect(diags.length).to.eql(0);
    });
  });
});
