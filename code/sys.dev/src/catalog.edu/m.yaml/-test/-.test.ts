import { c, describe, expect, it } from '../../-test.ts';
import { Yaml } from '../common.ts';
import { YamlPipeline } from '../mod.ts';
import { slugFromYaml } from '../u.parse.ts';

describe(`YamlPipeline`, () => {
  it('API', async () => {
    expect(YamlPipeline.slugFromYaml).to.equal(slugFromYaml);
  });

  describe('YamlPipeline.slugFromYaml', () => {
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

      const res = slugFromYaml(src); // root path
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

    it('accepts string input, implicit root path (valid slug)', () => {
      const src = `
      id: s1
      traits: []
      `;
      const res = slugFromYaml(src);
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
      const res = slugFromYaml(src, ['concept-player', 'slug']);
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
      const res = slugFromYaml(src, '/root/nested/slug');
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
      const res = slugFromYaml(ast, ['wrap', 'slug']);
      expect(res.ok).to.be.true;
      if (res.ok) {
        expect(res.slug).to.eql({ id: 's4', traits: [] });
        expect(res.ast).to.equal(ast);
      }
    });

    it('reports schema errors (bad shape at target path)', () => {
      const src = `
      slug:
        id: s5
        traits: {}   # <- must be an array
      `;
      const res = slugFromYaml(src, ['slug']);
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
      const res = slugFromYaml(src); // root path
      // Parser should report an error:
      expect(res.errors.yaml.length > 0).to.be.true;
      // Schema may or may not produce errors depending on parser recovery;
      // we only assert the presence of YAML errors here.
    });
  });
});
