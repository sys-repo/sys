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
import { D, Is, Json, LocalStorage, Schedule, Style, type t } from '../common.ts';
import { FocusExamples } from '../-spec/-ui.FocusExamples.tsx';
import { LinkExamples } from '../-spec/-ui.LinkExamples.tsx';

type DebugModule = typeof import('../-spec/-SPEC.Debug.tsx');
type Stored = Pick<t.Anchor.Props, 'theme' | 'href'> & { examples?: 'none' | 'focus' | 'links' };
const storageKey = `dev:${D.displayName}`;

describe('Anchor spec: shared examples control and presentation', () => {
  DomMock.init({ beforeAll, afterAll });
  let debugModule: DebugModule;
  beforeAll(async () => {
    // Bind Debug's module-level styles to the test document, not the server-side dummy sheet.
    debugModule = await import('../-spec/-SPEC.Debug.tsx');
  });

  it('one examples control → full persisted cycle; reset → single view', async () => {
    const legacy: Stored = { theme: 'Dark', href: 'https://example.com' };
    LocalStorage.immutable<Stored>(storageKey, legacy).reset(legacy);
    const debug = debugModule.createDebugSignals();
    expect(debug.props.examples.value).to.eql('none');
    const { Debug } = debugModule;
    const res = await TestReact.render(<Debug debug={debug} />);
    try {
      const controls = [...res.container.querySelectorAll<HTMLElement>('[role="button"]')];
      const examples = controls.filter((el) => el.textContent?.includes('examples:'));
      expect(examples.length).to.eql(1);
      const control = examples[0];
      if (Is.nil(control)) throw new Error('Expected examples control.');
      for (const expected of ['focus', 'links', 'none'] as const) {
        await act(async () => {
          control.click();
          await Schedule.micro();
        });
        expect(control.textContent).to.eql(`examples: ${expected}`);
        expect(debug.props.examples.value).to.eql(expected);
        expect(stored()?.examples).to.eql(expected);
        expect(debugModule.createDebugSignals().props.examples.value).to.eql(expected);
      }
      act(() => {
        debug.props.examples.value = 'links';
      });
      act(() => debug.reset());
      expect(debug.props.examples.value).to.eql('none');
      expect(stored()?.examples).to.eql('none');
    } finally {
      act(() => res.dispose());
    }
  });

  it('every sample selection leaves either examples mode and persists the single view', async () => {
    const debug = debugModule.createDebugSignals();
    debug.reset();
    const { Debug } = debugModule;
    const res = await TestReact.render(<Debug debug={debug} />);
    try {
      const controls = [...res.container.querySelectorAll<HTMLElement>('[role="button"]')];
      const samples = controls.filter((el) => el.textContent?.startsWith('sample:'));
      expect(samples.length).to.eql(11);
      for (const mode of ['focus', 'links'] as const) {
        for (const sample of samples) {
          await act(async () => {
            debug.props.examples.value = mode;
            await Schedule.micro();
          });
          await act(async () => {
            sample.click();
            await Schedule.micro();
          });
          expect(debug.props.examples.value, sample.textContent ?? '').to.eql('none');
          expect(stored()?.examples).to.eql('none');
          expect(debug.props.theme.value).to.eql('Dark');
        }
      }
    } finally {
      act(() => res.dispose());
    }
  });

  it('legacy flags migrate once; an explicit union value wins and is the only persisted mode', () => {
    const cases = [
      [{}, 'none'],
      [{ focusExamples: true }, 'focus'],
      [{ linkExamples: true }, 'links'],
      [{ focusExamples: true, linkExamples: true }, 'links'],
      [{ examples: 'none', focusExamples: true, linkExamples: true }, 'none'],
      [{ examples: 'focus', linkExamples: true }, 'focus'],
      [{ examples: 'links', focusExamples: true }, 'links'],
    ] as const;
    for (const [mode, expected] of cases) {
      const initial = { theme: 'Dark', ...mode };
      const store = LocalStorage.immutable(storageKey, initial);
      store.reset(initial);
      const debug = debugModule.createDebugSignals();
      expect(debug.props.examples.value).to.eql(expected);
      expect(debug.props.theme.value).to.eql('Dark');
      expect(store.current).to.include({ examples: expected });
      for (const legacy of ['focusExamples', 'linkExamples']) {
        expect(debug.props).not.to.have.property(legacy);
        expect(store.current).not.to.have.property(legacy);
      }
      expect(debugModule.createDebugSignals().props.examples.value).to.eql(expected);
    }
  });

  it('both example views share caption, example, and divider styles with emitted pixel spacing', async () => {
    const res = await TestReact.render(
      <>
        <FocusExamples theme='Dark' />
        <LinkExamples theme='Dark' />
      </>,
    );
    try {
      const [focus, links] = res.container.children;
      const caption = (frame: Element) => frame.querySelector('section > div');
      expect(caption(links)?.className).to.eql(caption(focus)?.className);
      const divider = (frame: Element) => {
        return [...frame.children].find((el) => el.getAttribute('aria-hidden') === 'true');
      };
      expect(divider(links)?.className).to.eql(divider(focus)?.className);
      const example = links.querySelector('section')!;
      expect(example.className).to.eql(focus.querySelector('section')?.className);
      const rules = Style.Dom.stylesheet().rules.items;
      const rule = (element: Element) => {
        return rules.find((item) => item.selector === `.${element.className}`)?.rule;
      };
      expect(rule(example)).to.contain('gap: 10px;');
      expect(rule(divider(links)!)).to.contain('margin-top: 14px;');
      expect(rule(divider(links)!)).to.contain('margin-bottom: 10px;');
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
