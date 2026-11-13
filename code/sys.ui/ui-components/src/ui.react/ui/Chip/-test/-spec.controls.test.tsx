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

  it('overflow controls → serialized choices and reset defaults', async () => {
    const debug = await createDebugSignals();
    const res = await TestReact.render(<Debug debug={debug} />);
    try {
      await click(res.container, 'overflow examples: false');
      expect(Signal.toObject(debug.props)).to.include({ examples: true, truncate: true });

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

async function click(container: HTMLElement, label: string) {
  const controls = [...container.querySelectorAll<HTMLElement>('[role="button"]')];
  const control = controls.find((element) => element.textContent === label);
  if (Is.nil(control)) throw new Error(`Missing Chip control: ${label}`);
  await act(async () => {
    control.click();
    await Schedule.micro();
  });
}
