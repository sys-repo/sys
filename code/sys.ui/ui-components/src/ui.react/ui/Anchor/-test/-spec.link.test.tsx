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
import { Color, D, Style } from '../common.ts';
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
        expect(sections.length).to.eql(12);
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
            height: 3,
            backgroundColor: Color.alpha(Color.theme(theme).fg, 0.1),
            marginTop: 14,
            marginRight: -10,
            marginBottom: 10,
            marginLeft: -10,
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
            expect(link.textContent).to.eql('Read the WebAuthn specification');
            expect(link.getAttribute('target')).to.eql(target);
            expect(link.querySelectorAll('[aria-hidden="true"]').length).to.eql(count);
            expect(link.querySelector('strong')?.textContent).to.eql('WebAuthn');
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
        expect(caption).to.eql('Clipping test / intentionally cut off at 180px');
        const clippedHost = clipping.querySelector('a')!.parentElement!;
        expect(declarations(clippedHost)).to.include({
          width: 180,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        });
        const destination = frame.querySelector('#anchor-link-destination')!;
        const destinationLink = destination.querySelector('a');
        expect(destination).to.equal(sections[0]);
        expect(destinationLink?.getAttribute('href')).to.eql('#anchor-link-destination');
        expect(destination.hasAttribute('tabindex')).to.eql(false);
        expect(frame.textContent).not.to.include('Local links land here.');
        expect(frame.querySelector('a[title=""]')?.hasAttribute('aria-describedby')).to.eql(true);
      } finally {
        act(() => res.dispose());
      }
    });
  }

  it('disabled host control → no generated opening help or navigation promises', async () => {
    const res = await TestReact.render(<LinkExamples enabled={false} />);
    try {
      expect(res.container.querySelectorAll('a[href], a[target], [hidden]').length).to.eql(0);
      expect(res.container.querySelectorAll('a').length).to.eql(13);
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
