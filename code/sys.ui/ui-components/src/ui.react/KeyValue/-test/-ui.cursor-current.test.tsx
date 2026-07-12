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
import { keydown } from './u.keyboard.ts';
import { KeyValue } from '../mod.ts';

const currentSelector = '[data-keyvalue-cursor-current="true"]';
const boundarySelector = '[data-keyvalue-item-boundary]';

const items: t.KeyValue.Item[] = [row('alpha'), row('bravo'), row('charlie')];

describe('KeyValue.UI: current cursor boundary', () => {
  DomMock.init({ beforeEach, afterEach });

  it('marks the current cursor boundary from a controlled model', async () => {
    const res = await TestReact.render(
      <KeyValue.UI
        items={items}
        cursor={{ model: { current: target('bravo') }, onChange: () => undefined }}
      />,
      { strict: false },
    );

    expect(currentPaths(res.container)).to.eql(['/bravo']);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('marks a nested current cursor boundary from a controlled model', async () => {
    const grouped: t.KeyValue.Item[] = [
      { id: 'group', kind: 'group', items: [row('child')] },
    ];
    const res = await TestReact.render(
      <KeyValue.UI
        items={grouped}
        cursor={{ model: { current: target('group', 'child') }, onChange: () => undefined }}
      />,
      { strict: false },
    );

    expect(currentPaths(res.container)).to.eql(['/group/child']);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('moves the current boundary through the controlled entry/navigation loop', async () => {
    const Probe: React.FC = () => {
      const [model, setModel] = React.useState<t.KeyValue.Cursor.Model>({});
      return <KeyValue.UI items={items} cursor={{ model, onChange: (e) => setModel(e.next) }} />;
    };

    const res = await TestReact.render(<Probe />, { strict: false });
    const root = res.container.firstElementChild as HTMLElement;
    const first = res.container.querySelector(boundarySelector) as HTMLElement;

    act(() => DomMock.Mouse.click(first, { altKey: true }));
    await Schedule.micro();
    expect(currentPaths(res.container)).to.eql(['/alpha']);

    keydown(root, 'ArrowDown');
    await Schedule.micro();
    expect(currentPaths(res.container)).to.eql(['/bravo']);

    keydown(root, 'Escape');
    await Schedule.micro();
    expect(currentPaths(res.container)).to.eql([]);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('marks the current cursor boundary in the reorder item shell path', async () => {
    const res = await TestReact.render(
      <KeyValue.UI
        items={items}
        reorder={{ onChange: () => undefined }}
        cursor={{ model: { current: target('charlie') }, onChange: () => undefined }}
      />,
      { strict: false },
    );

    expect(currentPaths(res.container)).to.eql(['/charlie']);

    act(() => res.dispose());
    await Schedule.micro();
  });
});

function row(id: string): t.KeyValue.Item.Row {
  return { id, k: id, v: id };
}

function target(...path: t.ObjectPath): t.KeyValue.Cursor.Target {
  return KeyValue.Cursor.target(path);
}

function currentPaths(container: HTMLElement) {
  return Array.from(container.querySelectorAll(currentSelector)).map((el) =>
    el.getAttribute('data-keyvalue-cursor-path')
  );
}
