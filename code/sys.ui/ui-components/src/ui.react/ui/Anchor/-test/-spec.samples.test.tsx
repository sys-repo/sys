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
import { D, Is, Json, Schedule, Signal } from '../common.ts';
import type { t } from '../-spec/common.ts';
import { Root } from '../-spec/-ui.Root.tsx';
import { EXAMPLE_URL } from '../-spec/-ui.Samples.tsx';

type DebugModule = typeof import('../-spec/-SPEC.Debug.tsx');
type Link = NonNullable<t.DebugValues['link']>;
const storageKey = `dev:${D.displayName}`;

describe('Anchor spec: sample states', () => {
  DomMock.init({ beforeAll, afterAll });
  let debugModule: DebugModule;
  beforeAll(async () => {
    debugModule = await import('../-spec/-SPEC.Debug.tsx');
  });

  it('arrow and globe samples render semantic links and persist their configuration', async () => {
    const res = await setup();
    const { debug, subject, panel } = res;
    try {
      act(() => {
        debug.props.theme.value = 'Light';
      });
      const cases: readonly [string, Link][] = [
        ['sample: arrow →', { openIn: 'self' }],
        ['sample: arrow ↗ (new tab)', { openIn: 'new-tab' }],
        ['sample: globe + →', { resource: 'web', openIn: 'self' }],
        ['sample: globe + ↗ (new tab)', { resource: 'web', openIn: 'new-tab' }],
      ];
      for (const [label, link] of cases) {
        await click(panel, label);
        const anchor = subject.querySelector('a')!;
        const hint = subject.querySelector('[hidden]');
        const newTab = link.openIn === 'new-tab';
        expect(subject.firstElementChild).to.equal(anchor);
        expect(subject.querySelectorAll('a').length).to.eql(1);
        expect(subject.querySelector('section')).to.eql(null);
        expect(anchor.textContent).to.eql('Example website');
        expect(anchor.getAttribute('href')).to.eql(EXAMPLE_URL);
        expect(anchor.getAttribute('target')).to.eql(newTab ? '_blank' : '_self');
        expect(anchor.querySelectorAll('svg').length).to.eql(link.resource ? 2 : 1);
        expect(anchor.hasAttribute('download')).to.eql(false);
        expect(hint?.textContent ?? null).to.eql(newTab ? D.link.openHint : null);
        expect(debug.props.link.value).to.eql(link);
        expect(debug.props.theme.value).to.eql('Light');
        expect(stored()?.link).to.eql(link);
        expect(debugModule.createDebugSignals().props.link.value).to.eql(link);
      }
    } finally {
      act(() => res.dispose());
    }
  });

  it('controls follow the selected API; native samples and reset clear semantic decoration', async () => {
    const res = await setup();
    const { debug, subject, panel } = res;
    const anchor = () => subject.querySelector('a')!;
    try {
      await click(panel, 'sample: globe + ↗ (new tab)');
      expect(panel.firstElementChild?.textContent).to.eql('Anchor.Link');
      expect(labels(panel).some((label) => label.startsWith('target:'))).to.eql(false);
      expect(labels(panel).some((label) => label.startsWith('download:'))).to.eql(false);
      await click(panel, 'resource: web');
      expect(anchor().querySelectorAll('svg').length).to.eql(1);
      await click(panel, 'openIn: new-tab');
      expect(anchor().getAttribute('target')).to.eql('_self');
      expect(subject.querySelector('[hidden]')).to.eql(null);
      await click(panel, 'resource: (none)');
      expect(anchor().querySelectorAll('svg').length).to.eql(2);
      expect(stored()?.link).to.eql({ openIn: 'self', resource: 'web' });
      await click(panel, 'enabled: true');
      expect(anchor().hasAttribute('href')).to.eql(false);
      expect(anchor().querySelectorAll('svg').length).to.eql(1);

      // Inactive native fields must not compete with semantic opening controls.
      act(() => {
        debug.props.target.value = '_top';
        debug.props.download.value = true;
      });
      await click(panel, 'enabled: false');
      expect(anchor().getAttribute('target')).to.eql('_self');
      expect(anchor().hasAttribute('download')).to.eql(false);

      await click(panel, 'sample: download (/dist.json)');
      expect(debug.props.link.value).to.eql(undefined);
      expect(stored()?.link).to.eql(undefined);
      expect(anchor().getAttribute('href')).to.eql('/dist.json');
      expect(anchor().hasAttribute('download')).to.eql(true);
      expect(subject.querySelector('svg, [hidden]')).to.eql(null);
      expect(labels(panel).some((label) => label.startsWith('target:'))).to.eql(true);
      expect(labels(panel).some((label) => label.startsWith('download:'))).to.eql(true);
      expect(labels(panel).some((label) => label.startsWith('openIn:'))).to.eql(false);
      expect(labels(panel).some((label) => label.startsWith('resource:'))).to.eql(false);

      await click(panel, 'sample: globe + →');
      await click(panel, 'sample: default link');
      expect(anchor().getAttribute('target')).to.eql(null);
      expect(subject.querySelector('svg, [hidden]')).to.eql(null);
      await click(panel, 'sample: globe + ↗ (new tab)');
      await click(panel, '(reset)');
      expect(debug.props.link.value).to.eql(undefined);
      expect(stored()?.link).to.eql(undefined);
      expect(debug.props.examples.value).to.eql('none');
      expect(anchor().getAttribute('href')).to.eql(EXAMPLE_URL);
      expect(anchor().textContent).to.eql(EXAMPLE_URL);
      expect(subject.querySelector('svg, [hidden]')).to.eql(null);
    } finally {
      act(() => res.dispose());
    }
  });

  async function setup() {
    const debug = debugModule.createDebugSignals();
    debug.reset();
    const { Debug } = debugModule;
    function Subject() {
      Signal.useRedrawEffect(debug.listen);
      return <Root {...Signal.toObject(debug.props)} />;
    }
    const res = await TestReact.render(
      <>
        <div>
          <Subject />
        </div>
        <Debug debug={debug} />
      </>,
    );
    const subject = res.container.firstElementChild!;
    const panel = res.container.lastElementChild!;
    return { ...res, debug, subject, panel };
  }
});

/**
 * Helpers:
 */
function labels(panel: Element) {
  return [...panel.querySelectorAll('[role="button"]')].map((el) => el.textContent ?? '');
}

async function click(panel: Element, label: string) {
  const control = [...panel.querySelectorAll<HTMLElement>('[role="button"]')]
    .find((el) => el.textContent === label);
  if (Is.nil(control)) throw new Error(`Missing sample control: ${label}`);
  await act(async () => {
    control.click();
    await Schedule.micro();
  });
}

function stored() {
  return Json.parse<Partial<t.DebugValues>>(localStorage.getItem(storageKey) ?? undefined);
}
