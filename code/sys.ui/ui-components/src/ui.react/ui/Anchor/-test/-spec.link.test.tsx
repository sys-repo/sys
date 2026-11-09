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
import { Color, D, Is, Style } from '../common.ts';
import { LinkExamples } from '../-spec/-ui.LinkExamples.tsx';

describe('Anchor spec: link grammar', () => {
  DomMock.init({ beforeAll, afterAll });

  for (const theme of [undefined, 'Light', 'Dark'] as const) {
    it(`${theme ?? 'default'} → plain / arrow / resource matrix in standalone and prose hosts`, async () => {
      const res = await TestReact.render(<LinkExamples theme={theme} />);
      try {
        const frame = res.container.firstElementChild!;
        expect(declarations(frame)?.width).to.eql(480);
        expect(declarations(frame)).not.to.have.property('gap');
        expect(declarations(frame)).not.to.have.property('lineHeight');
        const sections = [...frame.querySelectorAll('section')];
        expect(sections.length).to.eql(13);
        expect(frame.lastElementChild).to.equal(sections.at(-1));
        const children = [...frame.children];
        const dividers = children.filter((el) => el.getAttribute('aria-hidden') === 'true');
        expect(dividers.length).to.eql(sections.length - 1);
        for (const [index, divider] of dividers.entries()) {
          expect(divider.previousElementSibling).to.equal(sections[index]);
          expect(divider.nextElementSibling).to.equal(sections[index + 1]);
          expect(divider.hasAttribute('tabindex')).to.eql(false);
          expect(divider.childElementCount).to.eql(0);
          expect(declarations(divider)).to.include({
            height: 5,
            backgroundColor: Color.alpha(Color.theme(theme).fg, 0.1),
            marginTop: 14,
            marginRight: -25,
            marginBottom: 10,
            marginLeft: -25,
            pointerEvents: 'none',
          });
        }
        for (const section of sections) {
          expect(declarations(section)).to.include({ display: 'grid', gap: '10px' });
          expect(section.childElementCount).to.eql(2);
          expect(['DIV', 'P']).to.include(section.lastElementChild?.tagName);
          const captionStyle = declarations(section.firstElementChild!);
          expect(captionStyle).to.include({ fontSize: 12, opacity: 0.2 });
          expect(captionStyle).not.to.have.property('marginTop');
        }
        const cases = [
          ['plain', 0, null],
          ['arrow-only', 1, '_self'],
          ['resource-plus-arrow', 2, '_blank'],
        ] as const;
        for (const [kind, count, target] of cases) {
          for (const host of ['standalone', 'prose']) {
            const section = frame.querySelector(`section[aria-label="${kind} / ${host}"]`)!;
            const links = section.querySelectorAll('a');
            expect(links.length).to.eql(1);
            const link = links[0];
            if (host === 'prose') {
              expect(section.querySelector('p a')).to.equal(link);
              expect(declarations(section.querySelector('p')!)).not.to.have.property('maxWidth');
            }
            expect(link.textContent).to.eql('Example website');
            expect(link.getAttribute('target')).to.eql(target);
            expect(link.querySelectorAll('[aria-hidden="true"]').length).to.eql(count);
            expect(link.querySelector('strong')?.textContent).to.eql('Example');
            expect(link.textContent).not.to.contain(D.link.openHint);
            expect(link.querySelector('div')).to.eql(null);
          }
        }
        const wrapping = frame.querySelector('section[aria-label="Wrapping"] p')!;
        expect(declarations(wrapping)?.maxWidth).to.eql(240);
        expect(wrapping.querySelector('a')?.textContent).to.include('longer descriptive label');
        expect(frame.querySelector('p[dir="rtl"] a')).not.to.eql(null);
        expect(frame.querySelectorAll('[role="button"], button, span[tabindex]').length).to.eql(0);
        const clipping = frame.querySelector('section[aria-label="Clipping"]')!;
        const caption = clipping.firstElementChild?.textContent;
        expect(caption).to.eql('Default link / host clipping / 180px');
        const clippedHost = clipping.querySelector('a')!.parentElement!;
        expect(declarations(clippedHost)).to.include({
          width: 180,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        });
        const navigableLinks = [...frame.querySelectorAll('a[href]')];
        expect(navigableLinks.length).to.eql(13);
        for (const link of navigableLinks) {
          expect(link.getAttribute('href')).to.eql('https://example.com');
        }
        expect(frame.querySelector('#anchor-link-destination')).to.eql(null);
        expect(frame.textContent).not.to.include('WebAuthn');
        expect(frame.querySelector('a[title=""]')?.hasAttribute('aria-describedby')).to.eql(true);
      } finally {
        act(() => res.dispose());
      }
    });

    it(`${theme ?? 'default'} → host clipping and link-owned ellipsis retain the same complete label`, async () => {
      const label = 'Example website documentationAndImplementationDetails';
      for (const enabled of [true, false]) {
        const res = await TestReact.render(<LinkExamples theme={theme} enabled={enabled} />);
        try {
          const clipping = res.container.querySelector('section[aria-label="Clipping"]')!;
          const ellipsis = res.container.querySelector('section[aria-label="Ellipsis"]');
          if (Is.nil(ellipsis)) throw new Error('Missing ellipsis companion specimen.');
          const divider = clipping.nextElementSibling!;
          expect(divider.getAttribute('aria-hidden')).to.eql('true');
          expect(divider.nextElementSibling).to.equal(ellipsis);
          expect(ellipsis.firstElementChild?.textContent).to.eql('Link ellipsis / 180px');

          const clippedLink = clipping.querySelector('a')!;
          const ellipsisLink = ellipsis.querySelector('a')!;
          for (const link of [clippedLink, ellipsisLink]) {
            expect(link.textContent).to.eql(label);
            expect(link.querySelector('strong')?.textContent).to.eql('Example');
            const markers = link.querySelectorAll('[aria-hidden="true"] svg');
            expect(markers.length).to.eql(enabled ? 2 : 1);
            expect(link.getAttribute('href')).to.eql(enabled ? 'https://example.com' : null);
            expect(link.getAttribute('target')).to.eql(enabled ? '_self' : null);
            expect(link.getAttribute('aria-disabled')).to.eql(enabled ? null : 'true');
            expect(link.tabIndex).to.eql(enabled ? 0 : -1);
            expect(link.textContent).not.to.include('…');
            expect(link.textContent).not.to.include('...');
          }

          expect(declarations(clippedLink)).not.to.have.property('textOverflow');
          const hostStyle = declarations(ellipsisLink.parentElement!) ?? {};
          expect(hostStyle).not.to.have.property('textOverflow');
          expect(hostStyle).not.to.have.property('overflow');
          expect(hostStyle).not.to.have.property('width');
          const clippedRule = ruleText(clippedLink.parentElement!);
          const ellipsisRule = ruleText(ellipsisLink);
          for (const rule of [clippedRule, ellipsisRule]) {
            expect(rule).to.include('width: 180px;');
            expect(rule).to.include('overflow: hidden;');
            expect(rule).to.include('white-space: nowrap;');
          }
          expect(clippedRule).not.to.include('text-overflow:');
          expect(ellipsisRule).to.include('text-overflow: ellipsis;');
          expect(ellipsisRule).to.include('display: inline-block;');
          if (enabled) {
            const selector = `.${ellipsisLink.className}:focus-visible`;
            const rules = Style.Dom.stylesheet().rules.items;
            const focus = rules.find((item) => item.selector === selector);
            if (Is.nil(focus)) throw new Error('Missing link-owned ellipsis focus rule.');
            expect(focus.rule).to.include('outline:');
          }
          expect(ellipsis.querySelectorAll('a').length).to.eql(1);
          const extraTargets = ellipsis.querySelectorAll('button, [role="button"], [tabindex="0"]');
          expect(extraTargets.length).to.eql(0);
        } finally {
          act(() => res.dispose());
        }
      }
    });
  }

  it('disabled host control → no generated opening help or navigation promises', async () => {
    const res = await TestReact.render(<LinkExamples enabled={false} />);
    try {
      expect(res.container.querySelectorAll('a[href], a[target], [hidden]').length).to.eql(0);
      expect(res.container.querySelectorAll('a').length).to.eql(14);
      for (const link of res.container.querySelectorAll('a')) {
        expect(link.getAttribute('aria-disabled')).to.eql('true');
        expect(link.tabIndex).to.eql(-1);
      }
    } finally {
      act(() => res.dispose());
    }
  });
});

/**
 * Helpers:
 */
function declarations(element: Element) {
  const rules = Style.Dom.stylesheet().rules.items;
  return rules.find((item) => item.selector === `.${element.className}`)?.style;
}

/** Registered CSS only; browser ellipsis and focus appearance require a visual check. */
function ruleText(element: Element) {
  const rules = Style.Dom.stylesheet().rules.items;
  const rule = rules.find((item) => item.selector === `.${element.className}`);
  if (Is.nil(rule)) throw new Error(`Missing CSS rule: ${element.className}`);
  return rule.rule;
}
