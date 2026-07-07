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
    const el = <KeyValue.UI items={items} layout={layout} reorder={{ onChange: () => undefined }} />;
    const res = await TestReact.render(el, { strict: false });
    const root = res.container.firstElementChild as HTMLElement;
    expect(root.children.length).to.equal(items.length);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('falls back to the static path when reorder identity is invalid', async () => {
    const invalid: t.KeyValue.Item[] = [{ id: 'a', k: 'alpha' }, { k: 'bravo' }];
    const el = <KeyValue.UI items={invalid} layout={layout} reorder={{ onChange: () => undefined }} />;
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
    const el = <KeyValue.UI items={grouped} layout={layout} reorder={{ onChange: () => undefined }} />;
    const res = await TestReact.render(el, { strict: false });
    const root = res.container.firstElementChild as HTMLElement;
    const groupEl = root.children.item(0) as HTMLElement;

    expect(root.children.length).to.equal(grouped.length);
    expect(groupEl.children.length).to.equal(group.items.length);

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
