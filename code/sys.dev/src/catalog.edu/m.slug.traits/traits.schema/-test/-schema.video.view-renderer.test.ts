import { describe, expect, expectTypeOf, it } from '../../../-test.ts';

import { type t, Value } from '../common.ts';
import { Traits } from '../mod.ts';
import { ViewRendererPropsSchema } from '../schema.view-renderer.ts';

describe('trait: view-renderer', () => {
  describe('schema', () => {
    it('validates minimal object', () => {
      expect(Value.Check(ViewRendererPropsSchema, { view: 'foo' })).to.eql(true);
    });

    it('rejects empty `view` field name', () => {
      expect(Value.Check(ViewRendererPropsSchema, { view: '' })).to.eql(false);
    });

    it('has id/title metadata', () => {
      expect(typeof ViewRendererPropsSchema.$id).to.eql('string');
      expect(typeof ViewRendererPropsSchema.title).to.eql('string');
    });

    it('Traits.Schema.ViewRenderer exposes the same schema object', () => {
      expect(Traits.Schema.ViewRenderer.Props).to.equal(ViewRendererPropsSchema);
    });

    it('accepts id-pattern values; rejects invalid', () => {
      const ok = ['video', 'video-player', 'video.player-01', 'v1'];
      const bad = ['', '-video', '.video', 'Video', 'video player', 'video_1'];

      ok.forEach((view) => expect(Value.Check(ViewRendererPropsSchema, { view })).to.eql(true));
      bad.forEach((view) => expect(Value.Check(ViewRendererPropsSchema, { view })).to.eql(false));
    });
  });

  describe('types', () => {
    it('SlugTraitBindingOf<"view-renderer"> is assignable to SlugTraitBinding', () => {
      type Narrow = t.SlugTraitBindingOf<'view-renderer'>;

      // One-way assignability (compile-time only):
      type Assignable = Narrow extends t.SlugTraitBinding ? true : never;
      const assertAssignable: Assignable = true;

      // Satisfy expectTypeOf:
      let sample!: Narrow;
      expectTypeOf(sample).toEqualTypeOf<Narrow>();

      // `id` (trait "of") literal stays locked to "view-renderer":
      let id!: Narrow['of'];
      expectTypeOf(id).toEqualTypeOf<'view-renderer'>();
    });
  });
});
