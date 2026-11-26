import React from 'react';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  Color,
  D,
  describe,
  DomMock,
  expect,
  it,
  LocalStorage,
  Schedule,
  STORAGE_KEY,
  type t,
  TestReact,
} from './common.ts';
import { createDebugSignals, Debug } from '../-spec/-SPEC.Debug.tsx';
import { Fixtures } from '../-spec/-u.fixtures.ts';
import { activate, button, buttons, element, textElement, valueCell } from './u.fixture.tsx';

const initial = { theme: 'Dark', debug: false } as const;
type Preferences = Pick<t.Passkey.Props, 'theme' | 'debug'>;

describe('Passkey pure specimen', () => {
  DomMock.init({ beforeAll, afterAll });
  const storage = () => LocalStorage.immutable<Preferences>(STORAGE_KEY.DEV, initial);
  let previous: Preferences;
  let debug: ReturnType<typeof createDebugSignals>;
  beforeEach(() => {
    previous = storage().current;
    storage().reset(initial);
    debug = createDebugSignals();
  });
  afterEach(() => {
    debug.dispose();
    storage().reset(previous);
  });

  it('all four callbacks → ordered occurrences; fixture selection and reset clear history', async () => {
    using res = await TestReact.render(<Debug debug={debug} />);
    const { container } = res;
    const fixture = debug.props.fixture.value;
    const note = element(container, '[role="status"][aria-label="Captured intent"]');
    const toggle = button(container, 'callbacks: record intent only');
    expect(note.previousElementSibling?.contains(toggle)).to.eql(true);
    const intent = () => [
      valueCell(note, 'last intent: ⚡️').textContent,
      valueCell(note, 'events:').textContent,
    ];
    expect(intent()).to.eql(['none', '0']);
    const actions = [
      [debug.actions.onCreateAccount, 'create-account'],
      [debug.actions.onSignIn, 'sign-in'],
      [debug.actions.onAddPasskey, 'add-passkey'],
      [debug.actions.onSignOut, 'sign-out'],
    ] as const;
    for (const [i, [run, name]] of actions.entries()) {
      await React.act(() => {
        run();
        return Schedule.micro();
      });
      expect(intent()).to.eql([name, String(i + 1)]);
    }
    expect(debug.props.callbackHistory.value).to.eql({
      items: actions.map(([, kind]) => ({ kind })),
      total: 4,
    });
    expect(debug.props.fixture.value).to.equal(fixture);
    expect(fixture.snapshot.authentication.kind).to.eql('signed-out');
    expect(fixture.snapshot.operation.kind).to.eql('idle');
    expect(fixture.snapshot.result).to.eql(undefined);
    await activate(toggle);
    expect(toggle.textContent).to.eql('callbacks: not supplied');
    expect(intent()).to.eql(['sign-out', '4']);

    const list = element(container, 'ul');
    const selected = () =>
      [...list.querySelectorAll('[aria-pressed="true"]')].map((el) => el.textContent);
    expect(buttons(list).map((el) => el.textContent)).to.eql(Fixtures.map((f) => f.label));
    await activate(button(list, 'Add failed • session preserved'));
    expect(debug.props.fixture.value.id).to.eql('failed-add');
    expect(intent()).to.eql(['none', '0']);
    expect(debug.props.callbackHistory.value).to.eql({ items: [], total: 0 });
    expect(selected()).to.eql(['Add failed • session preserved']);
    // A fixture signal write is not the specimen's selection action.
    await React.act(() => {
      debug.actions.onSignIn();
      debug.props.fixture.value = Fixtures[1];
      return Schedule.micro();
    });
    expect(selected()).to.eql([Fixtures[1].label]);
    expect(intent()).to.eql(['sign-in', '1']);
    expect(storage().current).to.eql(initial);
    await activate(button(container, '(reset)'));
    expect(selected()).to.eql([Fixtures[0].label]);
    expect(intent()).to.eql(['none', '0']);
    expect(debug.props.callbackHistory.value).to.eql({ items: [], total: 0 });
    expect(debug.props.callbacksEnabled.value).to.eql(true);
  });

  it('callback history → evicts only the oldest occurrences without reducing the readout total', async () => {
    using res = await TestReact.render(<Debug debug={debug} />);
    const note = element(res.container, '[role="status"][aria-label="Captured intent"]');
    const history = () => debug.props.callbackHistory.value;
    const signIns = Array.from({ length: 30 }, () => ({ kind: 'sign-in' }));
    await React.act(() => {
      debug.actions.onCreateAccount();
      debug.actions.onAddPasskey();
      for (const _ of signIns) debug.actions.onSignIn();
    });
    const full = history();
    const initialItems = [{ kind: 'create-account' }, { kind: 'add-passkey' }, ...signIns];
    expect(full).to.eql({ items: initialItems, total: 32 });

    await React.act(() => {
      debug.actions.onSignOut();
      debug.actions.onCreateAccount();
    });
    expect(history()).to.eql({
      items: [...signIns, { kind: 'sign-out' }, { kind: 'create-account' }],
      total: 34,
    });
    expect(full).to.eql({ items: initialItems, total: 32 });
    expect(valueCell(note, 'last intent: ⚡️').textContent).to.eql('create-account');
    expect(valueCell(note, 'events:').textContent).to.eql('34');
  });

  it('presentation controls → visibility belongs to panel mode; reset restores defaults', async () => {
    using res = await TestReact.render(<Debug debug={debug} />);
    const { container } = res;
    const choose = (label: string) => activate(button(container, label));
    const labels = () => buttons(container).map((el) => el.textContent);
    const visibility = () => labels().filter((label) => label?.startsWith('show '));
    const names = ['actions', 'status', 'context'];
    await choose(Fixtures[1].label);
    const fixture = debug.props.fixture.value;
    await React.act(() => debug.actions.onSignIn());
    const history = debug.props.callbackHistory.value;
    for (const name of names) await choose(`show ${name}: true`);
    const selected = () => {
      const picker = button(container, 'Panel').closest('ul')!;
      return buttons(picker).filter((el) => el.getAttribute('aria-pressed') === 'true').map((el) =>
        el.textContent
      );
    };
    expect(selected()).to.eql(['Panel']);
    const standalone = [['Actions', 'actions'], ['Status', 'status'], ['Context', 'context']];
    for (const [label, view] of standalone) {
      await choose(label);
      expect(debug.props.view.value).to.eql(view);
      expect(selected()).to.eql([label]);
      expect(visibility()).to.eql([]);
      expect(debug.props.fixture.value).to.equal(fixture);
      expect(debug.props.callbackHistory.value).to.equal(history);
    }
    await choose('Panel');
    expect(visibility()).to.eql(names.map((name) => `show ${name}: false`));
    await choose('Context');
    expect(labels().slice(-2)).to.eql(['debug: false', '(reset)']);
    await choose('debug: false');
    expect(debug.props.debug.value).to.eql(true);
    await choose('(reset)');
    expect(visibility()).to.eql(names.map((name) => `show ${name}: true`));
    expect(debug.props.sections.value).to.eql(D.sections);
    expect(debug.props.view.value).to.eql('panel');
    expect(selected()).to.eql(['Panel']);
    expect(debug.props.fixture.value).to.equal(Fixtures[0]);
    expect(storage().current).to.eql(initial);
  });

  it('changing subject theme → fixture choices and headings stay readable on the light sidebar', async () => {
    using res = await TestReact.render(<Debug debug={debug} />);
    const color = (el: Element) =>
      Color.toHex(el.ownerDocument.defaultView!.getComputedStyle(el).color);
    const light = Color.toHex(Color.theme('Light').fg);
    const headings = [D.name, 'View (Pure)', 'Property States', '(Simulated)', 'Action callbacks'];
    for (const theme of ['Dark', 'Light']) {
      expect(debug.props.theme.value).to.eql(theme);
      for (const label of headings) expect(color(textElement(res.container, label))).to.eql(light);
      const list = element(res.container, 'ul');
      expect(color(list)).to.eql(light);
      for (const { label } of Fixtures) {
        expect(color(textElement(list, label))).to.eql(Color.toHex(Color.DARK));
      }
      await activate(button(res.container, `theme: ${theme}`));
    }
  });
});
