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

  it('all four callbacks → counted intent only; selection and reset clear it', async () => {
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
    expect(debug.props.fixture.value).to.equal(fixture);
    expect(fixture.snapshot.authentication.kind).to.eql('signed-out');
    expect(fixture.snapshot.operation.kind).to.eql('idle');
    expect(fixture.snapshot.result).to.equal(undefined);
    await activate(toggle);
    expect(toggle.textContent).to.eql('callbacks: not supplied');
    expect(intent()).to.eql(['sign-out', '4']);

    const list = element(container, 'ul');
    const selected = () =>
      [...list.querySelectorAll('[aria-pressed="true"]')].map((el) => el.textContent);
    expect(buttons(list).map((el) => el.textContent)).to.eql(Fixtures.map((f) => f.label));
    await activate(button(list, 'Add failed; session preserved'));
    expect(debug.props.fixture.value.id).to.eql('failed-add');
    expect(intent()).to.eql(['none', '0']);
    expect(selected()).to.eql(['Add failed; session preserved']);
    // External selection updates the list without fabricating or clearing an intent.
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
    expect(debug.props.callbacksEnabled.value).to.eql(true);
  });

  it('presentation controls → visibility belongs to panel mode; reset restores defaults', async () => {
    using res = await TestReact.render(<Debug debug={debug} />);
    const { container } = res;
    const choose = (label: string) => activate(button(container, label));
    const labels = () => buttons(container).map((el) => el.textContent);
    const visibility = () => labels().filter((label) => label?.startsWith('show '));
    const names = ['actions', 'status', 'context'];
    const fixture = debug.props.fixture.value;
    for (const name of names) await choose(`show ${name}: true`);
    const hidden = names.map((name) => `show ${name}: false`);
    expect(visibility()).to.eql(hidden);
    for (const mode of ['panel', ...names]) {
      await choose(`display: ${mode}`);
      expect(visibility()).to.eql(mode === 'context' ? hidden : []);
    }
    expect(labels().slice(-2)).to.eql(['debug: false', '(reset)']);
    await choose('debug: false');
    expect(debug.props.debug.value).to.eql(true);
    await choose('(reset)');
    expect(visibility()).to.eql(names.map((name) => `show ${name}: true`));
    expect(debug.props.sections.value).to.eql(D.sections);
    expect(debug.props.view.value).to.eql('panel');
    expect(debug.props.fixture.value).to.equal(fixture);
    expect(storage().current).to.eql(initial);
  });

  it('changing subject theme → fixture choices and headings stay readable on the light sidebar', async () => {
    using res = await TestReact.render(<Debug debug={debug} />);
    const color = (el: Element) =>
      Color.toHex(el.ownerDocument.defaultView!.getComputedStyle(el).color);
    const light = Color.toHex(Color.theme('Light').fg);
    const headings = [D.name, '(view:pure)', 'Property States', '(simulated)', 'Action callbacks'];
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
