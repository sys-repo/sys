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
import { Dev, type t } from '../-spec/common.ts';
import { Root } from '../-spec/-ui.Root.tsx';
import { EXAMPLE_URL } from '../-spec/-ui.Samples.tsx';
import { key } from '../../Button/-test/u.fixture.ts';
import { BulletList } from '../../BulletList/mod.ts';

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
      ['default link', { children: EXAMPLE_URL }],
      ['monospace link', { children: EXAMPLE_URL, mono: true }],
      ['truncated link', {
        children: 'Example website with a longer descriptive label for testing truncation',
        maxWidth: 120,
      }],
      ['new tab', { target: '_blank', children: 'opens in new tab' }],
      ['arrow →', { children: 'Example website', link: { openIn: 'self' } }],
      ['arrow ↗ (new tab)', { children: 'Example website', link: { openIn: 'new-tab' } }],
      ['globe + →', {
        children: 'Example website',
        link: { resource: 'web', openIn: 'self' },
      }],
      ['globe + ↗ (new tab)', {
        children: 'Example website',
        link: { resource: 'web', openIn: 'new-tab' },
      }],
      ['Dev.Link (default)', {
        children: 'Example website',
        link: { api: 'dev', resource: 'default' },
      }],
      ['download (/dist.json)', {
        href: '/dist.json',
        download: true,
        children: 'download dist.json',
      }],
      ['disabled link', {
        enabled: false,
        target: '_blank',
        children: 'disabled link',
      }],
      ['text-only (no href)', { href: undefined, children: 'plain text (passthrough)' }],
      ['empty child', { href: undefined, children: undefined }],
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
          p.mono.value = D.mono;
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
          mono: D.mono,
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

  it('mono preset and toggle → shared, persisted typography across native and semantic links', async () => {
    const res = await setup();
    const { debug, subject, panel } = res;
    const root = () => Root(Signal.toObject(debug.props));
    try {
      expect(labels(panel)).to.include(`mono: ${D.mono}`);
      const samples = ['monospace link', 'arrow →', 'Dev.Link (default)'];
      for (const sample of samples) {
        await click(panel, sample);
        expect(root().props.mono).to.eql(true);
        expect(labels(panel)).to.include('mono: true');
        expect(ruleText(subject.querySelector('a')!)).to.include('font-family: monospace;');
        expect(stored()).to.include({ mono: true });
        const reopened = Signal.toObject(debugModule.createDebugSignals().props);
        expect(Root(reopened).props.mono).to.eql(true);

        await click(panel, 'mono: true');
        expect(root().props.mono).to.eql(false);
        expect(ruleText(subject.querySelector('a')!)).not.to.include('font-family:');
        expect(stored()).to.include({ mono: false });
        await click(panel, 'mono: false');
        expect(root().props.mono).to.eql(true);
      }
      await click(panel, 'default link');
      expect(root().props.mono).to.eql(D.mono);
      await click(panel, 'mono: false');
      await click(panel, '(reset)');
      expect(root().props.mono).to.eql(D.mono);
      expect(labels(panel)).to.include(`mono: ${D.mono}`);
      expect(stored()).to.include({ mono: D.mono });
    } finally {
      act(() => res.dispose());
    }
  });

  it('sample list → public BulletList small size and horizontal row insets', async () => {
    const res = await setup();
    try {
      const reference = await TestReact.render(
        <BulletList.UI
          theme='Light'
          size='sm'
          itemPadding={[0, 8, 0, 5]}
          items={[{ id: 'reference', label: 'Reference' }]}
        />,
      );
      try {
        const list = res.panel.querySelector('ul')!;
        expect(list.className).to.eql(reference.container.querySelector('ul')!.className);
        const expected = reference.container.querySelector('[role="button"]')!.className;
        for (const row of list.querySelectorAll<HTMLElement>('[role="button"]')) {
          expect(row.className).to.eql(expected);
          act(() => row.focus());
          expect(row.className).to.eql(expected);
        }
      } finally {
        act(() => reference.dispose());
      }
    } finally {
      act(() => res.dispose());
    }
  });

  it('sample section → existing thin rule gains top spacing before Debug', async () => {
    const res = await setup();
    try {
      const divider = res.panel.querySelector('hr:last-of-type')!;
      expect(divider.nextElementSibling?.textContent).to.eql('Debug');
      expect(ruleText(divider)).to.include('margin-top: 22px;');
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
        ['arrow →', { openIn: 'self' }],
        ['arrow ↗ (new tab)', { openIn: 'new-tab' }],
        ['globe + →', { resource: 'web', openIn: 'self' }],
        ['globe + ↗ (new tab)', { resource: 'web', openIn: 'new-tab' }],
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

  it('Dev.Link preset → real composition, shared controls, and durable resource opt-out', async () => {
    const res = await setup();
    const { debug, subject, panel } = res;
    const p = debug.props;
    const anchor = () => subject.querySelector('a')!;
    try {
      await click(panel, 'Dev.Link (default)');
      expect(panel.firstElementChild?.textContent).to.eql(D.name);
      expect(labels(panel)).to.include('resource: default');
      expect(labels(panel).some((label) => label.startsWith('target:'))).to.eql(false);
      expect(labels(panel).some((label) => label.startsWith('download:'))).to.eql(false);
      const initial = Root(Signal.toObject(p));
      expect(initial.type).to.equal(Dev.Link);
      expect(initial.props).not.to.have.property('resource');
      expect(anchor().textContent).to.eql('Example website');
      expect(anchor().getAttribute('href')).to.eql(EXAMPLE_URL);
      expect(anchor().getAttribute('target')).to.eql('_self');
      expect(anchor().querySelectorAll('[aria-hidden="true"]').length).to.eql(2);

      await click(panel, 'theme: Dark');
      expect(Root(Signal.toObject(p)).props.theme).to.eql('Light');
      await click(panel, 'truncate: false');
      await click(panel, 'maxWidth: none');
      expect(ruleText(anchor())).to.include('max-width: 120px;');
      expect(ruleText(anchor())).to.include('text-overflow: ellipsis;');
      await click(panel, 'openIn: self');
      expect(anchor().getAttribute('target')).to.eql('_blank');
      expect(anchor().getAttribute('rel')).to.eql('noopener noreferrer');
      await click(panel, 'enabled: true');
      expect(anchor().hasAttribute('href')).to.eql(false);
      await click(panel, 'enabled: false');

      // Native controls cannot leak through either semantic API.
      await act(async () => {
        p.target.value = '_top';
        p.download.value = true;
        await Schedule.micro();
      });
      expect(anchor().getAttribute('target')).to.eql('_blank');
      expect(anchor().hasAttribute('download')).to.eql(false);

      // JSON must retain none, while default must omit the actual resource prop.
      for (const resource of ['default', 'web', 'none'] as const) {
        expect(labels(panel)).to.include(`resource: ${resource}`);
        expect(stored()?.link).to.eql({ api: 'dev', resource, openIn: 'new-tab' });
        const reopened = debugModule.createDebugSignals();
        const root = Root(Signal.toObject(reopened.props));
        expect(root.type).to.equal(Dev.Link);
        if (resource === 'default') {
          expect(root.props).not.to.have.property('resource');
        } else {
          expect(root.props).to.have.property('resource', resource === 'none' ? undefined : 'web');
        }
        const rendered = await TestReact.render(root);
        try {
          expect(rendered.container.querySelectorAll('a [aria-hidden="true"]').length)
            .to.eql(resource === 'none' ? 1 : 2);
        } finally {
          act(() => rendered.dispose());
        }
        await click(panel, `resource: ${resource}`);
      }
      expect(labels(panel)).to.include('resource: default');
      expect(Root(Signal.toObject(p)).props).not.to.have.property('resource');

      await click(panel, 'arrow →');
      expect(panel.firstElementChild?.textContent).to.eql(D.name);
      expect(labels(panel)).to.include('resource: (none)');
      expect(anchor().querySelectorAll('[aria-hidden="true"]').length).to.eql(1);
      await click(panel, 'Dev.Link (default)');
      await click(panel, 'default link');
      expect(panel.firstElementChild?.textContent).to.eql(D.name);
      expect(subject.querySelector('svg, [hidden]')).to.eql(null);
      await click(panel, 'Dev.Link (default)');
      await click(panel, '(reset)');
      expect(p.link.value).to.eql(undefined);
      expect(stored()?.link).to.eql(undefined);
      expect(panel.firstElementChild?.textContent).to.eql(D.name);
    } finally {
      act(() => res.dispose());
    }
  });

  it('controls follow the selected API; native samples and reset clear semantic decoration', async () => {
    const res = await setup();
    const { debug, subject, panel } = res;
    const anchor = () => subject.querySelector('a')!;
    try {
      await click(panel, 'globe + ↗ (new tab)');
      expect(panel.firstElementChild?.textContent).to.eql(D.name);
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

      await click(panel, 'download (/dist.json)');
      expect(debug.props.link.value).to.eql(undefined);
      expect(stored()?.link).to.eql(undefined);
      expect(anchor().getAttribute('href')).to.eql('/dist.json');
      expect(anchor().hasAttribute('download')).to.eql(true);
      expect(subject.querySelector('svg, [hidden]')).to.eql(null);
      expect(labels(panel).some((label) => label.startsWith('target:'))).to.eql(true);
      expect(labels(panel).some((label) => label.startsWith('download:'))).to.eql(true);
      expect(labels(panel).some((label) => label.startsWith('openIn:'))).to.eql(false);
      expect(labels(panel).some((label) => label.startsWith('resource:'))).to.eql(false);

      await click(panel, 'globe + →');
      await click(panel, 'default link');
      expect(anchor().getAttribute('target')).to.eql(null);
      expect(subject.querySelector('svg, [hidden]')).to.eql(null);
      await click(panel, 'globe + ↗ (new tab)');
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
        await click(panel, 'truncated link');
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

  for (const sample of ['default link', 'globe + ↗ (new tab)']) {
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
        await click(panel, 'default link');
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

  it('legacy preferences → mono/truncation defaults without inventing a width constraint', () => {
    const store = LocalStorage.immutable<Partial<t.DebugValues>>(storageKey, {});
    const previous = store.current;
    try {
      store.reset({ theme: 'Light', href: EXAMPLE_URL });
      const debug = debugModule.createDebugSignals();
      expect(Signal.toObject(debug.props)).to.include({
        theme: 'Light',
        mono: D.mono,
        truncate: D.truncate,
        maxWidth: undefined,
      });
      expect(stored()).to.include({ mono: D.mono, truncate: D.truncate });
      expect(stored()).not.to.have.property('maxWidth');
    } finally {
      store.reset(previous);
    }
  });

  it('single-sample typography controls → fixed comparison views stay unchanged', async () => {
    const res = await setup();
    const { subject, panel } = res;
    try {
      await click(panel, 'examples: none');
      for (const mode of ['focus', 'links']) {
        const before = subject.innerHTML;
        await click(panel, 'mono: false');
        expect(subject.innerHTML).to.eql(before);
        await click(panel, 'mono: true');
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
