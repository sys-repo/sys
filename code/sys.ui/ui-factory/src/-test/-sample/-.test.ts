import { type t, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Schema } from '../../m.schema/mod.ts';

describe('public samples catalog → inference', () => {
  it('derives strong types without slow types', async () => {
    const Samples = await import('@sys/ui-factory/sample/catalog');

    // Inference directly from exported schema values (works because they're precise TypeBox types):
    type Hello = t.Infer<typeof Samples.HelloSchema>;
    type Panel = t.Infer<typeof Samples.PanelSchema>;

    // compile-time checks
    expectTypeOf<Hello>({ name: 'World' }).toEqualTypeOf<{ name: string }>();
    expectTypeOf<Panel>({ title: 'T', body: 'B' }).toEqualTypeOf<{
      title: string;
      body?: string;
    }>();

    // Runtime sanity:
    expect(Samples.HelloSchema).to.be.ok;
    expect(Samples.PanelSchema).to.be.ok;

    // You can still build validators from these:
    const vmap = Schema.Props.makeValidators(Samples.regs);
    expect(Schema.Props.validate('Hello:view', { name: 'ok' }, vmap)).to.eql({ ok: true });
  });
});
