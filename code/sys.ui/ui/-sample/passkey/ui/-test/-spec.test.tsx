import React from 'react';
import {
  afterAll,
  beforeAll,
  Color,
  D,
  describe,
  DomMock,
  expect,
  Is,
  it,
  LocalStorage,
  Schedule,
  STORAGE_KEY,
  type t,
  TestReact,
} from './common.ts';
import { Dev } from '../-spec/common.ts';
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

  it('subject theme → headings and fixture choices retain Light panel styling', async () => {
    const debug = createDebugSignals();
    debug.props.theme.value = 'Dark';
    const res = await TestReact.render(
      <div data-light-host='' style={{ color: Color.theme().fg }}>
        <Debug debug={debug} />
      </div>,
    );
    const reference = await TestReact.render(
      <Dev.List
        theme='Light'
        selected='reference'
        items={[{ id: 'reference', label: 'Reference', onActivate: () => {} }]}
      />,
    );
    try {
      const expectedList = element(reference.container, 'ul').className;
      const expectedRow = button(reference.container, 'Reference').className;
      const assertListTheme = () => {
        const list = element(res.container, 'ul');
        expect(list.className).to.eql(expectedList);
        for (const row of buttons(list)) {
          expect(row.className).to.eql(expectedRow);
          React.act(() => row.focus());
          expect(row.className).to.eql(expectedRow);
        }
      };
      const host = element(res.container, '[data-light-host]');
      const view = host.ownerDocument.defaultView!;
      const expected = view.getComputedStyle(host).color;
      const assertTitleColor = (text: string) => {
        const candidates = [...host.querySelectorAll('div')];
        const title = candidates.find((el) => el.textContent === text);
        if (Is.nil(title)) throw new Error(`Missing debug title: ${text}`);
        expect(view.getComputedStyle(title).color).to.eql(expected);
        return title;
      };
      assertTitleColor(D.name);
      assertTitleColor('(view:pure)');
      const label = assertTitleColor('Property States');
      const qualifier = assertTitleColor('(simulated)');
      const title = label.parentElement!;
      expect(qualifier.parentElement).to.equal(title);
      expect(view.getComputedStyle(title).justifyContent).to.eql('space-between');
      assertTitleColor('Action callbacks');
      assertListTheme();
      await React.act(async () => {
        press(button(res.container, 'theme: Dark'), 'Enter');
        await Schedule.micro();
      });
      expect(debug.props.theme.value).to.eql('Light');
      expect(res.container.textContent).to.contain('theme: Light');
      assertTitleColor(D.name);
      assertTitleColor('(view:pure)');
      assertTitleColor('Property States');
      assertTitleColor('(simulated)');
      assertTitleColor('Action callbacks');
      assertListTheme();
    } finally {
      React.act(() => reference.dispose());
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
    const previous = store.current;
    store.reset({ theme: 'Light', debug: true });
    const debug = createDebugSignals();
    const p = debug.props;
    const res = await TestReact.render(<Debug debug={debug} />);
    try {
      const list = element(res.container, 'ul');
      expect(list.getAttribute('role')).to.eql('list');
      expect(list.previousElementSibling?.textContent).to.eql('Property States(simulated)');
      expect(list.nextElementSibling?.tagName).to.eql('HR');
      expect([...list.children].map((el) => el.tagName)).to.eql(Fixtures.map(() => 'LI'));
      const rows = buttons(list);
      expect(rows.map((el) => el.textContent)).to.eql(Fixtures.map((fixture) => fixture.label));
      expect(rows.map((el) => el.tabIndex)).to.eql(Fixtures.map(() => 0));
      const assertSelected = (id: string) => {
        const actual = rows.map((el) => el.getAttribute('aria-pressed'));
        const expected = Fixtures.map((fixture) => String(fixture.id === id));
        expect(actual).to.eql(expected);
      };
      assertSelected('signed-out');
      expect(p.intent.value).to.eql(undefined);

      const failed = button(list, 'Add failed; session preserved');
      for (const input of ['Enter', ' ', 'click']) {
        await React.act(async () => {
          debug.actions.onAddPasskey();
          await Schedule.micro();
        });
        expect(p.intent.value).to.eql({ action: 'add-passkey', count: 1 });
        await React.act(async () => {
          if (input === 'click') failed.click();
          else press(failed, input);
          await Schedule.micro();
        });
        expect(p.fixture.value.id).to.eql('failed-add');
        expect(p.fixture.value.snapshot.authentication.kind).to.eql('signed-in');
        expect(p.intent.value).to.eql(undefined);
        assertSelected('failed-add');
      }
      await React.act(async () => {
        press(button(res.container, 'callbacks: record intent only'), ' ');
        await Schedule.micro();
      });
      expect(p.callbacksEnabled.value).to.eql(false);
      expect(res.container.textContent).to.contain('callbacks: not supplied');

      // External state, not the last activated row, owns selection; rendering cannot clear intent.
      await React.act(async () => {
        debug.actions.onSignIn();
        p.fixture.value = Fixtures[1];
        await Schedule.micro();
      });
      assertSelected('signed-in');
      expect(p.intent.value).to.eql({ action: 'sign-in', count: 1 });
      expect(store.current).to.eql({ theme: 'Light', debug: true });
      const reopened = createDebugSignals();
      try {
        expect(reopened.props.fixture.value).to.equal(Fixtures[0]);
        expect(reopened.props.intent.value).to.eql(undefined);
        expect(reopened.props.callbacksEnabled.value).to.eql(true);
        expect(reopened.props.theme.value).to.eql('Light');
        expect(reopened.props.debug.value).to.eql(true);
      } finally {
        reopened.dispose();
      }

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
      store.reset(previous);
    }
  });
});
