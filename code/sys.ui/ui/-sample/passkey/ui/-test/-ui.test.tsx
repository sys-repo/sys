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
  KeyValue,
  type t,
  TestReact,
} from './common.ts';
import { Passkey } from '../mod.ts';
import { Warning } from '../ui.Warning.tsx';
import { button, buttons, element, press, renderPanel, signedIn, signedOut } from './u.fixture.tsx';

const callbacks = {
  onCreateAccount: () => {},
  onSignIn: () => {},
  onAddPasskey: () => {},
  onSignOut: () => {},
};

describe('Passkey diagnostic panel', () => {
  DomMock.init({ beforeAll, afterAll });

  for (
    const authentication of [
      { kind: 'checking' },
      { kind: 'unknown', summary: 'Session lookup failed' },
    ] satisfies t.Passkey.Authentication[]
  ) {
    it(`${authentication.kind} → no account actions or confirmed signed-out claim`, async () => {
      const res = await renderPanel({
        snapshot: { ...signedOut, authentication },
        ...callbacks,
        theme: 'Dark',
      });
      try {
        expect(buttons(res.container)).to.eql([]);
        expect(res.container.textContent).not.to.contain('Signed out');
        expect(res.container.textContent).to.contain(
          authentication.kind === 'checking' ? 'Checking' : 'Session lookup failed',
        );
        if (authentication.kind === 'unknown') {
          const warning = element(
            res.container,
            '[role="note"][aria-label="Authentication unknown"]',
          );
          expect(warning.textContent).to.contain('Unknown: Session lookup failed');
          expect(element(warning, '[aria-hidden="true"]').textContent).to.eql('⚠');
          const color = warning.ownerDocument.defaultView!.getComputedStyle(warning).color;
          expect(Color.toHex(color)).to.eql(Color.toHex(Color.YELLOW));
        } else {
          expect(res.container.querySelector('[role="note"]')).to.eql(null);
        }
      } finally {
        res.dispose();
      }
    });
  }

  it('KeyValue projection → standard titles and separator only when action rows exist', () => {
    const h = TestReact.renderHook(
      (snapshot: t.Passkey.Snapshot) => Passkey.UI({ snapshot }),
      { initialProps: signedOut },
    );
    try {
      const states: readonly t.Passkey.Authentication[] = [
        signedOut.authentication,
        signedIn.authentication,
        { kind: 'checking' },
        { kind: 'unknown', summary: 'Session lookup failed' },
      ];
      for (const authentication of states) {
        React.act(() => h.rerender({ ...signedOut, authentication }));
        const output = h.result.current;
        if (!React.isValidElement<{ children: React.ReactElement<t.KeyValue.Props> }>(output)) {
          throw new Error('Expected the panel to render its KeyValue surface');
        }
        const keyValue = output.props.children;
        expect(keyValue.type).to.equal(KeyValue.UI);
        const items = keyValue.props.items ?? [];
        expect(items.find((item) => item.id === 'title')).to.eql({
          id: 'title',
          kind: 'title',
          y: [0, 1],
          v: D.name,
        });
        const hasActions = authentication.kind === 'signed-out' ||
          authentication.kind === 'signed-in';
        expect(items.some((item) => item.id === 'actions-divider')).to.eql(hasActions);
        expect(items.some((item) => item.id === 'context-divider')).to.eql(true);
        if (!hasActions) {
          expect(items.slice(0, 2).map((item) => item.id)).to.eql(['title', 'authentication']);
        }
      }
    } finally {
      React.act(() => h.unmount());
    }
  });

  it('signed out → distinct intents without invented authentication', async () => {
    const intents: string[] = [];
    const res = await renderPanel({
      snapshot: signedOut,
      onCreateAccount: () => intents.push('create-account'),
      onSignIn: () => intents.push('sign-in'),
    });
    try {
      expect(buttons(res.container).map((el) => el.textContent)).to.eql([
        'Create with Passkey',
        'Sign In',
      ]);
      const create = button(res.container, 'Create with Passkey');
      const signIn = button(res.container, 'Sign In');
      expect(create.tabIndex).to.eql(0);
      press(create, 'Enter');
      press(signIn, ' ');
      React.act(() => DomMock.Mouse.activate(signIn));
      expect(intents).to.eql(['create-account', 'sign-in', 'sign-in']);
      expect(res.container.textContent).to.contain('Signed out');
      expect(res.container.textContent).not.to.contain('Signed in');
      expect(res.container.textContent).to.contain('https://app.example.test');
      expect(res.container.textContent).to.contain('example.test');
    } finally {
      res.dispose();
    }
  });

  it('signed in → add/sign-out intents, principal, and unknown versus zero credential count', async () => {
    const intents: string[] = [];
    const props: t.Passkey.Props = {
      snapshot: signedIn,
      onAddPasskey: () => intents.push('add-passkey'),
      onSignOut: () => intents.push('sign-out'),
    };
    const res = await renderPanel(props);
    try {
      expect(buttons(res.container).map((el) => el.textContent)).to.eql([
        'Add Passkey',
        'Sign Out',
      ]);
      expect(res.container.textContent).to.contain('principal-test-01');
      expect(res.container.textContent).to.contain('Unknown');
      press(button(res.container, 'Add Passkey'), 'Enter');
      press(button(res.container, 'Sign Out'), ' ');
      expect(intents).to.eql(['add-passkey', 'sign-out']);
      expect(res.container.textContent).to.contain('Signed in');
      res.update({
        ...props,
        snapshot: {
          ...signedIn,
          authentication: { kind: 'signed-in', principal: 'principal-test-01', credentialCount: 0 },
        },
      });
      expect(res.container.textContent).to.contain('Registered keys0');
      expect(res.container.textContent).not.to.contain('Unknown');
    } finally {
      res.dispose();
    }
  });

  const blockedContexts: readonly [string, t.Passkey.Context][] = [
    ['Secure context required', {
      ...signedOut.context,
      webAuthn: { kind: 'unavailable', reason: 'Secure context required' },
    }],
    ['Capability not checked', {
      ...signedOut.context,
      webAuthn: { kind: 'unknown', reason: 'Capability not checked' },
    }],
    ['Verifier not configured', {
      ...signedOut.context,
      verifier: { kind: 'unavailable', reason: 'Verifier not configured' },
    }],
    ['Verifier not checked', {
      ...signedOut.context,
      verifier: { kind: 'unknown', reason: 'Verifier not checked' },
    }],
    ['RP ID not configured', { ...signedOut.context, rpId: undefined }],
    ['Origin not supplied', { ...signedOut.context, origin: ' ' }],
  ];

  for (const [reason, context] of blockedContexts) {
    it(`${reason} → visible explanation and suppressed WebAuthn intents`, async () => {
      let count = 0;
      const res = await renderPanel({
        snapshot: { ...signedOut, context },
        onCreateAccount: () => count++,
        onSignIn: () => count++,
      });
      try {
        expect(res.container.textContent).to.contain(reason);
        for (const action of buttons(res.container)) {
          expect(action.getAttribute('aria-disabled')).to.eql('true');
          expect(action.tabIndex).to.eql(-1);
          press(action, 'Enter');
          React.act(() => DomMock.Mouse.activate(action));
        }
        expect(count).to.eql(0);
        expect(res.container.textContent).to.contain('Authentication');
      } finally {
        res.dispose();
      }
    });
  }

  it('missing callback → visibly unavailable rather than a silent no-op', async () => {
    const res = await renderPanel({ snapshot: signedOut });
    try {
      expect(res.container.textContent).to.contain('Action not connected');
      for (const el of buttons(res.container)) {
        expect(el.getAttribute('aria-disabled')).to.eql('true');
      }
    } finally {
      res.dispose();
    }
  });

  it('Warning → safe message text, wrapping, and caller style composition', async () => {
    const message = '<script>not markup</script>'.repeat(4);
    const res = await TestReact.render(<Warning message={message} style={{ fontSize: 13 }} />);
    try {
      const note = element(res.container, '[role="note"]');
      expect(note.textContent).to.eql(`⚠ ${message}`);
      expect(note.querySelector('script')).to.eql(null);
      const style = note.ownerDocument.defaultView!.getComputedStyle(note);
      expect(style.fontSize).to.eql('13px');
      expect(style.overflowWrap).to.eql('anywhere');
      expect(style.whiteSpace).to.eql('normal');
    } finally {
      React.act(() => res.dispose());
    }
  });

  it('unavailable actions → yellow warnings with a darker shade on the light surface', async () => {
    const res = await renderPanel({ snapshot: signedOut, theme: 'Dark' });
    try {
      const warnings = () => res.container.querySelectorAll<HTMLElement>('[role="note"]');
      expect(warnings().length).to.eql(2);
      const note = warnings()[0];
      const view = note.ownerDocument.defaultView!;
      expect(note.textContent).to.contain('Action not connected');
      expect(element(note, '[aria-hidden="true"]').textContent).to.eql('⚠');
      expect(Color.toHex(view.getComputedStyle(note).color)).to.eql(Color.toHex(Color.YELLOW));
      res.update({ snapshot: signedOut, theme: 'Light' });
      expect(Color.toHex(view.getComputedStyle(note).color))
        .to.eql(Color.toHex(Color.darken(Color.YELLOW, 25)));
    } finally {
      res.dispose();
    }
  });

  it('WebAuthn unavailable → sign out remains independent', async () => {
    let count = 0;
    const res = await renderPanel({
      snapshot: {
        ...signedIn,
        context: { ...signedIn.context, webAuthn: { kind: 'unavailable', reason: 'Unsupported' } },
      },
      onAddPasskey: () => count++,
      onSignOut: () => count++,
    });
    try {
      expect(button(res.container, 'Add Passkey').getAttribute('aria-disabled')).to.eql('true');
      const signOut = button(res.container, 'Sign Out');
      expect(signOut.tabIndex).to.eql(0);
      press(signOut, 'Enter');
      expect(count).to.eql(1);
    } finally {
      res.dispose();
    }
  });

  for (const action of ['create-account', 'sign-in', 'add-passkey', 'sign-out'] as const) {
    it(`pending ${action} → all controls disabled with readable phase and reserved spinner space`, async () => {
      let count = 0;
      const snapshot = action === 'create-account' || action === 'sign-in' ? signedOut : signedIn;
      const res = await renderPanel({
        snapshot: {
          ...snapshot,
          operation: { kind: 'pending', action, phase: 'Waiting for response' },
        },
        onCreateAccount: () => count++,
        onSignIn: () => count++,
        onAddPasskey: () => count++,
        onSignOut: () => count++,
      });
      try {
        const status = element(res.container, '[role="status"][aria-label="Operation"]');
        expect(status.textContent).to.contain('Waiting for response');
        expect(res.container.textContent).not.to.contain('Wait for the current operation');
        expect(res.container.querySelectorAll('[role="note"]').length).to.eql(0);
        const slot = element(res.container, '[data-spinner-slot]');
        expect(slot.previousElementSibling).to.equal(status);
        expect(slot.getAttribute('aria-hidden')).to.eql('true');
        const style = slot.ownerDocument.defaultView!.getComputedStyle(slot);
        expect(style.width).to.eql('24px');
        expect(style.display).not.to.eql('none');
        for (const el of buttons(res.container)) {
          expect(el.getAttribute('aria-disabled')).to.eql('true');
          press(el, ' ');
          React.act(() => DomMock.Mouse.activate(el));
        }
        expect(count).to.eql(0);
      } finally {
        res.dispose();
      }
    });
  }

  it('registration success → remains signed out; add failure → preserves supplied session', async () => {
    const res = await renderPanel({
      snapshot: {
        ...signedOut,
        result: { kind: 'success', action: 'create-account', summary: 'Credential registered' },
      },
      ...callbacks,
    });
    try {
      expect(res.container.textContent).to.contain('Signed out');
      expect(res.container.textContent).not.to.contain('Signed in');
      const result = element(res.container, '[role="status"][aria-label="Last result"]');
      expect(result.textContent).to.contain('Credential registered');
      res.update({
        snapshot: {
          ...signedIn,
          result: { kind: 'failure', action: 'add-passkey', summary: 'Request did not complete' },
        },
        ...callbacks,
      });
      expect(element(res.container, '[role="status"][aria-label="Last result"]')).to.equal(result);
      expect(result.textContent).to.contain('Add Passkey');
      expect(result.textContent).to.contain('Request did not complete');
      expect(res.container.textContent).to.contain('principal-test-01');
      expect(res.container.textContent).to.contain('Signed in');
    } finally {
      res.dispose();
    }
  });

  it('idle → pending → failure → preserves action, announcements, slot, and focus', async () => {
    const props = { snapshot: signedOut, ...callbacks };
    const res = await renderPanel(props);
    try {
      const action = button(res.container, 'Sign In');
      const operation = element(res.container, '[role="status"][aria-label="Operation"]');
      const result = element(res.container, '[role="status"][aria-label="Last result"]');
      const slot = element(res.container, '[data-spinner-slot]');
      const view = slot.ownerDocument.defaultView!;
      expect(view.getComputedStyle(slot).display).to.eql('none');
      React.act(() => action.focus());
      res.update({
        ...props,
        snapshot: {
          ...signedOut,
          operation: { kind: 'pending', action: 'sign-in', phase: 'Verifying response' },
        },
      });
      expect(button(res.container, 'Sign In')).to.equal(action);
      expect(document.activeElement).to.equal(action);
      expect(action.tabIndex).to.eql(-1);
      expect(view.getComputedStyle(slot).display).not.to.eql('none');
      res.update({
        ...props,
        snapshot: {
          ...signedOut,
          result: { kind: 'failure', action: 'sign-in', summary: 'Request did not complete' },
        },
      });
      expect(button(res.container, 'Sign In')).to.equal(action);
      expect(document.activeElement).to.equal(action);
      expect(action.tabIndex).to.eql(0);
      expect(element(res.container, '[role="status"][aria-label="Operation"]')).to.equal(operation);
      expect(element(res.container, '[role="status"][aria-label="Last result"]')).to.equal(result);
      expect(element(res.container, '[data-spinner-slot]')).to.equal(slot);
      expect(operation.textContent).to.eql('Idle');
      expect(view.getComputedStyle(slot).display).to.eql('none');
    } finally {
      res.dispose();
    }
  });

  it('focused action removed → no custom focus reassignment', async () => {
    const res = await renderPanel({ snapshot: signedOut, ...callbacks });
    try {
      const action = button(res.container, 'Sign In');
      React.act(() => action.focus());
      res.update({ snapshot: signedIn, ...callbacks });
      expect(res.container.contains(document.activeElement)).to.eql(false);
      expect(buttons(res.container).includes(action)).to.eql(false);
      const add = button(res.container, 'Add Passkey');
      React.act(() => add.focus());
      res.update({
        snapshot: { ...signedOut, authentication: { kind: 'checking' } },
        ...callbacks,
      });
      expect(res.container.contains(document.activeElement)).to.eql(false);
      expect(buttons(res.container)).to.eql([]);
    } finally {
      res.dispose();
    }
  });

  it('focus outside the removed action → snapshot changes do not steal it', async () => {
    const res = await renderPanel({ snapshot: signedOut, ...callbacks });
    const outside = document.createElement('button');
    document.body.append(outside);
    try {
      React.act(() => button(res.container, 'Sign In').focus());
      React.act(() => outside.focus());
      res.update({ snapshot: signedIn, ...callbacks });
      expect(document.activeElement).to.equal(outside);
      res.update({ snapshot: signedOut, ...callbacks });
      expect(document.activeElement).to.equal(outside);
    } finally {
      outside.remove();
      res.dispose();
    }
  });

  it('missing values → dim dashes; supplied values → normal opacity', async () => {
    const res = await renderPanel({ snapshot: signedOut, ...callbacks });
    try {
      const view = res.container.ownerDocument.defaultView!;
      const dashes = () =>
        [...res.container.querySelectorAll<HTMLElement>('*')]
          .filter((el) => el.children.length === 0 && el.textContent === '-');
      expect(dashes().length).to.eql(2);
      for (const dash of dashes()) expect(view.getComputedStyle(dash).opacity).to.eql('0.3');
      const result = element(res.container, '[role="status"][aria-label="Last result"]');
      expect(result.textContent).to.eql('-');
      expect(view.getComputedStyle(result).opacity).not.to.eql('0.3');

      res.update({
        snapshot: {
          ...signedIn,
          authentication: { kind: 'signed-in', principal: '-' },
          result: { kind: 'success', action: 'add-passkey', summary: 'Credential added' },
        },
        ...callbacks,
      });
      expect(dashes().length).to.eql(1);
      expect(view.getComputedStyle(dashes()[0]).opacity).not.to.eql('0.3');
      expect(element(res.container, '[role="status"][aria-label="Last result"]')).to.equal(result);
      expect(result.textContent).to.contain('Credential added');
      expect(view.getComputedStyle(result).opacity).not.to.eql('0.3');
    } finally {
      res.dispose();
    }
  });

  it('panel presentation → title case headings and no outer inset', async () => {
    const res = await renderPanel({ snapshot: signedOut, ...callbacks });
    try {
      const title = [...res.container.querySelectorAll<HTMLElement>('*')]
        .find((el) => el.children.length === 0 && el.textContent === D.name);
      if (!title) throw new Error('Expected the KeyValue title');
      expect(title.closest('[tabindex]')).to.eql(null);
      expect(res.container.textContent).to.contain('Context');
      const root = element(res.container, '[data-component]');
      const view = root.ownerDocument.defaultView!;
      const style = view.getComputedStyle(root);
      expect(style.paddingLeft).to.eql('0px');
      expect(style.paddingRight).to.eql('0px');
      expect(style.paddingTop).to.eql('0px');
      expect(style.paddingBottom).to.eql('0px');
      // Inspect spacing without assuming KeyValue's internal wrapper count or class names.
      let node: HTMLElement | null = title;
      while (node && node !== root) {
        const style = view.getComputedStyle(node);
        expect(style.marginTop || '0px').to.eql('0px');
        expect(style.paddingTop || '0px').to.eql('0px');
        node = node.parentElement;
      }
    } finally {
      res.dispose();
    }
  });

  it('spaced rows → action groups and status text align to the value edge', async () => {
    const res = await renderPanel({ snapshot: signedOut, ...callbacks });
    try {
      const view = res.container.ownerDocument.defaultView!;
      const operation = element(res.container, '[role="status"][aria-label="Operation"]');
      const result = element(res.container, '[role="status"][aria-label="Last result"]');
      expect(view.getComputedStyle(operation).textAlign).to.eql('right');
      expect(view.getComputedStyle(result).textAlign).to.eql('right');
      const action = button(res.container, 'Create with Passkey').parentElement!;
      expect(view.getComputedStyle(action).justifyItems).to.eql('end');
      res.update({ snapshot: signedOut });
      expect(action.textContent).to.contain('Action not connected');
      expect(view.getComputedStyle(action).textAlign).to.eql('right');
    } finally {
      res.dispose();
    }
  });

  it('long supplied content → full text with wrap constraints and caller style composition', async () => {
    const principal = 'principal-'.repeat(24);
    const summary = '<script>not markup</script>'.repeat(12);
    const res = await renderPanel({
      snapshot: {
        ...signedIn,
        authentication: { kind: 'signed-in', principal, credentialCount: 2 },
        result: { kind: 'failure', action: 'add-passkey', summary },
      },
      ...callbacks,
      theme: 'Light',
      style: { padding: 17 },
    });
    try {
      expect(res.container.textContent).to.contain(principal);
      expect(res.container.textContent).to.contain(summary);
      expect(res.container.querySelector('script')).to.eql(null);
      const root = element(res.container, '[data-component]');
      const view = root.ownerDocument.defaultView!;
      expect(view.getComputedStyle(root).padding).to.eql('17px');
      const result = element(res.container, '[role="status"][aria-label="Last result"]');
      expect(view.getComputedStyle(result).overflowWrap).to.eql('anywhere');
      const light = view.getComputedStyle(root).color;
      res.update({ snapshot: signedIn, ...callbacks, theme: 'Dark' });
      expect(view.getComputedStyle(root).color).not.to.eql(light);
    } finally {
      res.dispose();
    }
  });
});
