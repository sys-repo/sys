import React from 'react';
import {
  afterAll,
  beforeAll,
  Color,
  D,
  describe,
  DomMock,
  expect,
  it,
  LocalStorage,
  STORAGE_KEY,
  type t,
  TestReact,
} from './common.ts';
import { createDebugSignals, Debug } from '../-spec/-SPEC.Debug.tsx';
import { Fixtures } from '../-spec/-u.fixtures.ts';
import { button, buttons, element, press } from './u.fixture.tsx';

describe('Passkey harness fixtures', () => {
  DomMock.init({ beforeAll, afterAll });

  it('intent capture → no simulated authentication or persisted session data', () => {
    const store = LocalStorage.immutable<Pick<t.Passkey.Props, 'theme' | 'debug'>>(
      STORAGE_KEY.DEV,
      { theme: 'Light', debug: true },
    );
    const previous = store.current;
    store.reset({ theme: 'Light', debug: true });
    const debug = createDebugSignals();
    try {
      const p = debug.props;
      expect(p.theme.value).to.eql('Light');
      expect(p.debug.value).to.eql(true);
      const fixture = p.fixture.value;
      debug.actions.onCreateAccount();
      debug.actions.onSignIn();
      debug.actions.onAddPasskey();
      debug.actions.onSignOut();
      expect(p.intent.value).to.eql({ action: 'sign-out', count: 4 });
      expect(p.fixture.value).to.equal(fixture);
      expect(p.fixture.value.snapshot.authentication.kind).to.eql('signed-out');
      expect(p.fixture.value.snapshot.operation.kind).to.eql('idle');
      expect(p.fixture.value.snapshot.result).to.eql(undefined);
      p.callbacksEnabled.value = false;
      debug.select(Fixtures[1]);
      expect(p.intent.value).to.eql(undefined);
      expect(store.current).to.eql({ theme: 'Light', debug: true });

      const reopened = createDebugSignals();
      try {
        expect(reopened.props.fixture.value.id).to.eql('signed-out');
        expect(reopened.props.intent.value).to.eql(undefined);
        expect(reopened.props.callbacksEnabled.value).to.eql(true);
        expect(reopened.props.theme.value).to.eql('Light');
      } finally {
        reopened.dispose();
      }

      debug.reset();
      expect(p.debug.value).to.eql(D.debug);
      expect(p.theme.value).to.eql('Dark');
      expect(p.fixture.value.id).to.eql('signed-out');
      expect(p.callbacksEnabled.value).to.eql(true);
      expect(p.intent.value).to.eql(undefined);
      expect(store.current).to.eql({ theme: 'Dark', debug: D.debug });
    } finally {
      debug.dispose();
      store.reset(previous);
    }
  });

  it('specimen theme changes → debug headings stay on the light panel surface', async () => {
    const debug = createDebugSignals();
    debug.props.theme.value = 'Dark';
    const res = await TestReact.render(
      <div data-light-host='' style={{ color: Color.theme().fg }}>
        <Debug debug={debug} />
      </div>,
    );
    try {
      const host = element(res.container, '[data-light-host]');
      const view = host.ownerDocument.defaultView!;
      const expected = view.getComputedStyle(host).color;
      const assertTitleColor = (text: string) => {
        const title = Array.from(host.querySelectorAll('div')).find((el) =>
          el.textContent === text
        );
        if (!title) throw new Error(`Missing debug title: ${text}`);
        expect(view.getComputedStyle(title).color).to.eql(expected);
        return title;
      };
      assertTitleColor(D.name);
      const label = assertTitleColor('Property States');
      const qualifier = assertTitleColor('(Simulated)');
      const title = label.parentElement!;
      expect(qualifier.parentElement).to.equal(title);
      expect(view.getComputedStyle(title).justifyContent).to.eql('space-between');
      assertTitleColor('Action callbacks');
      await React.act(async () => press(button(res.container, 'theme: Dark'), 'Enter'));
      expect(debug.props.theme.value).to.eql('Light');
      expect(res.container.textContent).to.contain('theme: Light');
      assertTitleColor(D.name);
      assertTitleColor('Property States');
      assertTitleColor('(Simulated)');
      assertTitleColor('Action callbacks');
    } finally {
      React.act(() => res.dispose());
      debug.dispose();
    }
  });

  it('callback feedback → lives below the toggle and counts all captured intents', async () => {
    const debug = createDebugSignals();
    const res = await TestReact.render(<Debug debug={debug} />);
    try {
      const note = element(res.container, '[role="status"][aria-label="Captured intent"]');
      const toggle = button(res.container, 'callbacks: record intent only');
      expect(note.previousElementSibling?.contains(toggle)).to.eql(true);
      expect(note.nextElementSibling?.tagName).to.eql('HR');
      const expectIntent = (action: string, count: number) => {
        expect(note.textContent).to.contain(action);
        expect(note.textContent?.match(/\d+/g)).to.eql([`${count}`]);
      };
      expectIntent('none', 0);

      await React.act(async () => {
        debug.actions.onCreateAccount();
        debug.actions.onSignIn();
      });
      expectIntent('sign-in', 2);
      expect(debug.props.fixture.value.snapshot.authentication.kind).to.eql('signed-out');
      await React.act(async () => press(toggle, 'Enter'));
      expectIntent('sign-in', 2);
      await React.act(async () => debug.select(Fixtures[1]));
      expectIntent('none', 0);
      await React.act(async () => debug.actions.onAddPasskey());
      expectIntent('add-passkey', 1);
      await React.act(async () => press(button(res.container, '(reset)'), 'Enter'));
      expectIntent('none', 0);
    } finally {
      React.act(() => res.dispose());
      debug.dispose();
    }
  });

  it('debug controls → debug immediately precedes reset in template order', async () => {
    const debug = createDebugSignals();
    const res = await TestReact.render(<Debug debug={debug} />);
    try {
      const controls = buttons(res.container);
      const toggle = button(res.container, `debug: ${debug.props.debug.value}`);
      const reset = button(res.container, '(reset)');
      expect(controls.indexOf(toggle)).to.eql(controls.indexOf(reset) - 1);
      const previous = debug.props.debug.value;
      await React.act(async () => press(toggle, 'Enter'));
      expect(debug.props.debug.value).to.eql(!previous);
      await React.act(async () => press(reset, 'Enter'));
      expect(debug.props.debug.value).to.eql(D.debug);
    } finally {
      React.act(() => res.dispose());
      debug.dispose();
    }
  });

  it('actual debug controls → explicit state selection and callback availability', async () => {
    const debug = createDebugSignals();
    const res = await TestReact.render(<Debug debug={debug} />);
    try {
      expect(res.container.textContent).to.contain('Property States');
      expect(res.container.textContent).to.contain('(Simulated)');
      const selected = () =>
        buttons(res.container)
          .map((el) => el.textContent)
          .filter((label) => label?.includes('🌳'));
      expect(selected()).to.eql(['Signed out 🌳']);
      const failed = button(res.container, 'Add failed; session preserved');
      await React.act(async () => press(failed, 'Enter'));
      expect(debug.props.fixture.value.id).to.eql('failed-add');
      expect(debug.props.fixture.value.snapshot.authentication.kind).to.eql('signed-in');
      expect(selected()).to.eql(['Add failed; session preserved 🌳']);
      await React.act(async () =>
        press(button(res.container, 'callbacks: record intent only'), ' ')
      );
      expect(debug.props.callbacksEnabled.value).to.eql(false);
      expect(res.container.textContent).to.contain('callbacks: not supplied');
      await React.act(async () => press(button(res.container, '(reset)'), 'Enter'));
      expect(debug.props.fixture.value.id).to.eql('signed-out');
      expect(debug.props.callbacksEnabled.value).to.eql(true);
      expect(selected()).to.eql(['Signed out 🌳']);
    } finally {
      React.act(() => res.dispose());
      debug.dispose();
    }
  });
});
