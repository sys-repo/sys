import React from 'react';

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
import { focusRoot, row, selectElement, target } from './u.fixture.cursor.ts';
import { globalKeydown, releaseGlobalKey } from './u.fixture.keyboard.ts';
import { KeyValue } from '../mod.ts';

type InsertChange = t.KeyValue.Cursor.Insert.Change;
type ProbeArgs = {
  readonly enabled?: boolean;
  readonly cursorEnabled?: boolean;
  readonly current?: t.KeyValue.Cursor.Target;
  readonly items?: t.KeyValue.Item[];
};

describe('KeyValue.Cursor keyboard insertion', () => {
  DomMock.init({ beforeEach, afterEach });

  it('inserts a host-provided item after the focused current cursor target', async () => {
    const ctx = await renderProbe({ current: target('alpha') });
    focusRoot(ctx.container);

    const event = globalKeydown('Enter', { altKey: true });
    await Schedule.micro();

    expect(event.defaultPrevented).to.eql(true);
    expect(ctx.changes.map((e) => e.item)).to.eql([{ id: 'inserted:1', kind: 'hr' }]);
    expect(ctx.items()?.map((item) => item.id)).to.eql(['alpha', 'inserted:1', 'bravo']);

    releaseOptionEnter();
    await ctx.dispose();
  });

  it('does not insert when disabled or without a current cursor target', async () => {
    const disabled = await renderProbe({ enabled: false, current: target('alpha') });
    focusRoot(disabled.container);
    const disabledEvent = globalKeydown('Enter', { altKey: true });
    await Schedule.micro();

    expect(disabledEvent.defaultPrevented).to.eql(false);
    expect(disabled.changes.length).to.eql(0);
    releaseOptionEnter();
    await disabled.dispose();

    const missingCurrent = await renderProbe({});
    focusRoot(missingCurrent.container);
    const missingEvent = globalKeydown('Enter', { altKey: true });
    await Schedule.micro();

    expect(missingEvent.defaultPrevented).to.eql(false);
    expect(missingCurrent.changes.length).to.eql(0);
    releaseOptionEnter();
    await missingCurrent.dispose();
  });

  it('does not insert from an active element outside the cursor root', async () => {
    const ctx = await renderProbe({ current: target('alpha') });
    const outside = document.createElement('input');
    document.body.appendChild(outside);
    act(() => outside.focus());

    const event = globalKeydown('Enter', { altKey: true });
    await Schedule.micro();

    expect(event.defaultPrevented).to.eql(false);
    expect(ctx.changes.length).to.eql(0);

    releaseOptionEnter();
    outside.remove();
    await ctx.dispose();
  });

  it('does not insert from an active interactive descendant', async () => {
    const ctx = await renderProbe({
      current: target('alpha'),
      items: [{ id: 'alpha', k: 'alpha', v: <button type='button'>toggle</button> }],
    });
    const button = selectElement(ctx.container, 'button');
    act(() => button.focus());

    const event = globalKeydown('Enter', { altKey: true });
    await Schedule.micro();

    expect(event.defaultPrevented).to.eql(false);
    expect(ctx.changes.length).to.eql(0);

    releaseOptionEnter();
    await ctx.dispose();
  });

  it('accepts only uncommanded Option/Alt+Enter', async () => {
    const ctx = await renderProbe({ current: target('alpha') });
    const root = focusRoot(ctx.container);

    const shift = globalKeydown('Enter', { altKey: true, shiftKey: true });
    await Schedule.micro();
    releaseOptionEnter({ shiftKey: true });

    act(() => root.focus());
    const ctrl = globalKeydown('Enter', { altKey: true, ctrlKey: true });
    await Schedule.micro();
    releaseOptionEnter({ ctrlKey: true });

    act(() => root.focus());
    const meta = globalKeydown('Enter', { altKey: true, metaKey: true });
    await Schedule.micro();
    releaseOptionEnter({ metaKey: true });

    expect(shift.defaultPrevented).to.eql(false);
    expect(ctrl.defaultPrevented).to.eql(false);
    expect(meta.defaultPrevented).to.eql(false);
    expect(ctx.changes.length).to.eql(0);

    await ctx.dispose();
  });
});

function releaseOptionEnter(init: KeyboardEventInit = {}) {
  releaseGlobalKey('Enter', { altKey: true, ...init });
  releaseGlobalKey('Alt');
}

async function renderProbe(args: ProbeArgs) {
  const changes: InsertChange[] = [];
  let latestItems: t.KeyValue.Item[] = [];

  const Probe: React.FC = () => {
    const [items, setItems] = React.useState<t.KeyValue.Item[]>(
      args.items ?? [row('alpha'), row('bravo')],
    );
    latestItems = items;
    const cursor = {
      enabled: args.cursorEnabled,
      model: { current: args.current },
    };
    const keyboardInsertion = KeyValue.Cursor.Keyboard.useInsertAfter({
      enabled: args.enabled,
      items,
      cursor,
      createItem: () => ({ id: `inserted:${changes.length + 1}`, kind: 'hr' }),
      onChange(e) {
        changes.push(e);
        setItems(e.next);
      },
    });

    return (
      <div ref={keyboardInsertion.ref}>
        <KeyValue.UI
          items={items}
          cursor={{
            enabled: args.cursorEnabled,
            model: cursor.model,
            onChange: () => undefined,
          }}
        />
      </div>
    );
  };

  const res = await TestReact.render(<Probe />, { strict: false });
  await Schedule.micro();

  return {
    changes,
    container: res.container,
    items: () => latestItems,
    async dispose() {
      act(() => res.dispose());
      await Schedule.micro();
    },
  };
}
