import { type t, describe, expect, it } from '../../-test.ts';
import { Type as T, Yaml as Y } from '../common.ts';
import { YamlPipeline } from '../mod.ts';
import { expectDiagAt } from './-u.ts';

describe('Yaml.Slug.fromYaml (deep slug-tree wiring)', () => {
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

  it('surface orphan/invalid diagnostics from nested slug-trees with correct absolute paths', () => {
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

    const ast = Y.parseAst(yaml);
    const base = ['slug'];
    const res = YamlPipeline.Slug.fromYaml(ast, base, { registry });

    // Sanity: pipeline produced a parse result:
    expect(res.ok).to.eql(false);

    // After Error.normalize, editor-facing diagnostics should include deep-tree paths.
    const editorDiags = YamlPipeline.Slug.Error.normalize(res, { mode: 'absolute' });
    expectDiagAt(editorDiags, base, ['data', 'foo', 0, 'data', 'vid1']);
  });
});
