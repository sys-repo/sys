import { renderToStaticMarkup } from 'react-dom/server';
import { LuArrowRight, LuGlobe } from 'react-icons/lu';
import { Html } from '@sys/html';
import {
  act,
  afterAll,
  beforeAll,
  describe,
  DomMock,
  expect,
  it,
  TestReact,
} from '../../../-test.ts';
import { Style } from '../common.ts';
import { Icon } from '../../Icon/mod.ts';
import { A } from '../mod.ts';

const icons = { leading: Icon.renderer(LuGlobe), trailing: Icon.renderer(LuArrowRight) };

describe('Anchor: generic icon layout', () => {
  DomMock.init({ beforeAll, afterAll });

  it('leading and trailing renderers → one native link with decorative phrasing markers', async () => {
    let clicks = 0;
    const res = await TestReact.render(
      <p dir='rtl'>
        Before{' '}
        <A
          href='#target'
          icons={icons}
          onClick={(e) => {
            e.preventDefault();
            clicks++;
          }}
        >
          A <strong>rich</strong> label
        </A>{' '}
        after.
      </p>,
    );
    try {
      const root = res.container.querySelector('a')!;
      expect(res.container.querySelectorAll('a').length).to.eql(1);
      expect(root.textContent).to.eql('A rich label');
      expect(root.querySelectorAll('strong').length).to.eql(1);
      const markers = [...root.querySelectorAll<HTMLElement>('[aria-hidden="true"]')];
      expect(markers.length).to.eql(2);
      expect(root.firstElementChild).to.equal(markers[0]);
      expect(root.lastElementChild).to.equal(markers[1]);
      for (const marker of markers) {
        expect(marker.tagName).to.eql('SPAN');
        expect(marker.firstElementChild?.tagName).to.eql('SPAN');
        expect(marker.querySelector('svg')).not.to.eql(null);
        expect(marker.querySelector('[tabindex], button, a, div')).to.eql(null);
        act(() => DomMock.Mouse.click(marker));
      }
      expect(clicks).to.eql(2);
      const rules = Style.Dom.stylesheet().rules.items;
      const leading = rules.find((item) => item.selector === `.${markers[0].className}`);
      const trailing = rules.find((item) => item.selector === `.${markers[1].className}`);
      expect(leading?.rule).to.contain('margin-inline-end: 3px;');
      expect(trailing?.rule).to.contain('margin-inline-start: 2px;');
      expect(leading?.style.marginInlineEnd).to.eql('3px');
      expect(trailing?.style.marginInlineStart).to.eql('2px');
      const base = rules.find((item) => item.selector === `.${root.className}`)?.style;
      for (const property of ['display', 'whiteSpace', 'padding']) {
        expect(base).not.to.have.property(property);
      }
    } finally {
      act(() => res.dispose());
    }
  });

  it('icon roots and SVGs use font-relative sizing across host font sizes', async () => {
    for (const fontSize of [12, 14, 20]) {
      const res = await TestReact.render(
        <A href='#target' icons={icons} style={{ fontSize }}>Reference</A>,
      );
      try {
        const root = res.container.querySelector('a')!;
        const rules = Style.Dom.stylesheet().rules.items;
        const base = rules.find((item) => item.selector === `.${root.className}`);
        expect(base?.style.fontSize).to.eql(fontSize);
        const svgs = [...root.querySelectorAll('svg')];
        expect(svgs.length).to.eql(2);
        for (const svg of svgs) {
          expect(svg.getAttribute('width')).to.eql('1em');
          expect(svg.getAttribute('height')).to.eql('1em');
          const icon = svg.parentElement!;
          const rule = rules.find((item) => item.selector === `.${icon.className}`);
          expect(rule?.rule).to.contain('width: 1em;');
          expect(rule?.rule).to.contain('height: 1em;');
          expect(rule?.style).not.to.have.property('fontSize');
        }
      } finally {
        act(() => res.dispose());
      }
    }
  });

  it('disabled and enabled primitives retain caller description references', async () => {
    for (const enabled of [true, false]) {
      const res = await TestReact.render(
        <A href='#target' enabled={enabled} icons={icons} aria-describedby='help other'>Label</A>,
      );
      try {
        const root = res.container.querySelector('a')!;
        expect(root.getAttribute('aria-describedby')).to.eql('help other');
        expect(root.querySelectorAll('svg').length).to.eql(2);
        expect(root.hasAttribute('href')).to.eql(enabled);
      } finally {
        act(() => res.dispose());
      }
    }
  });

  it('missing destination returns original children without invoking icon renderers', () => {
    const children = <strong>Label</strong>;
    const unexpected = () => {
      throw new Error('Missing-href icons must not render.');
    };
    expect(A({ children, icons: { leading: unexpected } })).to.equal(children);
    expect(A({ href: '', children, icons, enabled: false })).to.equal(children);
  });

  it('SSR → parser retains the complete paragraph and actual icon factory markup', () => {
    const markup = renderToStaticMarkup(
      <p>
        Before{' '}
        <A href='#target' icons={icons}>
          A <em>rich</em> label
        </A>{' '}
        after.
      </p>,
    );
    const fragment = Html.parseFragment(markup);
    expect(fragment.childNodes.length).to.eql(1);
    const paragraph = fragment.childNodes[0];
    if (!Html.Is.element(paragraph)) throw new Error('Expected paragraph.');
    expect(paragraph.tagName).to.eql('p');
    const link = paragraph.childNodes.find(Html.Is.element);
    expect(link?.tagName).to.eql('a');
    const tags = link?.childNodes.filter(Html.Is.element).map((el) => el.tagName);
    expect(tags).to.eql(['span', 'em', 'span']);
    expect(markup).not.to.contain('<div');
  });
});
