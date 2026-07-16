import {
  act,
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  it,
  Schedule,
  TestReact,
} from '../../../-test.ts';
import { createDebugSignals } from '../-spec/-SPEC.Debug.tsx';
import { Root } from '../-spec/-ui.Root.tsx';

const currentSelector = '[data-keyvalue-cursor-current="true"]';
const cursorRootSelector = '[data-keyvalue-cursor-root="true"]';

describe('KeyValue spec UI: HR insertion', () => {
  DomMock.init({ beforeEach, afterEach });

  it('inserts an hr through the host-owned Option+Enter insertion path', async () => {
    const debug = createDebugSignals();
    const p = debug.props;
    p.cursor.value = true;
    p.items.value = [
      { id: 'alpha', k: 'alpha' },
      { id: 'bravo', k: 'bravo' },
    ];
    p.cursorModel.value = { current: { path: ['alpha'] } };

    const res = await TestReact.render(<Root debug={debug} />, { strict: false });
    await Schedule.micro();
    expect(!!res.container.querySelector(currentSelector)).to.eql(true);
    const root = res.container.querySelector(cursorRootSelector) as HTMLElement;
    act(() => root.focus());
    const event = DomMock.Keyboard.keydownEvent('Enter', {
      altKey: true,
      cancelable: true,
    });

    act(() => DomMock.Keyboard.fire(event));
    await Schedule.micro();

    expect(event.defaultPrevented).to.eql(true);
    expect(p.items.value?.map((item) => item.id)).to.eql(['alpha', 'inserted:hr:1', 'bravo']);

    act(() => res.dispose());
    await Schedule.micro();
  });
});
