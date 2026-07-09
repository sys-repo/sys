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
import { KeyValue } from '../mod.ts';

const activeSelector = '[data-keyvalue-focus-active="true"]';
const boundarySelector = '[data-keyvalue-item-boundary]';

const items: t.KeyValue.Item[] = [row('alpha'), row('bravo'), row('charlie')];

describe('KeyValue.UI: active focus boundary', () => {
  DomMock.init({ beforeEach, afterEach });

  it('marks the active focus boundary from a controlled model', async () => {
    const res = await TestReact.render(
      <KeyValue.UI
        items={items}
        focus={{ model: { active: ref('bravo') }, onChange: () => undefined }}
      />,
      { strict: false },
    );

    expect(activePaths(res.container)).to.eql(['/bravo']);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('marks a nested active focus boundary from a controlled model', async () => {
    const grouped: t.KeyValue.Item[] = [
      { id: 'group', kind: 'group', items: [row('child')] },
    ];
    const res = await TestReact.render(
      <KeyValue.UI
        items={grouped}
        focus={{ model: { active: ref('group', 'child') }, onChange: () => undefined }}
      />,
      { strict: false },
    );

    expect(activePaths(res.container)).to.eql(['/group/child']);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('moves the active boundary through the controlled entry/navigation loop', async () => {
    const Probe: React.FC = () => {
      const [model, setModel] = React.useState<t.KeyValue.Focus.Model>({});
      return <KeyValue.UI items={items} focus={{ model, onChange: (e) => setModel(e.next) }} />;
    };

    const res = await TestReact.render(<Probe />, { strict: false });
    const root = res.container.firstElementChild as HTMLElement;
    const first = res.container.querySelector(boundarySelector) as HTMLElement;

    act(() => DomMock.Mouse.click(first, { altKey: true }));
    await Schedule.micro();
    expect(activePaths(res.container)).to.eql(['/alpha']);

    keydown(root, 'ArrowDown');
    await Schedule.micro();
    expect(activePaths(res.container)).to.eql(['/bravo']);

    keydown(root, 'Escape');
    await Schedule.micro();
    expect(activePaths(res.container)).to.eql([]);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('marks the active focus boundary in the reorder item shell path', async () => {
    const res = await TestReact.render(
      <KeyValue.UI
        items={items}
        reorder={{ onChange: () => undefined }}
        focus={{ model: { active: ref('charlie') }, onChange: () => undefined }}
      />,
      { strict: false },
    );

    expect(activePaths(res.container)).to.eql(['/charlie']);

    act(() => res.dispose());
    await Schedule.micro();
  });
});

function row(id: string): t.KeyValue.Item.Row {
  return { id, k: id, v: id };
}

function ref(...path: t.ObjectPath): t.KeyValue.Focus.Ref {
  return KeyValue.Focus.ref(path);
}

function activePaths(container: HTMLElement) {
  return Array.from(container.querySelectorAll(activeSelector)).map((el) =>
    el.getAttribute('data-keyvalue-focus-path'),
  );
}

function keydown(el: EventTarget, key: string, init: KeyboardEventInit = {}) {
  const event = DomMock.Keyboard.keydownEvent(key, { bubbles: true, cancelable: true, ...init });
  act(() => el.dispatchEvent(event));
  return event;
}
