import {
  act,
  afterAll,
  beforeAll,
  describe,
  DomMock,
  expect,
  hostFixture,
  it,
  storageFixture,
  TestReact,
} from '../../../-test.ts';
import { Is, Schedule, STORAGE_KEY } from '../common.ts';

type DebugModule = typeof import('../-spec/-SPEC.Debug.tsx');

describe('Chip specimen: overflow controls', () => {
  let storage: ReturnType<typeof storageFixture>;
  let Debug: DebugModule['Debug'];
  let createDebugSignals: DebugModule['createDebugSignals'];

  beforeAll(async () => {
    storage = storageFixture();
    ({ Debug, createDebugSignals } = await import('../-spec/-SPEC.Debug.tsx'));
  });
  afterAll(async () => {
    storage[Symbol.dispose]();
    await DomMock.unpolyfill();
  });

  it('paired presets → current selection without overwriting saved text', async () => {
    storage.seed(STORAGE_KEY.DEV, { text: 'Saved sample token' });
    using host = await hostFixture();
    const debug = await createDebugSignals();
    debug.attach(host.ctx, {});
    const res = await TestReact.render(<Debug debug={debug} />);
    const single = 'Single chip (unclipped)';
    const overflow = 'Overflow examples (bounded)';
    const selected = () => {
      return [single, overflow].map((label) => {
        return button(res.container, label).getAttribute('aria-pressed');
      });
    };
    try {
      await click(res.container, overflow);
      expect(storage.read(STORAGE_KEY.DEV)).to.include({
        text: 'Saved sample token',
        examples: true,
        truncate: true,
      });
      expect(selected()).to.eql(['false', 'true']);

      await click(res.container, 'truncate: true');
      expect(debug.props.examples.value).to.eql(true);
      expect(selected()).to.eql(['false', 'false']);

      await click(res.container, overflow);
      await click(res.container, 'overflow examples: true');
      expect(debug.props.truncate.value).to.eql(true);
      expect(selected()).to.eql(['false', 'false']);

      await click(res.container, single);
      expect(storage.read(STORAGE_KEY.DEV)).to.include({
        text: 'Saved sample token',
        examples: false,
        truncate: false,
      });
      expect(selected()).to.eql(['true', 'false']);
    } finally {
      act(() => res.dispose());
    }
  });
});

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
