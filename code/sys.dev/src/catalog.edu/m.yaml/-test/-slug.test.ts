import { c, describe, expect, it } from '../../-test.ts';
import { Yaml } from '../common.ts';
import { fromYaml } from '../m.Slug.fromYaml.ts';
import { Slug } from '../m.Slug.ts';
import { YamlPipeline } from '../mod.ts';

describe(`YamlPipeline`, () => {
  it('API', async () => {
    expect(YamlPipeline.Slug).to.equal(Slug);
    expect(Slug.fromYaml).to.equal(fromYaml);
  });

  describe('Slug.fromYaml:', () => {
    it('prints a complete, expressive slug for visibility', () => {
      const src = `
      id: slug-001
      traits:
        - as: trait-1
          id: video
        - as: gallery
          id: image-sequence
      props:
        trait-1:
          src: https://example.com/video.mp4
          poster: https://example.com/poster.jpg
        gallery:
          title: "Intro sequence"
          images:
            - https://example.com/1.png
            - https://example.com/2.png
      `;

      const res = fromYaml(src); // root path
      expect(res.ok).to.be.true;
      if (res.ok) {
        console.info(c.bold(c.green('slugFromYaml:')));
        console.info(res);
        console.info();
        console.info(c.bold(c.green('slugFromYaml.slug:')));
        console.info(res.slug);
        console.info();
      }
    });

    describe('input', () => {
      it('accepts string input, implicit root path (valid slug)', () => {
        const src = `
      id: s1
      traits: []
      `;
        const res = fromYaml(src);
        expect(res.ok).to.be.true;
        if (res.ok) {
          expect(res.slug).to.eql({ id: 's1', traits: [] });
          expect(res.errors.schema.length).to.eql(0);
          expect(res.errors.yaml.length).to.eql(0);
        }
      });

      it('accepts string input, explicit array path', () => {
        const src = `
      concept-player:
        slug:
          id: s2
          traits: []
      `;
        const res = fromYaml(src, ['concept-player', 'slug']);
        expect(res.ok).to.be.true;
        if (res.ok) {
          expect(res.slug).to.eql({ id: 's2', traits: [] });
        }
      });

      it('accepts string input, explicit string path (decoded)', () => {
        const src = `
      root:
        nested:
          slug:
            id: s3
            traits: []
      `;
        const res = fromYaml(src, '/root/nested/slug');
        expect(res.ok).to.be.true;
        if (res.ok) {
          expect(res.slug).to.eql({ id: 's3', traits: [] });
        }
      });

      it('accepts pre-parsed YamlAst input', () => {
        const src = `
      wrap:
        slug:
          id: s4
          traits: []
      `;
        const ast = Yaml.parseAst(src);
        const res = fromYaml(ast, ['wrap', 'slug']);
        expect(res.ok).to.be.true;
        if (res.ok) {
          expect(res.slug).to.eql({ id: 's4', traits: [] });
          expect(res.ast).to.equal(ast);
        }
      });
    });

    describe('structural validation', () => {
      it('reports schema errors (bad shape at target path)', () => {
        const src = `
      slug:
        id: s5
        traits: {}   # <- must be an array
      `;
        const res = fromYaml(src, ['slug']);
        expect(res.ok).to.eql(false);
        expect(res.errors.schema.length > 0).to.be.true;
        expect(res.errors.yaml.length).to.eql(0); // ← ensure no YAML parser errors on well-formed YAML.

        // Print:
        console.info();
        console.info(c.bold(c.green('slugFromYaml:')));
        console.info(res);
        console.info();
        console.info(c.bold(c.green('slugFromYaml.errors:')));
        console.info(res.errors);
        console.info();
      });

      it('reports YAML parse errors (syntax)', () => {
        const src = `id: [unclosed`;
        const res = fromYaml(src); // root path
        // Parser should report an error:
        //    Schema may or may not produce errors depending on parser recovery;
        //    we only assert the presence of YAML errors here.
        expect(res.errors.yaml.length > 0).to.be.true;
        expect(res.errors.yaml[0].message).to.include('[unclosed');
      });
    });

    });
  });
});
