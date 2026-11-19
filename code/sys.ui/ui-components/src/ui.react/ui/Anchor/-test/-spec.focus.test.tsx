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
import { Color, Style } from '../common.ts';
import { FocusExamples } from '../-spec/-ui.FocusExamples.tsx';

describe('Anchor spec: focus examples', () => {
  DomMock.init({ beforeAll, afterAll });

  for (const theme of ['Light', 'Dark'] as const) {
    it(`${theme}: examples own their width and separate sections without adding focus targets`, async () => {
      const res = await TestReact.render(<FocusExamples theme={theme} />);
      try {
        const frame = res.container.firstElementChild!;
        expect(declarations(frame)?.width).to.eql(360);
        expect(declarations(frame)).not.to.have.property('gap');
        expect(declarations(frame)).not.to.have.property('lineHeight');
        const sections = [...frame.querySelectorAll('section')];
        expect(sections.length).to.eql(7);
        expect(frame.lastElementChild).to.equal(sections.at(-1));
        const captions = [
          frame.firstElementChild!,
          ...sections.map((section) => section.firstElementChild!),
        ];
        for (const caption of captions) {
          expect(declarations(caption)).to.include({ fontSize: 12, opacity: 0.2 });
        }
        for (const section of sections) {
          expect(declarations(section)).to.include({ display: 'grid', gap: '10px' });
          expect(section.childElementCount).to.eql(2);
          expect(['DIV', 'P']).to.include(section.lastElementChild?.tagName);
          expect(declarations(section.firstElementChild!)).not.to.have.property('marginTop');
        }
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
        expect(declarations(frame.querySelector('p')!)?.width).to.eql(220);
      } finally {
        act(() => res.dispose());
      }
    });
  }

  it('renders prose, the real KeyValue consumer, and native link specimens', async () => {
    const res = await TestReact.render(<FocusExamples theme='Light' />);
    try {
      const inline = res.container.querySelector<HTMLAnchorElement>('p a')!;
      expect(inline.getAttribute('href')).to.eql('#anchor-focus-target');
      expect(inline.parentElement?.textContent).to.include('Before a longer link');
      const links = [...res.container.querySelectorAll<HTMLAnchorElement>('a')];
      expect(res.container.querySelector('[role="button"]')?.textContent).to.eql('Button');
      const pairedLink = links.find((el) => el.textContent === 'Anchor');
      expect(pairedLink?.getAttribute('href')).to.eql('#anchor-focus-target');
      const cell = links.find((el) => el.textContent?.includes('actual KeyValue cell'));
      expect(cell?.getAttribute('href')).to.eql('#anchor-focus-target');
      expect(cell?.getAttribute('target')).to.eql(null);
      const external = res.container.querySelector<HTMLAnchorElement>('a[target="_blank"]')!;
      expect(external.rel).to.eql('noopener noreferrer');
      expect(external.getAttribute('href')).to.eql('https://example.com');
      expect(external.textContent).to.eql('New tab');
      expect(external.querySelectorAll('span[aria-hidden="true"] svg').length).to.eql(1);
      const hint = external.nextElementSibling!;
      expect(hint.hasAttribute('hidden')).to.eql(true);
      expect(hint.textContent).to.eql('Opens in a new tab');
      expect(external.getAttribute('aria-describedby')).to.eql(hint.id);
      expect(res.container.querySelector('a[download]')?.getAttribute('href')).to.eql('/dist.json');
      const disabled = res.container.querySelector<HTMLAnchorElement>('a[aria-disabled="true"]')!;
      expect(disabled.hasAttribute('href')).to.eql(false);
      expect(disabled.tabIndex).to.eql(-1);
      expect(links.some((el) => el.textContent === 'No href')).to.eql(false);
      const target = res.container.querySelector('#anchor-focus-target')!;
      expect(target).to.equal(res.container.querySelector('section'));
      expect(target.contains(pairedLink!)).to.eql(true);
      expect(target.hasAttribute('tabindex')).to.eql(false);
      expect(res.container.textContent).not.to.include('Local navigation target');
      // Rendering/attributes only: browser layout, focus heuristics and navigation remain manual proof.
    } finally {
      act(() => res.dispose());
    }
  });

  it('disabling the examples removes the new-tab marker, hint, and navigation', async () => {
    const res = await TestReact.render(<FocusExamples theme='Dark' enabled={false} />);
    try {
      const links = [...res.container.querySelectorAll<HTMLAnchorElement>('a')];
      const external = links.find((el) => el.textContent === 'New tab')!;
      expect(external.getAttribute('aria-disabled')).to.eql('true');
      expect(external.tabIndex).to.eql(-1);
      expect(external.hasAttribute('href')).to.eql(false);
      expect(external.hasAttribute('target')).to.eql(false);
      expect(external.hasAttribute('aria-describedby')).to.eql(false);
      expect(external.querySelector('svg')).to.eql(null);
      expect(res.container.querySelector('[hidden]')).to.eql(null);
    } finally {
      act(() => res.dispose());
    }
  });
});

/** Declaration inspection only; browser geometry remains a separate check. */
function declarations(element: Element) {
  const rules = Style.Dom.stylesheet().rules.items;
  return rules.find((item) => item.selector === `.${element.className}`)?.style;
}
