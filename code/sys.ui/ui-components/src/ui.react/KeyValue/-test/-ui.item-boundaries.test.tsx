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

describe('KeyValue.UI: item boundaries', () => {
  DomMock.init({ beforeEach, afterEach });

  const items: t.KeyValue.Item[] = [
    { id: 'row:a', k: 'alpha', v: 'one' },
    { id: 'title', kind: 'title', v: 'Title' },
    { id: 'hr', kind: 'hr' },
    { id: 'spacer', kind: 'spacer', size: 8 },
    { id: 'row:b', k: 'bravo', v: 'two' },
  ];
  const layout: t.KeyValue.Layout = { kind: 'table' };

  it('renders one direct table child per KeyValue item', async () => {
    const el = <KeyValue.UI items={items} layout={layout} />;
    const res = await TestReact.render(el, { strict: false });
    const root = res.container.firstElementChild as HTMLElement;
    expect(root.children.length).to.equal(items.length);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('renders one direct table child per KeyValue item in reorder mode', async () => {
    const el = <KeyValue.UI
      items={items}
      layout={layout}
      reorder={{ onChange: () => undefined }}
    />;
    const res = await TestReact.render(el, { strict: false });
    const root = res.container.firstElementChild as HTMLElement;
    expect(root.children.length).to.equal(items.length);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('falls back to the static path when reorder identity is invalid', async () => {
    const invalid: t.KeyValue.Item[] = [{ id: 'a', k: 'alpha' }, { k: 'bravo' }];
    const el = (
      <KeyValue.UI
        items={invalid}
        layout={layout}
        reorder={{ onChange: () => undefined }}
      />
    );
    const res = await TestReact.render(el, { strict: false });
    const root = res.container.firstElementChild as HTMLElement;
    expect(root.children.length).to.equal(invalid.length);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('renders recursive groups as one direct child', async () => {
    const group = statusGroup();
    const grouped: t.KeyValue.Item[] = [group, { id: 'events', k: 'events', v: 'on' }];
    const el = <KeyValue.UI items={grouped} layout={layout} />;
    const res = await TestReact.render(el, { strict: false });
    const root = res.container.firstElementChild as HTMLElement;
    const groupEl = root.children.item(0) as HTMLElement;

    expect(root.children.length).to.equal(grouped.length);
    expect(groupEl.children.length).to.equal(group.items.length);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('renders recursive groups as one direct reorder child', async () => {
    const group = statusGroup();
    const grouped: t.KeyValue.Item[] = [group, { id: 'events', k: 'events', v: 'on' }];
    const el = (
      <KeyValue.UI
        items={grouped}
        layout={layout}
        reorder={{ onChange: () => undefined }}
      />
    );
    const res = await TestReact.render(el, { strict: false });
    const root = res.container.firstElementChild as HTMLElement;
    const groupEl = root.children.item(0) as HTMLElement;

    expect(root.children.length).to.equal(grouped.length);
    expect(groupEl.children.length).to.equal(group.items.length);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('marks only root direct children as projection animation boundaries', async () => {
    const group = statusGroup();
    const grouped: t.KeyValue.Item[] = [group, { id: 'events', k: 'events', v: 'on' }];
    const el = <KeyValue.UI items={grouped} layout={layout} animation />;
    const res = await TestReact.render(el, { strict: false });
    const root = res.container.firstElementChild as HTMLElement;
    const groupEl = root.children.item(0) as HTMLElement;

    expect(root.children.length).to.equal(grouped.length);
    expect(root.querySelectorAll('[data-keyvalue-projection="direct-child"]').length).to.equal(
      grouped.length,
    );
    expect(groupEl.querySelectorAll('[data-keyvalue-projection="direct-child"]').length).to.equal(
      0,
    );

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('disables projection boundaries when root direct-child identity is unstable', async () => {
    const invalid: t.KeyValue.Item[] = [{ id: 'a', k: 'alpha' }, { k: 'missing id' }];
    const el = <KeyValue.UI items={invalid} layout={layout} animation />;
    const res = await TestReact.render(el, { strict: false });
    const root = res.container.firstElementChild as HTMLElement;

    expect(root.children.length).to.equal(invalid.length);
    expect(root.querySelectorAll('[data-keyvalue-projection="direct-child"]').length).to.equal(0);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('lets the reorder path own motion when projection animation is also requested', async () => {
    const el = (
      <KeyValue.UI
        items={items}
        layout={layout}
        animation
        reorder={{ onChange: () => undefined }}
      />
    );
    const res = await TestReact.render(el, { strict: false });
    const root = res.container.firstElementChild as HTMLElement;

    expect(root.children.length).to.equal(items.length);
    expect(root.querySelectorAll('[data-keyvalue-projection="direct-child"]').length).to.equal(0);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('keeps projection boundaries across direct-child insert, remove, and order changes', async () => {
    const a: t.KeyValue.Row = { id: 'a', k: 'alpha', v: 'one' };
    const b: t.KeyValue.Row = { id: 'b', k: 'bravo', v: 'two' };
    const c: t.KeyValue.Row = { id: 'c', k: 'charlie', v: 'three' };
    let setItems: React.Dispatch<React.SetStateAction<t.KeyValue.Item[]>> | undefined;

    const Probe: React.FC = () => {
      const [items, set] = React.useState<t.KeyValue.Item[]>([a, b]);
      setItems = set;
      return <KeyValue.UI items={items} layout={layout} animation />;
    };

    const res = await TestReact.render(<Probe />, { strict: false });
    const root = res.container.firstElementChild as HTMLElement;
    const projectionCount = () =>
      root.querySelectorAll('[data-keyvalue-projection="direct-child"]').length;
    const childText = () => Array.from(root.children).map((el) => el.textContent ?? '');

    expect(projectionCount()).to.equal(2);
    expect(childText().map((text) => text.includes('alpha'))).to.eql([true, false]);

    act(() => setItems?.([c, a, b]));
    await Schedule.micro();
    expect(projectionCount()).to.equal(3);
    expect(childText().map((text) => text.includes('charlie'))).to.eql([true, false, false]);

    act(() => setItems?.([b, c, a]));
    await Schedule.micro();
    expect(childText().map((text) => text.includes('bravo'))).to.eql([true, false, false]);

    act(() => setItems?.([b, a]));
    await Schedule.micro();
    expect(projectionCount()).to.equal(2);
    expect(childText().some((text) => text.includes('charlie'))).to.equal(false);

    act(() => res.dispose());
    await Schedule.micro();
  });
});

function statusGroup(): t.KeyValue.Group {
  return {
    id: 'group:status',
    kind: 'group',
    items: [
      { id: 'status', k: 'status', v: 'on' },
      { id: 'status:title', k: 'title status', v: 'on' },
    ],
  };
}
