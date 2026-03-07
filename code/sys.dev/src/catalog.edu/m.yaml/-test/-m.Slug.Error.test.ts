import { type t, describe, expect, it } from '../../-test.ts';
import { Type as T } from '../common.ts';
import { YamlPipeline } from '../mod.ts';
import { makeTestRegistry } from './-u.ts';

describe('YamlPipeline.Slug.Error', () => {
  /**
   * Structural (schema) error normalization:
   */
  describe('Error.normalize (structural)', () => {
    const YAML_WITH_SCHEMA_ERROR = `
      foo:
        bar:
          id: my-slug
          traits: 123
    `;

    it('absolute mode: prefixes base path; locates the traits structural error', () => {
      const base = ['foo', 'bar'];
      const res = YamlPipeline.Slug.fromYaml(YAML_WITH_SCHEMA_ERROR, base);
      expect(res.ok).to.equal(false);

      const out = YamlPipeline.Slug.Error.normalize(res, { mode: 'absolute' });
      expect(out.length).to.be.greaterThan(0);

      expect(hasAbsTraitsError(out, base)).to.eql(true);
      // Sanity: message present
      expect(out[0].message).to.be.a('string');
    });

    it('relative mode: leaves path relative to slug root; locates the traits structural error', () => {
      const base = ['foo', 'bar'];
      const res = YamlPipeline.Slug.fromYaml(YAML_WITH_SCHEMA_ERROR, base);
      const out = YamlPipeline.Slug.Error.normalize(res, { mode: 'relative' });

      expect(out.length).to.be.greaterThan(0);
      expect(hasRelTraitsError(out)).to.eql(true);
    });

    it('path `mode` as plain parameter is supported (absolute vs relative)', () => {
      const base = ['foo', 'bar'];
      const res = YamlPipeline.Slug.fromYaml(YAML_WITH_SCHEMA_ERROR, base);

      const abs = YamlPipeline.Slug.Error.normalize(res, 'absolute');
      const rel = YamlPipeline.Slug.Error.normalize(res, 'relative');

      expect(abs.length).to.be.greaterThan(0);
      expect(rel.length).to.be.greaterThan(0);
      expect(hasAbsTraitsError(abs, base)).to.eql(true);
      expect(hasRelTraitsError(rel)).to.eql(true);
    });

    it('attaches character range from AST when missing', () => {
      const base = ['foo', 'bar'];
      const res = YamlPipeline.Slug.fromYaml(YAML_WITH_SCHEMA_ERROR, base);
      const out = YamlPipeline.Slug.Error.normalize(res, { mode: 'absolute' });

      const withRange = out.find((d) => Array.isArray(d.range) && d.range.length >= 2);
      expect(withRange).to.exist;
      expect(withRange!.range![0]).to.be.a('number');
      expect(withRange!.range![1]).to.be.a('number');
    });

    it('message passthrough', () => {
      const base = ['foo', 'bar'];
      const res = YamlPipeline.Slug.fromYaml(YAML_WITH_SCHEMA_ERROR, base);
      const out = YamlPipeline.Slug.Error.normalize(res, { mode: 'absolute' });

      expect(out[0].message).to.be.a('string');
      expect(out[0].message.length).to.be.greaterThan(0);
    });
  });

  /**
   *  AST range attachment
   */
  describe('Error.attachSemanticRanges', () => {
    const YAML = `
      foo:
        bar:
          id: my-slug
          traits:
            - as: primary
              of: video
          data:
            primary:
              src: "video.mp4"
    `;

    it('attaches range for an exact node path', () => {
      const res = YamlPipeline.Slug.fromYaml(YAML, ['foo', 'bar']);
      const errs = [
        { message: 'schema: data wrong type', path: ['data'] },
      ] as t.Schema.ValidationError[];

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
        { message: 'semantic: unknown data key', path: ['data', 'missing'] },
      ] as t.Schema.ValidationError[];

      YamlPipeline.Slug.Error.attachSemanticRanges(res.ast, errs);

      const r = errs[0].range;
      expect(Array.isArray(r)).to.eql(true);
      if (Array.isArray(r)) expect(r.length).to.be.greaterThanOrEqual(2);
    });

    it('falls back to document root when no path segments match', () => {
      const res = YamlPipeline.Slug.fromYaml(YAML, ['foo', 'bar']);
      const errs = [
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
        { message: 'preset range should persist', path: ['id'], range: preset },
      ] as t.Schema.ValidationError[];

      YamlPipeline.Slug.Error.attachSemanticRanges(res.ast, errs);
      expect(errs[0].range).to.equal(preset); // identity check
    });

    it('mutates the provided array in place', () => {
      const res = YamlPipeline.Slug.fromYaml(YAML, ['foo', 'bar']);
      const errs = [{ message: 'mutate in place', path: ['data'] }] as t.Schema.ValidationError[];

      const before = errs;
      YamlPipeline.Slug.Error.attachSemanticRanges(res.ast, errs);
      expect(errs).to.equal(before);
      expect(errs[0].range).to.exist;
    });
  });

  /**
   * Semantic rules:
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
      `;

      const registry = makeTestRegistry(['trait-alpha', 'trait-beta']);
      const res = YamlPipeline.Slug.fromYaml(YAML, ['foo', 'bar'], { registry });
      expect(res.errors.yaml.length).to.eql(0);
      expect(res.errors.schema.length).to.eql(0);

      const out = YamlPipeline.Slug.Error.normalize(res, { mode: 'absolute' });
      const diag = out.find(
        (d) =>
          Array.isArray(d.path) &&
          joinPath(d.path) === 'foo/bar/traits/0/of' &&
          String(d.message).includes('Unknown trait id "not-real"'),
      );
      expect(diag).to.exist;
    });

    it('missing data for alias produces a semantic diagnostic at traits[i].as', () => {
      const YAML = `
        foo:
          bar:
            id: example-slug
            traits:
              - of: alpha
                as: primary
            data: {}  # missing "primary"
      `;

      const registry = makeTestRegistry(['alpha', 'beta']);
      const res = YamlPipeline.Slug.fromYaml(YAML, ['foo', 'bar'], { registry });
      expect(res.errors.yaml.length).to.eql(0);
      expect(res.errors.schema.length).to.eql(0);

      const out = YamlPipeline.Slug.Error.normalize(res, { mode: 'absolute' });
      const diag = out.find(
        (d) =>
          Array.isArray(d.path) &&
          joinPath(d.path) === 'foo/bar/traits/0/as' &&
          String(d.message).includes('Missing data for alias "primary"'),
      );
      expect(diag).to.exist;
    });

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
      `;

      const registry = makeTestRegistry(['video', 'image']);
      const res = YamlPipeline.Slug.fromYaml(YAML, ['foo', 'bar'], { registry });
      expect(res.errors.yaml.length).to.eql(0);
      expect(res.errors.schema.length).to.eql(0);

      const out = YamlPipeline.Slug.Error.normalize(res, { mode: 'absolute' });
      const diag = out.find(
        (d) =>
          Array.isArray(d.path) &&
          joinPath(d.path).endsWith('/data/extra') &&
          String(d.message).toLowerCase().includes('orphan'),
      );
      expect(diag).to.exist;
    });

    it('ref-only slug yields no semantic diagnostics', () => {
      const YAML = `
        foo:
          bar:
            id: example-ref
            ref: urn:crdt:2JgVjx9KAMcB3D6EZEyBB18jBX6P/section.1
      `;

      const res = YamlPipeline.Slug.fromYaml(YAML, ['foo', 'bar']);
      expect(res.errors.yaml.length).to.eql(0);
      expect(res.errors.schema.length).to.eql(0);

      const out = YamlPipeline.Slug.Error.normalize(res, { mode: 'absolute' });
      expect(out.length).to.eql(0);
    });
  });
});

/**
 * Helpers:
 */
function joinPath(p: unknown): string {
  return Array.isArray(p) ? p.join('/') : '';
}

function includesTraitsHint(msg?: string): boolean {
  const s = String(msg ?? '').toLowerCase();
  // Accept from various validators:
  return (
    s.includes('traits') ||
    s.includes('array') ||
    s.includes('type') ||
    s.includes('object') ||
    s.includes('union')
  );
}

/**
 * The structural validator may attach the error either at:
 *   - the exact property path (foo/bar/traits)
 *   - the object root for that branch (foo/bar)
 *   - or, in relative mode, 'traits' or '' (root of slug)
 * These matchers keep the test stable across such variations.
 */
function hasAbsTraitsError(diags: readonly t.Yaml.Diagnostic[], base: readonly string[]): boolean {
  const baseStr = base.join('/');
  return diags.some((d) => {
    const p = joinPath(d.path);
    return p === `${baseStr}/traits` || (p === baseStr && includesTraitsHint(d.message));
  });
}

function hasRelTraitsError(diags: readonly t.Yaml.Diagnostic[]): boolean {
  return diags.some((d) => {
    const p = joinPath(d.path);
    return p === 'traits' || (p === '' && includesTraitsHint(d.message));
  });
}
