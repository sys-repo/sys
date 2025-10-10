import { c, describe, expect, expectTypeOf, it, Str } from '../../-test.ts';
import { YamlPipeline, type t } from './common.ts';
import { useSlugFromYaml, type UseSlugResult } from './use.SlugFromYaml.ts';

function makeYaml(rev = 0, ast?: unknown): t.EditorYaml {
  return {
    rev,
    data: ast ? { ast } : undefined,
  } as unknown as t.EditorYaml;
}

export function makeEditorYamlFromText(text: string, rev = 1): t.EditorYaml {
  // Use the pipeline’s canonical parser; path is irrelevant for EditorYaml construction.
  const { ast } = YamlPipeline.Slug.fromYaml(text, '');
  return { rev, data: { ast } } as unknown as t.EditorYaml;
}

describe('hook: useSlugFromYaml', () => {
  describe('mocked', () => {
    it('typing: returns UseSlugResult', () => {
      const res = useSlugFromYaml({ yaml: makeYaml() });
      expectTypeOf(res).toEqualTypeOf<UseSlugResult>();
    });

    it('no yaml / no ast → ok=false, diagnostics=[], result:undefined, rev=0', () => {
      const res = useSlugFromYaml({ yaml: undefined });
      expect(res.ok).to.eql(false);
      expect(res.rev).to.eql(0);
      expect(Array.isArray(res.diagnostics)).to.eql(true);
      expect(res.diagnostics.length).to.eql(0);
      expect(res.result).to.eql(undefined);
    });

    it('rev passthrough when ast missing', () => {
      const res = useSlugFromYaml({ yaml: makeYaml(5 /* rev */) });
      expect(res.ok).to.eql(false);
      expect(res.rev).to.eql(5);
      expect(res.result).to.eql(undefined);
      expect(res.diagnostics).to.eql([]);
    });

    it('path: accepts JSON Pointer string ("/...") without throwing', () => {
      // JSON Pointer form is required by Obj.Path.decode:
      const res = useSlugFromYaml({ yaml: makeYaml(1), path: '/foo/bar/baz' });
      // With no ast we still expect the safe early return:
      expect(res.ok).to.eql(false);
      expect(res.result).to.eql(undefined);
    });

    it('path: accepts empty JSON Pointer ("") as root', () => {
      const res = useSlugFromYaml({ yaml: makeYaml(2), path: '' });
      expect(res.ok).to.eql(false);
      expect(res.result).to.eql(undefined);
    });

    it('path: accepts ObjectPath array without throwing', () => {
      const path: t.ObjectPath = ['foo', 'bar', 'baz'];
      const res = useSlugFromYaml({ yaml: makeYaml(3), path });
      expect(res.ok).to.eql(false);
      expect(res.result).to.eql(undefined);
    });
  });

  describe('useSlugFromYaml (integration)', () => {
    it('YAML → AST → hook (smoke): runs full pipeline without throwing', () => {
      const text = Str.dedent(`
      hello: 123
      foo:
        id: example-slug
        traits:
          - as: primary
            id: video
        props:
          primary:
            src: "video.mp4"
    `);

      const yaml = makeEditorYamlFromText(text, 7);
      const res = useSlugFromYaml({ yaml, path: '/foo/props/primary' });

      // Type contract stays tight:
      expectTypeOf(res).toEqualTypeOf<UseSlugResult>();

      // Invariants we can assert regardless of schema specifics:
      expect(res.rev).to.eql(7);
      expect(res).to.have.property('ok').that.is.a('boolean');
      expect(Array.isArray(res.diagnostics)).to.eql(true);

      // The hook should always return a result object from the pipeline call:
      expect('result' in res).to.eql(true);

      // Optional sanity: diagnostics should be normalized (contain absolute ranges/positions or be empty).
      // We don’t couple to exact count/content here.
      for (const d of res.diagnostics) {
        expect(d).to.have.property('message').that.is.a('string');
      }

      // Print:
      console.info(c.cyan('YAML → AST → hook:'), '\n');
      console.info(res);
      console.info();
    });
  });
});
