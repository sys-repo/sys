import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  afterAll,
  beforeAll,
  describe,
  DomMock,
  expect,
  expectTypeOf,
  it,
  TestReact,
} from '../../../-test.ts';
import type { t } from '../../common.ts';
import { Dev } from '../../mod.ts';
import { DevList } from '../mod.ts';
import { BulletList } from '../../../ui/BulletList/mod.ts';
import {
  button,
  compatibilityMouse,
  key,
  mouse,
  touch,
} from '../../../ui/Button/-test/u.fixture.ts';

type Id = '' | 'run';
const items = [
  { id: '', label: 'Empty ID', onActivate: () => {} },
  { id: 'run', label: 'Run', onActivate: () => {} },
] as const;

describe('@sys/ui-components/react/dev: Dev.List', () => {
  DomMock.init({ beforeAll, afterAll });

  it('public props → row-method adapter with readonly literal-ID contracts', () => {
    const selected = Object.freeze(['', 'run'] as const);
    const node = <Dev.List items={items} selected={selected} />;
    expect(node.type).to.equal(DevList);
    const inline = (
      <Dev.List
        items={[
          { id: '', label: 'Empty ID', onActivate: (e) => expectTypeOf(e.id).toEqualTypeOf<Id>() },
          { id: 'run', label: 'Run', onActivate: (e) => expectTypeOf(e.id).toEqualTypeOf<Id>() },
        ]}
        selected='run'
      />
    );
    expect(inline.type).to.equal(DevList);
    // @ts-expect-error Selection must not widen the item ID domain.
    const outside = <Dev.List items={items} selected='outside' />;
    // @ts-expect-error Readonly selections must not widen the item ID domain either.
    const outsideSet = <Dev.List items={items} selected={['outside'] as const} />;
    const narrow: t.BulletList.Activate.Handler<'other'> = () => {};
    // @ts-expect-error A handler cannot infer another ID into the domain.
    const handler = <Dev.List items={[{ id: 'run', label: 'Run', onActivate: narrow }]} />;
    // @ts-expect-error Labels are required even for non-empty IDs.
    const label = <Dev.List items={[{ id: 'run', onActivate: () => {} }]} />;
    // @ts-expect-error Every row owns its method.
    const method = <Dev.List items={[{ id: 'run', label: 'Run' }]} />;
    // @ts-expect-error No competing list-level dispatch surface.
    const dispatch = <Dev.List items={items} onActivate={() => {}} />;
    // @ts-expect-error Content cells are not row methods.
    const content = <Dev.List items={[{ kind: 'content', key: 'help', render: () => 'Help' }]} />;
    const invalid = [outside, outsideSet, handler, label, method, dispatch, content];
    for (const node of invalid) expect(node.type).to.equal(DevList);
  });

  it('defaults and overrides → production BulletList with original presentation references', () => {
    const defaults = DevList({ items });
    expect(defaults.type).to.equal(BulletList.UI);
    expect(defaults.props.size).to.eql('sm');
    expect(defaults.props.itemPadding).to.eql([0, 8, 0, 5]);
    expect(defaults.props.selected).to.eql(undefined);

    const props: t.Dev.List.Props<Id> = {
      items,
      selected: Object.freeze(['run'] as const),
      size: 'xs',
      itemPadding: [1, 2],
      columns: 2,
      theme: 'Dark',
      style: [{ fontSize: 14 }, [false, { minWidth: undefined }]],
    };
    const inner = DevList(props);
    for (const name of ['selected', 'size', 'itemPadding', 'columns', 'theme', 'style'] as const) {
      expect(inner.props[name]).to.equal(props[name]);
    }
    expect(DevList({ items, itemPadding: 0 }).props.itemPadding).to.eql(0);
    expect(DevList({ items, size: undefined, itemPadding: undefined }).props.size).to.eql('sm');
    expect(DevList({ items, itemPadding: undefined }).props.itemPadding).to.eql([0, 8, 0, 5]);
  });

  it('labels → literal strings and explicit non-interactive nodes, rendered by BulletList', () => {
    const rows = [
      { id: 'literal', label: '**literal** `code`', onActivate: () => {} },
      { id: '', label: <strong>Explicit rich label</strong>, onActivate: () => {} },
    ] as const;
    const actual = renderToStaticMarkup(<Dev.List items={rows} />);
    const expected = renderToStaticMarkup(
      <BulletList.UI items={rows} size='sm' itemPadding={[0, 8, 0, 5]} />,
    );
    expect(actual).to.eql(expected);
    expect(actual).to.include('**literal** `code`');
    expect(actual).to.include('<strong>Explicit rich label</strong>');
    const empty = renderToStaticMarkup(<Dev.List items={[]} />);
    const emptyList = renderToStaticMarkup(
      <BulletList.UI items={[]} size='sm' itemPadding={[0, 8, 0, 5]} />,
    );
    expect(empty).to.eql(emptyList);
  });

  it('activation → exactly one row method with original BulletList args, never during render', () => {
    const events: unknown[] = [];
    const inner = DevList({
      items: [
        { id: '', label: 'Empty ID', onActivate: (e) => events.push(e) },
        { id: 'other', label: 'Other', onActivate: () => events.push('other') },
      ],
    });
    expect(events).to.eql([]);
    const event: t.BulletList.Activate.Args<'' | 'other'> = {
      id: '',
      modifiers: { ctrl: false, shift: true, meta: false, alt: false },
      is: { command: false, modified: true },
    };
    inner.props.onActivate(event);
    expect(events).to.eql([event]);
    expect(events[0]).to.equal(event);
  });

  it('multiple enabled rows → matching methods and current callbacks after a committed rerender', async () => {
    const events: { method: string; id: string }[] = [];
    const onA: t.BulletList.Activate.Handler<'a' | 'b'> = ({ id }) => {
      events.push({ method: 'a', id });
    };
    let replace!: (name: string) => void;
    const Probe = () => {
      const [name, update] = React.useState('b:old');
      replace = update;
      return (
        <Dev.List
          items={[
            { id: 'a', label: 'A', onActivate: onA },
            { id: 'b', label: 'B', onActivate: ({ id }) => events.push({ method: name, id }) },
          ]}
        />
      );
    };
    const res = await TestReact.render(<Probe />);
    try {
      const [a, b] = res.container.querySelectorAll<HTMLElement>('[role="button"]');
      expect(events).to.eql([]);
      React.act(() => b.click());
      React.act(() => a.click());
      const first = [{ method: 'b:old', id: 'b' }, { method: 'a', id: 'a' }];
      expect(events).to.eql(first);
      React.act(() => replace('b:new'));
      expect(events).to.eql(first);
      React.act(() => b.click());
      React.act(() => a.click());
      expect(events).to.eql([...first, { method: 'b:new', id: 'b' }, { method: 'a', id: 'a' }]);
    } finally {
      React.act(() => res.dispose());
    }
  });

  it('selection → caller-controlled choices, including empty sets and same-ID reactivation', async () => {
    const events: string[] = [];
    const rows: readonly t.Dev.List.Item<Id>[] = [
      { id: '', label: 'Empty ID', onActivate: (e) => events.push(e.id) },
      { id: 'run', label: 'Run', enabled: false, onActivate: (e) => events.push(e.id) },
    ];
    let setSelected!: (value: t.BulletList.Selected<Id> | undefined) => void;
    const Probe = () => {
      const [selected, update] = React.useState<t.BulletList.Selected<Id>>();
      setSelected = update;
      return <Dev.List items={rows} selected={selected} />;
    };
    const res = await TestReact.render(<Probe />);
    try {
      const root = button(res.container);
      const disabled = res.container.querySelectorAll<HTMLElement>('[role="button"]')[1];
      expect(events).to.eql([]);
      expect(root.hasAttribute('aria-pressed')).to.eql(false);
      React.act(() => root.click());
      expect(root.hasAttribute('aria-pressed')).to.eql(false);
      React.act(() => setSelected([]));
      expect(root.getAttribute('aria-pressed')).to.eql('false');
      React.act(() => root.click());
      expect(root.getAttribute('aria-pressed')).to.eql('false');
      React.act(() => setSelected(['', 'run']));
      expect(root.getAttribute('aria-pressed')).to.eql('true');
      expect(disabled.getAttribute('aria-pressed')).to.eql('true');
      React.act(() => root.click());
      React.act(() => root.click());
      mouse(disabled, 'mousedown');
      mouse(disabled, 'mouseup');
      React.act(() => disabled.click());
      expect(events).to.eql(['', '', '', '']);
      React.act(() => setSelected('run'));
      expect(root.getAttribute('aria-pressed')).to.eql('false');
      React.act(() => setSelected(undefined));
      expect(root.hasAttribute('aria-pressed')).to.eql(false);
    } finally {
      React.act(() => res.dispose());
    }
  });

  for (const input of ['mouse', 'touch', 'Space', 'Enter'] as const) {
    it(`${input}: committed callback replacement → current method at Button activation time`, async () => {
      const events: string[] = [];
      const row = (name: string): t.Dev.List.Item<'run'> => ({
        id: 'run',
        label: 'Run',
        onActivate: () => events.push(name),
      });
      let replace!: (name: string) => void;
      const Probe = () => {
        const [name, update] = React.useState('old');
        replace = update;
        return <Dev.List items={[row(name)]} />;
      };
      const res = await TestReact.render(<Probe />);
      try {
        const root = button(res.container);
        React.act(() => root.focus());
        if (input === 'mouse') mouse(root, 'mousedown');
        if (input === 'touch') touch(root, 'touchstart');
        if (input === 'Space' || input === 'Enter') {
          key(root, 'keydown', input === 'Space' ? ' ' : 'Enter');
        }
        expect(events).to.eql(input === 'Enter' ? ['old'] : []);
        React.act(() => replace('new'));
        if (input === 'mouse') {
          mouse(root, 'mouseup');
          mouse(root, 'click');
        }
        if (input === 'touch') {
          touch(root, 'touchend');
          for (const type of ['mousedown', 'mouseup', 'click']) compatibilityMouse(root, type);
        }
        if (input === 'Space' || input === 'Enter') {
          key(root, 'keyup', input === 'Space' ? ' ' : 'Enter');
        }
        expect(events).to.eql(input === 'Enter' ? ['old'] : ['new']);
        React.act(() => root.click());
        expect(events).to.eql(input === 'Enter' ? ['old', 'new'] : ['new', 'new']);
      } finally {
        React.act(() => res.dispose());
      }
    });
  }
});
