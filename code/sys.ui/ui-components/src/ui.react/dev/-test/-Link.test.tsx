import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import type { t } from '../common.ts';
import { Dev } from '../mod.ts';
import { Anchor } from '../../ui/Anchor/mod.ts';

describe('@sys/ui-components/react/dev: Dev.Link', () => {
  it('aliases the public semantic link without changing props or runtime identity', async () => {
    const m = await import('@sys/ui-components/react/dev');
    const production = await import('@sys/ui-components/react/anchor');
    expect(m.Dev).to.equal(Dev);
    expect(m.Dev.Link).to.equal(Anchor.Link);
    expect(m.Dev.Link).to.equal(production.Anchor.Link);
    const props: t.Dev.Link.Props = {
      children: 'Example website',
      href: 'https://example.com',
      resource: 'web',
      openIn: 'new-tab',
      truncate: true,
      style: { maxWidth: 180 },
    };
    expectTypeOf(props).toEqualTypeOf<t.Anchor.Link.Props>();
    expectTypeOf(m.Dev.Link).toEqualTypeOf<t.FC<t.Anchor.Link.Props>>();
  });

  it('retains required children and semantic exclusions', () => {
    // @ts-expect-error A semantic link requires an explicit label.
    expectTypeOf<t.Dev.Link.Props>({ href: 'https://example.com' });
    // @ts-expect-error Opening intent owns target.
    expectTypeOf<t.Dev.Link.Props>({ children: 'Label', target: '_blank' });
    // @ts-expect-error Downloads use native Anchor.UI.
    expectTypeOf<t.Dev.Link.Props>({ children: 'Label', download: true });
    // @ts-expect-error Semantic resource/opening props own markers.
    expectTypeOf<t.Dev.Link.Props>({ children: 'Label', icons: {} });
    // @ts-expect-error Availability is controlled by enabled.
    expectTypeOf<t.Dev.Link.Props>({ children: 'Label', 'aria-disabled': true });
  });
});
