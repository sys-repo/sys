import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Lens } from '../../m.Obj.Lens/mod.ts';
import { Path } from '../../m.Obj.Path/mod.ts';
import { Obj } from '../mod.ts';

const valueOfType = <T>() => undefined as unknown as T;

describe('Obj', () => {
  it('API', async () => {
    const ObjModule = await import('@sys/std/obj');
    const ObjPath = await import('@sys/std/obj/path');
    expect(ObjModule.Obj).to.equal(Obj);
    expect(ObjPath.Path).to.equal(Path);
    expect(Obj.Lens).to.equal(Lens);
    expect(Obj.Path).to.equal(Path);
  });

  describe('types', () => {
    type S = { count: number };

    it('exposes the nested Lib aliases', () => {
      expectTypeOf(Obj).toEqualTypeOf<t.Obj.Lib>();
      expectTypeOf(Obj.Path).toEqualTypeOf<t.Obj.Path.Lib>();
      expectTypeOf(Obj.Path.Is).toEqualTypeOf<t.Obj.Path.Is.Lib>();
      expectTypeOf(Obj.Path.Rel).toEqualTypeOf<t.Obj.Path.Rel.Lib>();
      expectTypeOf(Obj.Path.Codec).toEqualTypeOf<t.Obj.Path.Codec.Lib>();
      expectTypeOf(Obj.Path.curry).toEqualTypeOf<t.Obj.Path.Curried.Lib['make']>();
      expectTypeOf(Obj.Path.Mutate).toEqualTypeOf<t.Obj.Path.Mutate.Lib>();
      expectTypeOf(Obj.Lens).toEqualTypeOf<t.Obj.Lens.Lib>();
      expectTypeOf(Obj.Lens.Is).toEqualTypeOf<t.Obj.Lens.Is.Lib>();
    });

    it('exposes the nested Lens namespace aliases', () => {
      expectTypeOf(valueOfType<t.Obj.Lens.Unbound<number>>()).toEqualTypeOf<t.ObjLens<number>>();
      expectTypeOf(valueOfType<t.Obj.Lens.Ref<S, number>>()).toEqualTypeOf<
        t.ObjLensRef<S, number>
      >();
      expectTypeOf(valueOfType<t.Obj.Lens.ReadonlyUnbound<number>>()).toEqualTypeOf<
        t.ReadonlyObjLens<number>
      >();
      expectTypeOf(valueOfType<t.Obj.Lens.ReadonlyRef<S, number>>()).toEqualTypeOf<
        t.ReadonlyObjLensRef<S, number>
      >();
      expectTypeOf(valueOfType<t.Obj.Lens.ToObjectOptions>()).toEqualTypeOf<
        t.LensToObjectOptions
      >();
      expectTypeOf(
        valueOfType<t.Obj.Lens.Unwrap<{ lens: t.ObjLensRef<S, number> }>>(),
      ).toEqualTypeOf<{ readonly lens: number }>();
    });

    it('exposes the nested Path namespace aliases', () => {
      expectTypeOf(valueOfType<t.Obj.Path.Fix>()).toEqualTypeOf<t.ObjPathFix>();
      expectTypeOf(valueOfType<t.Obj.Path.SanitizeOptions>()).toEqualTypeOf<
        t.ObjPathSanitizeOptions
      >();
      expectTypeOf(valueOfType<t.Obj.Path.TryDecodeOptions>()).toEqualTypeOf<
        t.PathTryDecodeOptions
      >();
      expectTypeOf(valueOfType<t.Obj.Path.TryDecodeResult>()).toEqualTypeOf<
        t.PathTryDecodeResult
      >();
      expectTypeOf(valueOfType<t.Obj.Path.Codec.Definition>()).toEqualTypeOf<
        t.ObjPathCodec
      >();
      expectTypeOf(valueOfType<t.Obj.Path.Codec.Kind>()).toEqualTypeOf<t.ObjPathCodecKind>();
      expectTypeOf(valueOfType<t.Obj.Path.Codec.EncodeOptions>()).toEqualTypeOf<
        t.ObjPathEncodeOptions
      >();
      expectTypeOf(valueOfType<t.Obj.Path.Codec.DecodeOptions>()).toEqualTypeOf<
        t.ObjPathDecodeOptions
      >();
      expectTypeOf(valueOfType<t.Obj.Path.Curried.Instance<number>>()).toEqualTypeOf<
        t.CurriedPath<number>
      >();
      expectTypeOf(valueOfType<t.Obj.Path.Mutate.Op>()).toEqualTypeOf<t.ObjDiffOp>();
      expectTypeOf(valueOfType<t.Obj.Path.Mutate.Options>()).toEqualTypeOf<t.ObjDiffOptions>();
      expectTypeOf(valueOfType<t.Obj.Path.Mutate.Report>()).toEqualTypeOf<t.ObjDiffReport>();
      expectTypeOf(valueOfType<t.Obj.Path.Rel.Relation>()).toEqualTypeOf<t.PathRelation>();
    });
  });
});
