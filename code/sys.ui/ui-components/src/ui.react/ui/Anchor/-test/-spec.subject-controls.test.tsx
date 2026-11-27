import {
  act,
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  DomMock,
  expect,
  hostFixture,
  it,
  storageFixture,
  TestReact,
} from '../../../-test.ts';
import { D, Is, Schedule, Signal } from '../common.ts';
import { Dev } from '../-spec/common.ts';
import { Root } from '../-spec/-ui.Root.tsx';

type DebugModule = typeof import('../-spec/-SPEC.Debug.tsx');
const storageKey = `dev:${D.displayName}`;

describe('Anchor spec: sample controls', () => {
  let storage: ReturnType<typeof storageFixture>;
  let host: Awaited<ReturnType<typeof hostFixture>>;
  let debugModule: DebugModule;
  beforeAll(async () => {
    storage = storageFixture();
    debugModule = await import('../-spec/-SPEC.Debug.tsx');
  });
  beforeEach(async () => void (host = await hostFixture()));
  afterEach(() => host[Symbol.dispose]());
  afterAll(async () => {
    storage[Symbol.dispose]();
    await DomMock.unpolyfill();
  });

  it('native ↔ semantic presets → incompatible fields and controls do not leak', async () => {
    using res = await setup();
    const { panel, subject } = res;
    await click(panel, 'download (/dist.json)');
    expect(subject.querySelector('a')?.hasAttribute('download')).to.eql(true);

    await click(panel, 'globe + ↗ (new tab)');
    expect(storage.read(storageKey)?.link).to.eql({ resource: 'web', openIn: 'new-tab' });
    expect(storage.read(storageKey)).not.to.have.property('download');
    expect(labels(panel).some((label) => label.startsWith('target:'))).to.eql(false);
    expect(subject.querySelector('a')?.getAttribute('target')).to.eql('_blank');
    await click(panel, 'openIn: new-tab');
    await click(panel, 'resource: web');
    expect(storage.read(storageKey)?.link).to.eql({ openIn: 'self' });
    expect(subject.querySelector('a')?.getAttribute('target')).to.eql('_self');

    await click(panel, 'download (/dist.json)');
    expect(storage.read(storageKey)).not.to.have.property('link');
    expect(labels(panel).some((label) => label.startsWith('openIn:'))).to.eql(false);
    expect(labels(panel).some((label) => label.startsWith('target:'))).to.eql(true);
    expect(subject.querySelector('a')?.hasAttribute('download')).to.eql(true);
  });

  it('Dev.Link resource controls → default omission and explicit opt-out survive reopening', async () => {
    using res = await setup();
    await click(res.panel, 'Dev.Link (default)');
    for (const resource of ['default', 'web', 'none'] as const) {
      expect(storage.read(storageKey)?.link).to.eql({ api: 'dev', resource });
      const reopened = debugModule.createDebugSignals();
      const root = Root(Signal.toObject(reopened.props));
      // This API boundary distinguishes inherited defaults from an explicit opt-out.
      expect(root.type).to.equal(Dev.Link);
      if (resource === 'default') expect(root.props).not.to.have.property('resource');
      else expect(root.props).to.have.property('resource', resource === 'none' ? undefined : 'web');
      await click(res.panel, `resource: ${resource}`);
    }
    expect(storage.read(storageKey)?.link).to.eql({ api: 'dev', resource: 'default' });
  });

  it('exploration controls → survive preset changes and truncation toggles; reset restores preferences', async () => {
    using res = await setup();
    const { debug, panel } = res;
    const p = debug.props;
    const initialPreferences = storage.read(storageKey);
    const mono = !p.mono.value;
    await click(panel, `mono: ${p.mono.value}`);
    await click(panel, 'theme: Dark');
    await click(panel, 'truncate: false');
    await click(panel, 'maxWidth: none');
    const width = p.maxWidth.value;
    expect(width).to.be.greaterThan(0);

    await click(panel, 'globe + →');
    expect(storage.read(storageKey)).to.include({
      theme: 'Light',
      mono,
      truncate: true,
      maxWidth: width,
    });
    const reopened = debugModule.createDebugSignals();
    const root = Root(Signal.toObject(reopened.props));
    expect(root.props).to.include({ theme: 'Light', mono, truncate: true });
    expect(root.props.style).to.eql({ maxWidth: width });

    await click(panel, 'truncate: true');
    expect(labels(panel).some((label) => label.startsWith('maxWidth:'))).to.eql(false);
    expect(Root(Signal.toObject(p)).props.style).to.eql(undefined);
    expect(storage.read(storageKey)).to.include({ truncate: false, maxWidth: width });
    await click(panel, 'truncate: false');
    expect(labels(panel)).to.include(`maxWidth: ${width}px`);
    expect(Root(Signal.toObject(p)).props.style).to.eql({ maxWidth: width });

    await click(panel, '(reset)');
    expect(storage.read(storageKey)).to.eql(initialPreferences);
    expect(Signal.toObject(p)).to.eql(Signal.toObject(debugModule.createDebugSignals().props));
  });

  it('legacy preferences → retain saved fields and hydrate new controls without a width constraint', () => {
    storage.seed(storageKey, { theme: 'Light', href: '/saved-anchor' });
    const debug = debugModule.createDebugSignals();
    debug.attach(host.ctx, {});
    expect(Signal.toObject(debug.props)).to.include({
      theme: 'Light',
      href: '/saved-anchor',
      mono: D.mono,
      truncate: D.truncate,
      maxWidth: undefined,
    });
    expect(storage.read(storageKey)).to.include({ mono: D.mono, truncate: D.truncate });
    expect(storage.read(storageKey)).not.to.have.property('maxWidth');
  });

  it('Anchor.Button sample → shows only the action and respects the enabled control', async () => {
    using res = await setup();
    const { panel, subject } = res;
    await click(panel, 'Anchor.Button');
    const button = subject.querySelector('button')!;
    expect(subject.textContent).to.eql('Anchor.Button');
    expect(subject.querySelector('a')).to.eql(null);
    expect(labels(panel).some((label) => /^(href|target|download|openIn|resource):/.test(label)))
      .to.eql(false);
    expect(button.disabled).to.eql(false);
    await click(panel, 'enabled: true');
    expect(button.disabled).to.eql(true);
  });

  it('returning from a comparison preserves the configured destination and label', async () => {
    using res = await setup();
    const { debug, subject, panel } = res;
    act(() => {
      debug.props.href.value = '/account';
      debug.props.children.value = 'Account settings';
    });
    await click(panel, 'Focus comparison');
    await click(panel, 'Back to configured link');
    const link = subject.querySelector('a')!;
    expect(link.getAttribute('href')).to.eql('/account');
    expect(link.textContent).to.eql('Account settings');
  });

  async function setup() {
    const debug = debugModule.createDebugSignals();
    debug.reset();
    debug.attach(host.ctx, {});
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
