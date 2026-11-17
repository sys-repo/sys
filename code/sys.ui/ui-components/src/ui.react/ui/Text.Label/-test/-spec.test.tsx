import {
  act,
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  DomMock,
  expect,
  it,
  TestReact,
} from '../../../-test.ts';
import { D, Is, LocalStorage, Schedule, Signal, STORAGE_KEY, type t } from '../common.ts';
import { Samples } from '../-spec/-ui.Samples.tsx';
import { hostFixture, storageFixture } from '../../../../-test/u.fixture.specimen-lifecycle.ts';

type DebugModule = typeof import('../-spec/-SPEC.Debug.tsx');
const legacy = { debug: true, theme: 'Light' } as const;

describe('Text.Label specimen: controls and real composition', () => {
  let storage: ReturnType<typeof storageFixture>;
  beforeAll(() => void (storage = storageFixture()));
  afterAll(async () => {
    storage[Symbol.dispose]();
    await DomMock.unpolyfill();
  });
  let Debug: DebugModule['Debug'];
  let createDebugSignals: DebugModule['createDebugSignals'];
  let store: t.LocalStorage.Immutable<t.JsonMapLikeU>;
  let previous: t.JsonMapLikeU;

  beforeAll(async () => {
    ({ Debug, createDebugSignals } = await import('../-spec/-SPEC.Debug.tsx'));
  });
  beforeEach(() => {
    store = LocalStorage.immutable<t.JsonMapLikeU>(STORAGE_KEY.DEV, {});
    previous = store.current;
    store.reset(legacy);
  });
  afterEach(() => store.reset(previous));

  it('legacy snapshot → retained knobs, new defaults and serialized reset', async () => {
    const debug = await createDebugSignals();
    using host = await hostFixture();
    debug.attach(host.ctx, {});
    expect(Signal.toObject(debug.props)).to.include({
      ...legacy,
      overflow: D.overflow,
      width: 240,
      fontSize: 12,
    });
    const res = await TestReact.render(<Debug debug={debug} />);
    const { container } = res;
    try {
      await click(container, 'overflow: flow');
      await click(container, 'width: 240px');
      await click(container, 'font-size: 12px');
      await click(container, 'Long code only');
      expect(stored()).to.eql({
        ...legacy,
        value: '`/-sample/long-directory-name/example.bundle.js.map`',
        overflow: 'truncate',
        width: 360,
        fontSize: 14,
      });
      expect(control(container, 'Long code only').getAttribute('aria-pressed')).to.eql('true');
      await act(async () => {
        debug.props.value.value = 'custom value';
        await Schedule.micro();
      });
      expect(control(container, 'Long code only').getAttribute('aria-pressed')).to.eql('false');
      await click(container, '(reset)');
      expect(stored()).to.eql({
        debug: false,
        theme: 'Dark',
        value: 'Run **build** with `production` settings.',
        overflow: D.overflow,
        width: 240,
        fontSize: 12,
      });
      const selected = control(container, 'Supported formatting');
      expect(selected.getAttribute('aria-pressed')).to.eql('true');
    } finally {
      act(() => res.dispose());
    }
  });

  it('stored values → signal seeding, not a defaults overwrite', async () => {
    const saved = {
      ...legacy,
      value: '**Saved** `code`',
      overflow: 'host',
      width: 180,
      fontSize: 20,
    };
    store.reset(saved);
    const debug = await createDebugSignals();
    expect(Signal.toObject(debug.props)).to.eql(saved);
  });

  it('samples → labels compose in buttons, list and anchor; host owns activation', async () => {
    const value = 'Run **build** with `code`';
    const element = <Samples value={value} width={240} fontSize={12} theme='Dark' />;
    const res = await TestReact.render(element);
    const { container } = res;
    try {
      const labels = container.querySelectorAll(`[data-component="${D.displayName}"]`);
      expect(labels.length).to.eql(15);
      const buttons = [...container.querySelectorAll<HTMLElement>('[role="button"]')];
      const actions = buttons.filter((element) => element.textContent === 'Run build with code');
      expect(actions.length).to.eql(4); // Two slots, one enabled list row, one disabled row.
      expect(container.textContent).to.include('Activations: 0');
      act(() => actions[0].click());
      expect(container.textContent).to.include('Activations: 1');
      act(() => actions[3].click());
      expect(container.textContent).to.include('Activations: 1');

      const anchor = container.querySelector('a');
      const code = anchor?.querySelector('code');
      expect(anchor?.getAttribute('href')).to.eql('#text-label-sample');
      expect(code?.textContent).to.eql('/-sample/long-directory-name/example.bundle.js.map');
      expect(container.textContent).to.include('Save [**help**](/-sample/help)');
      expect(container.textContent).to.include('# **Literal heading**');
    } finally {
      act(() => res.dispose());
    }
  });
});

function stored(): unknown {
  const json = localStorage.getItem(STORAGE_KEY.DEV);
  if (Is.nil(json)) throw new Error('Missing serialized preferences.');
  // Native storage representation is the interop contract under test, not the cached store.
  return JSON.parse(json);
}

function control(container: HTMLElement, label: string) {
  const controls = [...container.querySelectorAll<HTMLElement>('[role="button"]')];
  const control = controls.find((element) => element.textContent === label);
  if (Is.nil(control)) throw new Error(`Missing control: ${label}`);
  return control;
}

async function click(container: HTMLElement, label: string) {
  await act(async () => {
    control(container, label).click();
    await Schedule.micro();
  });
}
