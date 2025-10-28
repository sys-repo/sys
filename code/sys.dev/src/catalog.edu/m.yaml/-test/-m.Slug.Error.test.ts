import { type t, Is, describe, expect, it } from '../../-test.ts';
import { YamlPipeline } from '../mod.ts';

function makeIsKnown(ids: string[]): t.SlugIsKnown {
  return (id) => ids.includes(id);
}

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

      const out = YamlPipeline.Slug.Error.normalize(res, { mode: 'absolute' });
      expect(out.length).to.be.greaterThan(0);

      // Expect a schema diagnostic at ../traits:
      const traitsDiag = out.find(
        (d) => Array.isArray(d.path) && d.path.join('/') === 'foo/bar/traits',
      );
      expect(traitsDiag).to.exist;
      expect(traitsDiag?.message).to.be.a('string');
    });

    it('relative mode: leaves path relative to slug root', () => {
      const base = ['foo', 'bar'];
      const res = YamlPipeline.Slug.fromYaml(YAML_WITH_SCHEMA_ERROR, base);
      const out = YamlPipeline.Slug.Error.normalize(res, { mode: 'relative' });

      const traitsDiag = out.find((d) => Array.isArray(d.path) && d.path.join('/') === 'traits');
      expect(traitsDiag).to.exist;
    });

    it('path `mode` as plain parameter', () => {
      const base = ['foo', 'bar'];
      const res = YamlPipeline.Slug.fromYaml(YAML_WITH_SCHEMA_ERROR, base);

      const a = YamlPipeline.Slug.Error.normalize(res, 'absolute');
      const b = YamlPipeline.Slug.Error.normalize(res, 'relative');

      expect(a[0].path).to.eql(['foo', 'bar', 'traits']);
      expect(b[0].path).to.eql(['traits']);
    });

    it('attaches character range from AST when missing', () => {
      const res = YamlPipeline.Slug.fromYaml(YAML_WITH_SCHEMA_ERROR, ['foo', 'bar']);
      const out = YamlPipeline.Slug.Error.normalize(res, { mode: 'absolute' });

      // Ensure at least one diagnostic has a usable [start, end] range:
      const withRange = out.find((d) => Array.isArray(d.range) && d.range.length >= 2);
      expect(withRange).to.exist;
      expect(withRange!.range![0]).to.be.a('number');
      expect(withRange!.range![1]).to.be.a('number');
    });

    it('message passthrough (diagnostic carries human text)', () => {
      const res = YamlPipeline.Slug.fromYaml(YAML_WITH_SCHEMA_ERROR, ['foo', 'bar']);
      const out = YamlPipeline.Slug.Error.normalize(res, { mode: 'absolute' });

      expect(out[0].message).to.be.a('string');
      expect(out[0].message.length).to.be.greaterThan(0);
    });
  });

  describe('Error.attachSemanticRanges', () => {
    // keep fixture minimal; existing tests rely only on range attachment behavior
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
      ] as unknown as t.Schema.ValidationError[];

      YamlPipeline.Slug.Error.attachSemanticRanges(res.ast, errs);

      const r = errs[0].range;
      expect(Array.isArray(r)).to.eql(true);
      if (Array.isArray(r)) {
        expect(r.length).to.be.greaterThanOrEqual(2);
        expect(typeof r[0]).to.eql('number');
        expect(typeof r[1]).to.eql('number');
      }
    });

    it('falls back to nearest ancestor with a node range', () => {
      const res = YamlPipeline.Slug.fromYaml(YAML, ['foo', 'bar']);
      const errs = [
        // non-existent child under props → should fall back to "props" node:
        {
          message: 'semantic: unknown props key',
          path: ['props', 'missing'] as (string | number)[],
        },
      ] as unknown as t.Schema.ValidationError[];

      YamlPipeline.Slug.Error.attachSemanticRanges(res.ast, errs);

      const r = errs[0].range;
      expect(Array.isArray(r)).to.eql(true);
      if (Array.isArray(r)) expect(r.length).to.be.greaterThanOrEqual(2);
    });

    it('falls back to document root when no path segments match', () => {
      const res = YamlPipeline.Slug.fromYaml(YAML, ['foo', 'bar']);
      const errs = [
        // nothing on this chain exists under the slug root
        { message: 'semantic: totally wrong spot', path: ['not', 'here'] },
      ] as t.Schema.ValidationError[];

      YamlPipeline.Slug.Error.attachSemanticRanges(res.ast, errs);

      const r = errs[0].range;
      expect(Array.isArray(r)).to.eql(true);
      if (Array.isArray(r)) expect(r.length).to.be.greaterThanOrEqual(2);
    });

    it('does not overwrite an existing range (no-op if already set)', () => {
      const res = YamlPipeline.Slug.fromYaml(YAML, ['foo', 'bar']);
      const preset = [1, 2] as t.Schema.ValidationError['range'];
      const errs = [
        {
          message: 'preset range should persist',
          path: ['id'] as (string | number)[],
          range: preset,
        },
      ] as t.Schema.ValidationError[];

      YamlPipeline.Slug.Error.attachSemanticRanges(res.ast, errs);
      expect(errs[0].range).to.equal(preset); // NB: same reference, not replaced.
    });

    it('mutates the provided array in place', () => {
      const res = YamlPipeline.Slug.fromYaml(YAML, ['foo', 'bar']);
      const errs = [{ message: 'mutate in place', path: ['props'] }] as t.Schema.ValidationError[];

      const before = errs;
      YamlPipeline.Slug.Error.attachSemanticRanges(res.ast, errs);
      expect(errs).to.equal(before); // same array object
      expect(errs[0].range).to.exist;
    });
  });

  /**
   * New semantic diagnostics via normalize:
   */
  describe('Error.normalize (semantic rules)', () => {
    it('unknown trait id (`of`) produces a semantic diagnostic with correct path', () => {
      const YAML = `
        foo:
          bar:
            id: example-slug
            traits:
              - of: not-real
                as: primary
            data:
              primary:
                src: "video.mp4"
        `.trim();

      // Minimal local registry delegate:
      const isKnown = makeIsKnown(['trait-alpha', 'trait-beta']);
      const res = YamlPipeline.Slug.fromYaml(YAML, ['foo', 'bar'], { isKnown });
      expect(res.errors.yaml.length).to.eql(0);
      expect(res.errors.schema.length).to.eql(0);

      const out = YamlPipeline.Slug.Error.normalize(res, { mode: 'absolute' });
      const diag = out.find(
        (d) =>
          Array.isArray(d.path) &&
          Is.string(d.message) &&
          d.path.join('/') === 'foo/bar/traits/0/of' &&
          d.message.includes('Unknown trait id "not-real"'),
      );
      expect(diag).to.exist;
    });

    // 🌸 ---------- CHANGED: pass-isKnown-delegate ----------
    it('missing data for alias produces a semantic diagnostic at traits[i].as', () => {
      const YAML = `
        foo:
          bar:
            id: example-slug
            traits:
              - of: alpha
                as: primary
            data: {}  # missing "primary"
      `.trim();

      const isKnown = makeIsKnown(['alpha', 'beta']);
      const res = YamlPipeline.Slug.fromYaml(YAML, ['foo', 'bar'], { isKnown });
      expect(res.errors.yaml.length).to.eql(0);
      expect(res.errors.schema.length).to.eql(0);

      const out = YamlPipeline.Slug.Error.normalize(res, { mode: 'absolute' });
      const diag = out.find(
        (d) =>
          Array.isArray(d.path) &&
          Is.string(d.message) &&
          d.path.join('/') === 'foo/bar/traits/0/as' &&
          d.message.includes('Missing data for alias "primary"'),
      );
      expect(diag).to.exist;
    });
    // 🌸 ---------- /CHANGED ----------

    // 🌸 ---------- CHANGED: pass-isKnown-delegate ----------
    it('orphan data produces a semantic diagnostic at data.<key>', () => {
      const YAML = `
        foo:
          bar:
            id: example-slug
            traits:
              - of: video
                as: primary
            data:
              primary:
                src: "video.mp4"
              extra:   # orphan: no matching alias
                any: true
      `.trim();

      const isKnown = makeIsKnown(['video', 'image']);
      const res = YamlPipeline.Slug.fromYaml(YAML, ['foo', 'bar'], { isKnown });
      expect(res.errors.yaml.length).to.eql(0);
      expect(res.errors.schema.length).to.eql(0);

      const out = YamlPipeline.Slug.Error.normalize(res, { mode: 'absolute' });
      const diag = out.find(
        (d) =>
          Array.isArray(d.path) &&
          d.path.join('/').endsWith('/data/extra') &&
          Is.string(d.message) &&
          d.message.includes('Orphan'),
      );
      expect(diag).to.exist;
    });
  });
});
