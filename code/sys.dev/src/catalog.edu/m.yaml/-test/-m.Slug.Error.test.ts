import { describe, expect, it } from '../../-test.ts';
import { YamlPipeline } from '../mod.ts';

describe('YamlPipeline.Slug.Error', () => {
  describe('Error.normalize', () => {
    const YAML_WITH_SCHEMA_ERROR = `
    foo:
      bar:
        id: my-slug
        traits: 123
    `.trim();

    it('absolute mode: prefixes base path onto error.path', () => {
      const base = ['foo', 'bar'];
      const res = YamlPipeline.Slug.fromYaml(YAML_WITH_SCHEMA_ERROR, base);
      expect(res.ok).to.equal(false);

      const out = YamlPipeline.Slug.Error.normalize(res, { pathMode: 'absolute' });
      expect(out.length).to.be.greaterThan(0);

      // Expect a schema diagnostic at .../traits:
      const traitsDiag = out.find(
        (d) => Array.isArray(d.path) && d.path.join('/') === 'foo/bar/traits',
      );
      expect(traitsDiag).to.exist;
      expect(traitsDiag?.message).to.be.a('string');
    });

    it('relative mode: leaves path relative to slug root', () => {
      const base = ['foo', 'bar'];
      const res = YamlPipeline.Slug.fromYaml(YAML_WITH_SCHEMA_ERROR, base);
      const out = YamlPipeline.Slug.Error.normalize(res, { pathMode: 'relative' });

      const traitsDiag = out.find((d) => Array.isArray(d.path) && d.path.join('/') === 'traits');
      expect(traitsDiag).to.exist;
    });

    it('attaches character range from AST when missing', () => {
      const res = YamlPipeline.Slug.fromYaml(YAML_WITH_SCHEMA_ERROR, ['foo', 'bar']);
      const out = YamlPipeline.Slug.Error.normalize(res, { pathMode: 'absolute' });

      // Ensure at least one diagnostic has a usable [start, end] range:
      const withRange = out.find((d) => Array.isArray(d.range) && d.range.length >= 2);
      expect(withRange).to.exist;
      expect(withRange!.range![0]).to.be.a('number');
      expect(withRange!.range![1]).to.be.a('number');
    });

    it('message passthrough (diagnostic carries human text)', () => {
      const res = YamlPipeline.Slug.fromYaml(YAML_WITH_SCHEMA_ERROR, ['foo', 'bar']);
      const out = YamlPipeline.Slug.Error.normalize(res, { pathMode: 'absolute' });

      expect(out[0].message).to.be.a('string');
      expect(out[0].message.length).to.be.greaterThan(0);
    });
  });

  describe('Error.attachSemanticRanges', () => {
    const YAML = `
    foo:
      bar:
        id: my-slug
        traits:
          - as: primary
            id: video
        props:
          primary:
            src: "video.mp4"
    `.trim();

    it('attaches range for an exact node path', () => {
      const res = YamlPipeline.Slug.fromYaml(YAML, ['foo', 'bar']);
      const errs = [
        // exact node: "traits" under the slug root
        { message: 'schema: traits wrong type', path: ['traits'] as (string | number)[] },
      ] as unknown as Parameters<typeof YamlPipeline.Slug.Error.attachSemanticRanges>[1];

      YamlPipeline.Slug.Error.attachSemanticRanges(res.ast, errs);

      expect(errs[0].range).to.be.an('array');
      expect((errs[0].range as number[]).length).to.be.greaterThanOrEqual(2);
      expect(typeof (errs[0].range as number[])[0]).to.equal('number');
      expect(typeof (errs[0].range as number[])[1]).to.equal('number');
    });

    it('falls back to nearest ancestor with a node range', () => {
      const res = YamlPipeline.Slug.fromYaml(YAML, ['foo', 'bar']);
      const errs = [
        // non-existent child under props → should fall back to "props" node
        {
          message: 'semantic: unknown props key',
          path: ['props', 'missing'] as (string | number)[],
        },
      ] as unknown as Parameters<typeof YamlPipeline.Slug.Error.attachSemanticRanges>[1];

      YamlPipeline.Slug.Error.attachSemanticRanges(res.ast, errs);

      expect(errs[0].range).to.be.an('array');
      expect((errs[0].range as number[]).length).to.be.greaterThanOrEqual(2);
    });

    it('falls back to document root when no path segments match', () => {
      const res = YamlPipeline.Slug.fromYaml(YAML, ['foo', 'bar']);
      const errs = [
        // nothing on this chain exists under the slug root
        { message: 'semantic: totally wrong spot', path: ['not', 'here'] as (string | number)[] },
      ] as unknown as Parameters<typeof YamlPipeline.Slug.Error.attachSemanticRanges>[1];

      YamlPipeline.Slug.Error.attachSemanticRanges(res.ast, errs);

      expect(errs[0].range).to.be.an('array'); // should attach the doc root range
      expect((errs[0].range as number[]).length).to.be.greaterThanOrEqual(2);
    });

    it('does not overwrite an existing range (no-op if already set)', () => {
      const res = YamlPipeline.Slug.fromYaml(YAML, ['foo', 'bar']);
      const preset = [1, 2] as unknown as Parameters<
        typeof YamlPipeline.Slug.Error.attachSemanticRanges
      >[1][number]['range'];

      const errs = [
        {
          message: 'preset range should persist',
          path: ['id'] as (string | number)[],
          range: preset,
        },
      ] as unknown as Parameters<typeof YamlPipeline.Slug.Error.attachSemanticRanges>[1];

      YamlPipeline.Slug.Error.attachSemanticRanges(res.ast, errs);

      expect(errs[0].range).to.equal(preset); // same reference, not replaced
    });

    it('mutates the provided array in place', () => {
      const res = YamlPipeline.Slug.fromYaml(YAML, ['foo', 'bar']);
      const errs = [
        { message: 'mutate in place', path: ['props'] as (string | number)[] },
      ] as unknown as Parameters<typeof YamlPipeline.Slug.Error.attachSemanticRanges>[1];

      const before = errs;
      YamlPipeline.Slug.Error.attachSemanticRanges(res.ast, errs);
      expect(errs).to.equal(before); // same array object
      expect(errs[0].range).to.exist;
    });
  });
});
