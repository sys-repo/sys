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
import { D, Is, LocalStorage, Schedule, Signal, STORAGE_KEY } from '../common.ts';
import type { t } from '../-spec/common.ts';

type DebugModule = typeof import('../-spec/-SPEC.Debug.tsx');
const legacy = {
  debug: false,
  theme: 'Light',
  size: 'md',
  mono: false,
  fontSize: 16,
  text: 'Saved sample token',
} as const;

describe('Chip specimen: overflow controls', () => {
  DomMock.init({ beforeAll, afterAll });
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

  it('legacy preferences → preserved values and default overflow controls', async () => {
    const debug = await createDebugSignals();
    expect(Signal.toObject(debug.props)).to.include({
      ...legacy,
      truncate: D.truncate,
      width: 240,
      examples: false,
    });
  });

  it('sample states → paired changes, preserved knobs, and selection derived from current values', async () => {
    const debug = await createDebugSignals();
    const res = await TestReact.render(<Debug debug={debug} />);
    const single = 'Single chip (unclipped)';
    const overflow = 'Overflow examples (bounded)';
    const selected = () =>
      [single, overflow].map((label) => button(res.container, label).getAttribute('aria-pressed'));
    try {
      expect(selected()).to.eql(['true', 'false']);

      await click(res.container, overflow);
      expect(storedValues()).to.eql({ ...legacy, examples: true, truncate: true, width: 240 });
      expect(selected()).to.eql(['false', 'true']);

      await click(res.container, 'truncate: true');
      expect(debug.props.examples.value).to.eql(true);
      expect(selected()).to.eql(['false', 'false']);

      await click(res.container, overflow);
      expect(selected()).to.eql(['false', 'true']);
      await click(res.container, 'overflow examples: true');
      expect(debug.props.truncate.value).to.eql(true);
      expect(selected()).to.eql(['false', 'false']);

      await click(res.container, single);
      expect(storedValues()).to.eql({ ...legacy, examples: false, truncate: false, width: 240 });
      expect(selected()).to.eql(['true', 'false']);
      await click(res.container, 'truncate: false');
      expect(debug.props.truncate.value).to.eql(undefined);
      expect(selected()).to.eql(['true', 'false']);

      await click(res.container, overflow);
      await click(res.container, '(reset)');
      expect(selected()).to.eql(['true', 'false']);
    } finally {
      act(() => res.dispose());
    }
  });

  it('overflow controls → serialized choices and reset defaults', async () => {
    const debug = await createDebugSignals();
    const res = await TestReact.render(<Debug debug={debug} />);
    try {
      await click(res.container, 'overflow examples: false');
      expect(Signal.toObject(debug.props)).to.include({ examples: true, truncate: D.truncate });
      await click(res.container, `truncate: ${D.truncate}`);
      await click(res.container, `truncate: (default: ${D.truncate})`);
      expect(debug.props.truncate.value).to.eql(true);

      await click(res.container, 'width: 240px');
      expect(storedValues()).to.eql({ ...legacy, examples: true, truncate: true, width: 360 });

      await click(res.container, '(reset)');
      const reset = Signal.toObject(debug.props);
      expect(reset).to.include({ examples: false, truncate: D.truncate, width: 240 });
      expect(storedValues()).to.eql({
        debug: false,
        theme: 'Dark',
        size: 'sm',
        fontSize: 12,
        text: 'Option + Enter',
        truncate: D.truncate,
        width: 240,
        examples: false,
      });
    } finally {
      act(() => res.dispose());
    }
  });
});

function storedValues(): unknown {
  const json = localStorage.getItem(STORAGE_KEY.DEV);
  if (Is.nil(json)) throw new Error('Missing persisted Chip preferences.');
  return JSON.parse(json);
}

function button(container: HTMLElement, label: string) {
  const controls = [...container.querySelectorAll<HTMLElement>('[role="button"]')];
  const control = controls.find((element) => element.textContent === label);
  if (Is.nil(control)) throw new Error(`Missing Chip control: ${label}`);
  return control;
}

async function click(container: HTMLElement, label: string) {
  await act(async () => {
    button(container, label).click();
    await Schedule.micro();
  });
}
