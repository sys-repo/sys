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
import { D, Is, Json, LocalStorage, Schedule, Signal, Style } from '../common.ts';
import type { t } from '../-spec/common.ts';
import { Root } from '../-spec/-ui.Root.tsx';
import { EXAMPLE_URL } from '../-spec/-ui.Samples.tsx';
import { key } from '../../Button/-test/u.fixture.ts';

type DebugModule = typeof import('../-spec/-SPEC.Debug.tsx');
type Link = NonNullable<t.DebugValues['link']>;
const storageKey = `dev:${D.displayName}`;

describe('Anchor spec: sample states', () => {
  DomMock.init({ beforeAll, afterAll });
  let debugModule: DebugModule;
  beforeAll(async () => {
    debugModule = await import('../-spec/-SPEC.Debug.tsx');
  });

  it('sample actions → semantic list, unchanged patches, and no remembered selection', async () => {
    const res = await setup();
    const { debug, panel } = res;
    const p = debug.props;
    const cases: readonly [string, Partial<t.DebugValues>][] = [
      ['sample: default link', { children: EXAMPLE_URL }],
      ['sample: truncated link', {
        children: 'Example website with a longer descriptive label for testing truncation',
        maxWidth: 120,
      }],
      ['sample: new tab', { target: '_blank', children: 'opens in new tab' }],
      ['sample: arrow →', { children: 'Example website', link: { openIn: 'self' } }],
      ['sample: arrow ↗ (new tab)', { children: 'Example website', link: { openIn: 'new-tab' } }],
      ['sample: globe + →', {
        children: 'Example website',
        link: { resource: 'web', openIn: 'self' },
      }],
      ['sample: globe + ↗ (new tab)', {
        children: 'Example website',
        link: { resource: 'web', openIn: 'new-tab' },
      }],
      ['sample: download (/dist.json)', {
        href: '/dist.json',
        download: true,
        children: 'download dist.json',
      }],
      ['sample: disabled link', {
        enabled: false,
        target: '_blank',
        children: 'disabled link',
      }],
      ['sample: text-only (no href)', { href: undefined, children: 'plain text (passthrough)' }],
      ['sample: empty child', { href: undefined, children: undefined }],
    ];
    try {
      const list = panel.querySelector('ul')!;
      expect(list, 'samples use a semantic list').not.to.eql(null);
      expect([...list.children].map((el) => el.tagName)).to.eql(cases.map(() => 'LI'));
      const buttons = [...list.querySelectorAll<HTMLElement>('[role="button"]')];
      expect(buttons.map((el) => el.textContent)).to.eql(cases.map(([label]) => label));
      expect(buttons.map((el) => el.tabIndex)).to.eql(cases.map(() => 0));
      function pressed() {
        const current = panel.querySelectorAll('ul [role="button"]');
        return [...current].map((el) => el.getAttribute('aria-pressed'));
      }
      expect(pressed()).to.eql(cases.map(() => null));

      for (const [label, expected] of cases) {
        await act(async () => {
          p.theme.value = 'Light';
          p.truncate.value = true;
          p.maxWidth.value = 180;
          p.examples.value = 'links';
          p.href.value = '/previous';
          p.enabled.value = false;
          p.download.value = true;
          p.target.value = '_top';
          p.children.value = 'Previous';
          p.link.value = { resource: 'web', openIn: 'new-tab' };
        });
        await click(panel, label);
        expect(Signal.toObject(p), label).to.eql({
          theme: 'Light',
          href: EXAMPLE_URL,
          enabled: true,
          truncate: true,
          maxWidth: 180,
          target: undefined,
          download: false,
          children: undefined,
          examples: 'none',
          link: undefined,
          ...expected,
        });
        expect(pressed()).to.eql(cases.map(() => null));
        expect(stored()).to.include({ theme: 'Light', truncate: true, examples: 'none' });
      }

      for (const input of ['Enter', ' ']) {
        const button = buttons[0];
        await act(async () => {
          button.focus();
          key(button, 'keydown', input);
          key(button, 'keyup', input);
          await Schedule.micro();
        });
        expect(p.href.value).to.eql(EXAMPLE_URL);
        await click(panel, `children: ${EXAMPLE_URL}`);
        expect(p.children.value).to.eql('link label');
        expect(pressed()).to.eql(cases.map(() => null));
      }
    } finally {
      act(() => res.dispose());
    }
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

  it('truncated-link preset → one click selects a long label and a 120px ellipsis constraint', async () => {
    const res = await setup();
    const { debug, subject, panel } = res;
    const longLabel = 'Example website with a longer descriptive label for testing truncation';
    try {
      for (const examples of ['none', 'focus', 'links'] as const) {
        await act(async () => {
          debug.props.examples.value = examples;
          debug.props.truncate.value = false;
          debug.props.maxWidth.value = 320;
          debug.props.href.value = undefined;
          debug.props.enabled.value = false;
          debug.props.download.value = true;
          debug.props.link.value = { resource: 'web', openIn: 'new-tab' };
          await Schedule.micro();
        });
        await click(panel, 'sample: truncated link');
        const anchor = subject.querySelector('a')!;
        expect(subject.firstElementChild).to.equal(anchor);
        expect(subject.querySelectorAll('a').length).to.eql(1);
        expect(anchor.textContent).to.eql(longLabel);
        expect(anchor.getAttribute('href')).to.eql(EXAMPLE_URL);
        expect(anchor.hasAttribute('aria-disabled')).to.eql(false);
        expect(anchor.hasAttribute('download')).to.eql(false);
        const declarations = [
          'max-width: 120px;',
          'display: inline-block;',
          'overflow: hidden;',
          'white-space: nowrap;',
          'text-overflow: ellipsis;',
        ];
        for (const declaration of declarations) {
          expect(ruleText(anchor)).to.include(declaration);
        }
        expect(labels(panel)).to.include('truncate: true');
        expect(labels(panel).slice(-2)).to.eql(['maxWidth: 120px', '(reset)']);
        expect(stored()).to.include({
          examples: 'none',
          truncate: true,
          maxWidth: 120,
          children: longLabel,
        });
        expect(debug.props.link.value).to.eql(undefined);
      }
      const reopened = Signal.toObject(debugModule.createDebugSignals().props);
      expect(reopened).to.include({ truncate: true, maxWidth: 120, children: longLabel });
      await click(panel, 'truncate: true');
      const anchor = subject.querySelector('a')!;
      expect(anchor.textContent).to.eql(longLabel);
      expect(ruleText(anchor)).not.to.include('max-width:');
      expect(ruleText(anchor)).not.to.include('text-overflow:');
    } finally {
      act(() => res.dispose());
    }
  });

  for (const sample of ['sample: default link', 'sample: globe + ↗ (new tab)']) {
    it(`${sample} → truncation reveals an independent, persisted width control`, async () => {
      const res = await setup();
      const { subject, panel } = res;
      const anchor = () => subject.querySelector('a')!;
      const hasWidthControl = () => labels(panel).some((label) => label.startsWith('maxWidth:'));
      try {
        await click(panel, sample);
        const label = anchor().textContent;
        expect(labels(panel)).to.include('truncate: false');
        expect(hasWidthControl()).to.eql(false);
        expect(ruleText(anchor())).not.to.include('max-width:');

        await click(panel, 'truncate: false');
        expect(labels(panel).slice(-2)).to.eql(['maxWidth: none', '(reset)']);
        expect(anchor().textContent).to.eql(label);
        expect(ruleText(anchor())).to.include('text-overflow: ellipsis;');
        expect(ruleText(anchor())).not.to.include('max-width:');
        const widths = [[undefined, 120], [120, 180], [180, 320], [320, undefined]] as const;
        for (const [current, next] of widths) {
          await click(panel, `maxWidth: ${current ? `${current}px` : 'none'}`);
          expect(labels(panel)).to.include(`maxWidth: ${next ? `${next}px` : 'none'}`);
          if (next) expect(ruleText(anchor())).to.include(`max-width: ${next}px;`);
          else expect(ruleText(anchor())).not.to.include('max-width:');
        }
        await click(panel, 'maxWidth: none');
        await click(panel, 'maxWidth: 120px');
        expect(stored()).to.include({ truncate: true, maxWidth: 180 });
        const reopened = Signal.toObject(debugModule.createDebugSignals().props);
        expect(reopened).to.include({ truncate: true, maxWidth: 180 });

        await click(panel, 'truncate: true');
        expect(hasWidthControl()).to.eql(false);
        expect(ruleText(anchor())).not.to.include('max-width:');
        expect(ruleText(anchor())).not.to.include('text-overflow:');
        expect(stored()).to.include({ truncate: false, maxWidth: 180 });
        expect(anchor().textContent).to.eql(label);
        await click(panel, 'truncate: false');
        expect(labels(panel)).to.include('maxWidth: 180px');
        expect(ruleText(anchor())).to.include('max-width: 180px;');

        // Selecting another preset preserves these independent exploration controls.
        await click(panel, 'sample: default link');
        await click(panel, `children: ${EXAMPLE_URL}`);
        await click(panel, 'children: link label');
        const longLabel = 'Example website with a longer descriptive label for testing truncation';
        expect(anchor().textContent).to.eql(longLabel);
        expect(ruleText(anchor())).to.include('max-width: 180px;');
        expect(ruleText(anchor())).to.include('text-overflow: ellipsis;');
        expect(anchor().getAttribute('href')).to.eql(EXAMPLE_URL);
        expect(subject.firstElementChild).to.equal(anchor());
        expect(subject.querySelectorAll('a').length).to.eql(1);

        await click(panel, '(reset)');
        expect(labels(panel)).to.include(`truncate: ${D.truncate}`);
        expect(hasWidthControl()).to.eql(false);
        expect(stored()).to.include({ truncate: D.truncate });
        expect(stored()).not.to.have.property('maxWidth');
        expect(ruleText(anchor())).not.to.include('max-width:');
        expect(ruleText(anchor())).not.to.include('text-overflow:');
      } finally {
        act(() => res.dispose());
      }
    });
  }

  it('legacy preferences → truncation defaults without inventing a width constraint', () => {
    const store = LocalStorage.immutable<Partial<t.DebugValues>>(storageKey, {});
    const previous = store.current;
    try {
      store.reset({ theme: 'Light', href: EXAMPLE_URL });
      const debug = debugModule.createDebugSignals();
      expect(Signal.toObject(debug.props)).to.include({
        theme: 'Light',
        truncate: D.truncate,
        maxWidth: undefined,
      });
      expect(stored()).to.include({ truncate: D.truncate });
      expect(stored()).not.to.have.property('maxWidth');
    } finally {
      store.reset(previous);
    }
  });

  it('single-sample truncation controls leave fixed comparison views unchanged', async () => {
    const res = await setup();
    const { subject, panel } = res;
    try {
      await click(panel, 'examples: none');
      for (const mode of ['focus', 'links']) {
        const before = subject.innerHTML;
        await click(panel, 'truncate: false');
        await click(panel, 'maxWidth: none');
        expect(subject.innerHTML).to.eql(before);
        await click(panel, 'maxWidth: 120px');
        await click(panel, 'maxWidth: 180px');
        await click(panel, 'maxWidth: 320px');
        await click(panel, 'truncate: true');
        expect(subject.innerHTML).to.eql(before);
        await click(panel, `examples: ${mode}`);
      }
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

function ruleText(element: Element) {
  const rule = Style.Dom.stylesheet().rules.items.find((item) => {
    return item.selector === `.${element.className}`;
  });
  if (Is.nil(rule)) throw new Error(`Missing CSS rule: ${element.className}`);
  return rule.rule;
}
