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
import { Color, D, Is, Json, LocalStorage, Schedule, Style, type t } from '../common.ts';
import { FocusExamples } from '../-spec/-ui.FocusExamples.tsx';

type DebugModule = typeof import('../-spec/-SPEC.Debug.tsx');
type Stored = Pick<t.Anchor.Props, 'theme' | 'href'> & { focusExamples?: boolean };
const storageKey = `dev:${D.displayName}`;

describe('Anchor spec: focus examples', () => {
  DomMock.init({ beforeAll, afterAll });
  let debugModule: DebugModule;
  beforeAll(async () => {
    // Bind Debug's module-level styles to the test document, not the server-side dummy sheet.
    debugModule = await import('../-spec/-SPEC.Debug.tsx');
  });

  it('legacy storage → single view; toggle → persisted examples; reset → single view', async () => {
    const legacy: Stored = { theme: 'Dark', href: 'https://example.com' };
    LocalStorage.immutable<Stored>(storageKey, legacy).reset(legacy);
    const debug = debugModule.createDebugSignals();
    expect(debug.props.focusExamples.value).to.eql(false);
    const { Debug } = debugModule;
    const res = await TestReact.render(<Debug debug={debug} />);
    try {
      const controls = [...res.container.querySelectorAll<HTMLElement>('[role="button"]')];
      const control = controls.find((el) => el.textContent === 'focus examples: false');
      if (Is.nil(control)) throw new Error('Expected focus examples control.');
      await act(async () => {
        control.click();
        await Schedule.micro();
      });
      expect(debug.props.focusExamples.value).to.eql(true);
      expect(stored()?.focusExamples).to.eql(true);
      expect(debugModule.createDebugSignals().props.focusExamples.value).to.eql(true);
      act(() => debug.reset());
      expect(debug.props.focusExamples.value).to.eql(false);
      expect(stored()?.focusExamples).to.eql(false);
    } finally {
      act(() => res.dispose());
    }
  });

  for (const theme of ['Light', 'Dark'] as const) {
    it(`${theme}: examples own their width and separate sections without adding focus targets`, async () => {
      const res = await TestReact.render(<FocusExamples theme={theme} />);
      try {
        const frame = res.container.firstElementChild!;
        expect(declarations(frame)?.width).to.eql(360);
        expect(declarations(frame)).not.to.have.property('gap');
        const sections = [...frame.querySelectorAll('section')];
        expect(sections.length).to.eql(7);
        const children = [...frame.children];
        const dividers = children.filter((el) => el.getAttribute('aria-hidden') === 'true');
        expect(dividers.length).to.eql(sections.length - 1);
        for (const [index, divider] of dividers.entries()) {
          expect(divider.previousElementSibling).to.equal(sections[index]);
          expect(divider.nextElementSibling).to.equal(sections[index + 1]);
          expect(divider.hasAttribute('tabindex')).to.eql(false);
          expect(divider.childElementCount).to.eql(0);
          expect(declarations(divider)).to.include({
            height: 1,
            backgroundColor: Color.alpha(Color.theme(theme).fg, 0.1),
            marginTop: 14,
            marginRight: -10,
            marginBottom: 0,
            marginLeft: -10,
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
      expect(res.container.querySelector('a[download]')?.getAttribute('href')).to.eql('/dist.json');
      const disabled = res.container.querySelector<HTMLAnchorElement>('a[aria-disabled="true"]')!;
      expect(disabled.hasAttribute('href')).to.eql(false);
      expect(disabled.tabIndex).to.eql(-1);
      expect(links.some((el) => el.textContent === 'No href')).to.eql(false);
      const target = res.container.querySelector('#anchor-focus-target');
      expect(target?.textContent).to.eql('Local navigation target');
      // Rendering/attributes only: browser layout, focus heuristics and navigation remain manual proof.
    } finally {
      act(() => res.dispose());
    }
  });
});

/**
 * Helpers:
 */
function stored() {
  return Json.parse<Stored>(localStorage.getItem(storageKey) ?? undefined);
}

/** Declaration inspection only; browser geometry remains a separate check. */
function declarations(element: Element) {
  const rules = Style.Dom.stylesheet().rules.items;
  return rules.find((item) => item.selector === `.${element.className}`)?.style;
}
