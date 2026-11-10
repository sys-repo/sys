import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import type { t } from '../common.ts';
import { Dev } from '../mod.ts';
import { Anchor } from '../../ui/Anchor/mod.ts';
import { DevLink } from '../ui.Link.tsx';

describe('@sys/ui-components/react/dev: Dev.Link', () => {
  it('public entrypoint → dev composition with the semantic prop contract', async () => {
    const m = await import('@sys/ui-components/react/dev');
    const production = await import('@sys/ui-components/react/anchor');
    expect(m.Dev).to.equal(Dev);
    expect(m.Dev.Link).to.equal(DevLink);
    expect(m.Dev.Link).not.to.equal(production.Anchor.Link);
    expect(production.Anchor.Link).to.equal(Anchor.Link);
    expectTypeOf<t.Dev.Link.Props>({ children: 'Label' }).toEqualTypeOf<t.Anchor.Link.Props>();
    expectTypeOf(m.Dev.Link).toEqualTypeOf<t.FC<t.Anchor.Link.Props>>();
  });

  it('omitted resource → web default without adding opening or style policy', () => {
    const props: t.Dev.Link.Props = { href: '#destination', children: 'Label' };
    const inner = DevLink(props);
    expect(inner.type).to.equal(Anchor.Link);
    expect(inner.props).to.eql({ ...props, resource: 'web' });
  });

  it('caller props → original values and references, including explicit resource opt-out', () => {
    for (const resource of [undefined, 'web'] as const) {
      const props: t.Dev.Link.Props = {
        children: <em>Label</em>,
        href: '#destination',
        resource,
        openIn: 'new-tab',
        openHint: 'Caller hint',
        title: '',
        enabled: false,
        'aria-describedby': 'caller',
        theme: 'Dark',
        mono: true,
        truncate: true,
        style: [{ maxWidth: 180 }, [false, { minWidth: undefined }]],
        onClick: () => {},
      };
      const inner = DevLink(props);
      expect(inner.type).to.equal(Anchor.Link);
      expect(inner.props).to.eql(props);
      expect(inner.props.style).to.equal(props.style);
      expect(inner.props.children).to.equal(props.children);
      expect(inner.props.onClick).to.equal(props.onClick);
    }
  });

  it('rendered default and opt-out → corresponding public Anchor.Link behavior', () => {
    const props = { href: '#destination', children: 'Label' };
    const plain = renderToStaticMarkup(<Anchor.Link {...props} />);
    const web = renderToStaticMarkup(<Anchor.Link {...props} resource='web' />);
    expect(web).not.to.eql(plain);
    expect(renderToStaticMarkup(<Dev.Link {...props} />)).to.eql(web);
    expect(renderToStaticMarkup(<Dev.Link {...props} resource={undefined} />)).to.eql(plain);
  });

  it('semantic props → required children and native-only exclusions', () => {
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
