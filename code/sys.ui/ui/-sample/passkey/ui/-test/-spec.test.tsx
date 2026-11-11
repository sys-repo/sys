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
import { button, buttons, element, press, textElement, valueCell } from './u.fixture.tsx';

describe('Passkey harness fixtures', () => {
  DomMock.init({ beforeAll, afterAll });

  let restoreStorage: () => void;
  beforeEach(() => {
    const store = LocalStorage.immutable<Pick<t.Passkey.Props, 'theme' | 'debug'>>(
      STORAGE_KEY.DEV,
      { theme: 'Dark', debug: D.debug },
    );
    const previous = store.current;
    store.reset({ theme: 'Dark', debug: D.debug });
    restoreStorage = () => store.reset(previous);
  });
  afterEach(() => restoreStorage());

  it('intent capture → no simulated authentication or persisted session data', () => {
    const store = LocalStorage.immutable<Pick<t.Passkey.Props, 'theme' | 'debug'>>(
      STORAGE_KEY.DEV,
      { theme: 'Light', debug: true },
    );
    store.reset({ theme: 'Light', debug: true });
    const debug = createDebugSignals();
    try {
      const p = debug.props;
      expect(p.theme.value).to.eql('Light');
      expect(p.debug.value).to.eql(true);
      const fixture = p.fixture.value;
      const requests = [
        [debug.actions.onCreateAccount, 'create-account'],
        [debug.actions.onSignIn, 'sign-in'],
        [debug.actions.onAddPasskey, 'add-passkey'],
        [debug.actions.onSignOut, 'sign-out'],
      ] as const;
      for (const [index, [request, action]] of requests.entries()) {
        request();
        expect(p.intent.value).to.eql({ action, count: index + 1 });
      }
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
    }
  });

  it('presentation controls → ephemeral section visibility and standalone modes; reset restores panel', async () => {
    const debug = createDebugSignals();
    const res = await TestReact.render(<Debug debug={debug} />);
    try {
      const snapshot = debug.props.fixture.value;
      const visibilityControls = () =>
        buttons(res.container).map((el) => el.textContent)
          .filter((label) => label?.startsWith('show '));
      for (const name of ['actions', 'status', 'context'] as const) {
        const control = button(res.container, `show ${name}: true`);
        await React.act(async () => {
          press(control, 'Enter');
          await Schedule.micro();
        });
        expect(debug.props.sections.value[name]).to.eql(false);
        expect(control.textContent).to.eql(`show ${name}: false`);
      }
      const transitions = [
        ['panel', 'actions'],
        ['actions', 'status'],
        ['status', 'context'],
        ['context', 'panel'],
      ] as const;
      for (const [from, to] of transitions) {
        const control = button(res.container, `display: ${from}`);
        await React.act(async () => {
          press(control, 'Enter');
          await Schedule.micro();
        });
        expect(debug.props.view.value).to.eql(to);
        expect(control.textContent).to.eql(`display: ${to}`);
        expect(visibilityControls()).to.eql(
          to === 'panel'
            ? ['show actions: false', 'show status: false', 'show context: false']
            : [],
        );
      }
      expect(debug.props.fixture.value).to.equal(snapshot);
      await React.act(async () => {
        press(button(res.container, '(reset)'), 'Enter');
        await Schedule.micro();
      });
      expect(debug.props.view.value).to.eql('panel');
      expect(debug.props.sections.value).to.eql(D.sections);
      expect(visibilityControls()).to.eql([
        'show actions: true',
        'show status: true',
        'show context: true',
      ]);
    } finally {
      React.act(() => res.dispose());
      debug.dispose();
    }
  });

  it('subject theme → headings and fixture choices retain Light panel styling', async () => {
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
      const assertLightChrome = () => {
        const labels = [
          D.name,
          '(view:pure)',
          'Property States',
          '(simulated)',
          'Action callbacks',
        ];
        for (const label of labels) {
          expect(Color.toHex(view.getComputedStyle(textElement(host, label)).color))
            .to.eql(Color.toHex(Color.theme('Light').fg));
        }
        const list = element(res.container, 'ul');
        expect(Color.toHex(view.getComputedStyle(list).color)).to.eql(
          Color.toHex(Color.theme('Light').fg),
        );
        for (const fixture of Fixtures) {
          expect(Color.toHex(view.getComputedStyle(textElement(list, fixture.label)).color))
            .to.eql(Color.toHex(Color.DARK));
        }
      };
      assertLightChrome();
      await React.act(async () => {
        press(button(res.container, 'theme: Dark'), 'Enter');
        await Schedule.micro();
      });
      expect(debug.props.theme.value).to.eql('Light');
      assertLightChrome();
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
      const expectIntent = (action: string, count: number) => {
        expect(valueCell(note, 'last intent: ⚡️').textContent).to.eql(action);
        expect(valueCell(note, 'events:').textContent).to.eql(String(count));
      };
      expectIntent('none', 0);

      await React.act(async () => {
        debug.actions.onCreateAccount();
        debug.actions.onSignIn();
        await Schedule.micro();
      });
      expectIntent('sign-in', 2);
      expect(debug.props.fixture.value.snapshot.authentication.kind).to.eql('signed-out');
      await React.act(async () => {
        press(toggle, 'Enter');
        await Schedule.micro();
      });
      expectIntent('sign-in', 2);
      await React.act(async () => {
        debug.select(Fixtures[1]);
        await Schedule.micro();
      });
      expectIntent('none', 0);
      await React.act(async () => {
        debug.actions.onAddPasskey();
        await Schedule.micro();
      });
      expectIntent('add-passkey', 1);
      await React.act(async () => {
        press(button(res.container, '(reset)'), 'Enter');
        await Schedule.micro();
      });
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
      await React.act(async () => {
        press(toggle, 'Enter');
        await Schedule.micro();
      });
      expect(debug.props.debug.value).to.eql(!previous);
      await React.act(async () => {
        press(reset, 'Enter');
        await Schedule.micro();
      });
      expect(debug.props.debug.value).to.eql(D.debug);
    } finally {
      React.act(() => res.dispose());
      debug.dispose();
    }
  });

  it('fixture choices → controlled selection, intent clearing, persistence, and reset', async () => {
    const store = LocalStorage.immutable<Pick<t.Passkey.Props, 'theme' | 'debug'>>(
      STORAGE_KEY.DEV,
      { theme: 'Light', debug: true },
    );
    store.reset({ theme: 'Light', debug: true });
    const debug = createDebugSignals();
    const p = debug.props;
    const res = await TestReact.render(<Debug debug={debug} />);
    try {
      const list = element(res.container, 'ul');
      expect(list.previousElementSibling?.textContent).to.eql('Property States(simulated)');
      const rows = buttons(list);
      expect(rows.map((el) => el.textContent)).to.eql(Fixtures.map((fixture) => fixture.label));
      const assertSelected = (id: string) => {
        const actual = rows.map((el) => el.getAttribute('aria-pressed'));
        const expected = Fixtures.map((fixture) => String(fixture.id === id));
        expect(actual).to.eql(expected);
      };
      assertSelected('signed-out');
      expect(p.intent.value).to.eql(undefined);

      await React.act(async () => {
        debug.actions.onAddPasskey();
        await Schedule.micro();
      });
      expect(p.intent.value).to.eql({ action: 'add-passkey', count: 1 });
      await React.act(async () => {
        press(button(list, 'Add failed; session preserved'), 'Enter');
        await Schedule.micro();
      });
      expect(p.fixture.value.id).to.eql('failed-add');
      expect(p.intent.value).to.eql(undefined);
      assertSelected('failed-add');
      const callbacksToggle = button(res.container, 'callbacks: record intent only');
      await React.act(async () => {
        press(callbacksToggle, ' ');
        await Schedule.micro();
      });
      expect(p.callbacksEnabled.value).to.eql(false);
      expect(callbacksToggle.textContent).to.eql('callbacks: not supplied');

      // External state, not the last activated row, owns selection; rendering cannot clear intent.
      await React.act(async () => {
        debug.actions.onSignIn();
        p.fixture.value = Fixtures[1];
        await Schedule.micro();
      });
      assertSelected('signed-in');
      expect(p.intent.value).to.eql({ action: 'sign-in', count: 1 });
      expect(store.current).to.eql({ theme: 'Light', debug: true });

      await React.act(async () => {
        press(button(res.container, '(reset)'), 'Enter');
        await Schedule.micro();
      });
      expect(p.fixture.value).to.equal(Fixtures[0]);
      expect(p.callbacksEnabled.value).to.eql(true);
      expect(p.intent.value).to.eql(undefined);
      assertSelected('signed-out');
      expect(store.current).to.eql({ theme: 'Dark', debug: D.debug });
    } finally {
      React.act(() => res.dispose());
      debug.dispose();
    }
  });
});
