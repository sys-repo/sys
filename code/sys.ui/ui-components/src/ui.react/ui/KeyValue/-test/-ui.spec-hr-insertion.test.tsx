import {
  act,
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  it,
  Schedule,
  type t,
  TestReact,
} from '../../../-test.ts';
import { createDebugSignals } from '../-spec/-SPEC.Debug.tsx';
import { Root } from '../-spec/-ui.Root.tsx';

const currentSelector = '[data-keyvalue-cursor-current="true"]';
const cursorRootSelector = '[data-keyvalue-cursor-root="true"]';

describe('KeyValue spec UI: HR insertion', () => {
  DomMock.init({ beforeEach, afterEach });

  it('inserts one hr through the host-owned Option+Enter insertion path', async () => {
    const ctx = await renderRoot({
      items: [
        { id: 'alpha', k: 'alpha' },
        { id: 'bravo', k: 'bravo' },
      ],
      current: ['alpha'],
    });

    const first = dispatchOptionEnter(ctx.root);
    releaseEnter();
    await Schedule.micro();
    const second = dispatchOptionEnter(ctx.root);
    releaseEnter();
    await Schedule.micro();

    expect(first.defaultPrevented).to.eql(true);
    expect(second.defaultPrevented).to.eql(false);
    expect(ctx.items().map((item) => item.id)).to.eql(['alpha', 'inserted:hr:1', 'bravo']);

    await ctx.dispose();
  });

  it('does not insert adjacent to an existing current hr', async () => {
    const ctx = await renderRoot({
      items: [
        { id: 'alpha', k: 'alpha' },
        { id: 'cut', kind: 'hr' },
        { id: 'bravo', k: 'bravo' },
      ],
      current: ['cut'],
    });

    const event = dispatchOptionEnter(ctx.root);
    releaseEnter();
    await Schedule.micro();

    expect(event.defaultPrevented).to.eql(false);
    expect(ctx.items().map((item) => item.id)).to.eql(['alpha', 'cut', 'bravo']);

    await ctx.dispose();
  });
});

async function renderRoot(args: {
  readonly items: t.KeyValue.Item[];
  readonly current: t.ObjectPath;
}) {
  const debug = createDebugSignals();
  const p = debug.props;
  p.cursor.value = true;
  p.items.value = args.items;
  p.cursorModel.value = { current: { path: args.current } };

  const res = await TestReact.render(<Root debug={debug} />, { strict: false });
  await Schedule.micro();
  expect(!!res.container.querySelector(currentSelector)).to.eql(true);
  const root = res.container.querySelector(cursorRootSelector) as HTMLElement;
  act(() => root.focus());

  return {
    root,
    items: () => p.items.value ?? [],
    async dispose() {
      act(() => res.dispose());
      await Schedule.micro();
    },
  };
}

function dispatchOptionEnter(root: HTMLElement): KeyboardEvent {
  const event = DomMock.Keyboard.keydownEvent('Enter', {
    altKey: true,
    cancelable: true,
  });
  act(() => DomMock.Keyboard.fire(event));
  return event;
}

function releaseEnter() {
  const enter = DomMock.Keyboard.keyupEvent('Enter', {
    altKey: true,
    bubbles: true,
    cancelable: true,
  });
  const alt = DomMock.Keyboard.keyupEvent('Alt', { bubbles: true, cancelable: true });
  act(() => {
    DomMock.Keyboard.fire(enter);
    DomMock.Keyboard.fire(alt);
  });
}
