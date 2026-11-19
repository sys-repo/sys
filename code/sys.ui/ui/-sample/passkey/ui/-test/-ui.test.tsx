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
  type t,
  TestReact,
} from './common.ts';
import { Warning } from '../ui.Warning.tsx';
import {
  button,
  buttons,
  element,
  press,
  renderPanel,
  signedIn,
  signedOut,
  textElement,
  valueCell,
} from './u.fixture.tsx';

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
        expect(valueCell(res.container, 'Authentication').textContent).to.eql(
          authentication.kind === 'checking'
            ? 'Checking session'
            : '⚠ Unknown: Session lookup failed',
        );
        if (authentication.kind === 'unknown') {
          const warning = element(
            res.container,
            '[role="note"][aria-label="Authentication unknown"]',
          );
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
      expect(valueCell(res.container, 'Authentication').textContent).to.eql('Signed out');
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
      expect(valueCell(res.container, 'Principal').textContent).to.eql('principal-test-01');
      expect(valueCell(res.container, 'Registered credentials').textContent).to.eql('Unknown');
      press(button(res.container, 'Add Passkey'), 'Enter');
      press(button(res.container, 'Sign Out'), ' ');
      expect(intents).to.eql(['add-passkey', 'sign-out']);
      expect(valueCell(res.container, 'Authentication').textContent).to.eql('Signed in');
      res.update({
        ...props,
        snapshot: {
          ...signedIn,
          authentication: { kind: 'signed-in', principal: 'principal-test-01', credentialCount: 0 },
        },
      });
      expect(valueCell(res.container, 'Registered credentials').textContent).to.eql('0');
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
        expect(buttons(res.container).map((el) => el.textContent)).to.eql([
          'Create with Passkey',
          'Sign In',
        ]);
        const actions = element(res.container, '[data-passkey-section="actions"]');
        expect([...actions.querySelectorAll('[role="note"]')].map((el) => el.textContent))
          .to.eql([`⚠ ${reason}`, `⚠ ${reason}`]);
        for (const action of buttons(actions)) {
          expect(action.getAttribute('aria-disabled')).to.eql('true');
          expect(action.tabIndex).to.eql(-1);
          press(action, 'Enter');
          React.act(() => DomMock.Mouse.activate(action));
        }
        expect(count).to.eql(0);
      } finally {
        res.dispose();
      }
    });
  }

  it('missing callback → visibly unavailable rather than a silent no-op', async () => {
    const res = await renderPanel({ snapshot: signedOut });
    try {
      expect(buttons(res.container).map((el) => el.textContent)).to.eql([
        'Create with Passkey',
        'Sign In',
      ]);
      expect([...res.container.querySelectorAll('[role="note"]')].map((el) => el.textContent))
        .to.eql(['⚠ Action not connected', '⚠ Action not connected']);
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

  it('registration success → remains signed out; add failure → preserves supplied session', async () => {
    const res = await renderPanel({
      snapshot: {
        ...signedOut,
        result: { kind: 'success', action: 'create-account', summary: 'Credential registered' },
      },
      ...callbacks,
    });
    try {
      expect(valueCell(res.container, 'Authentication').textContent).to.eql('Signed out');
      const result = element(res.container, '[role="status"][aria-label="Last result"]');
      expect(result.textContent).to.eql('Create with Passkey — success: Credential registered');
      res.update({
        snapshot: {
          ...signedIn,
          result: { kind: 'failure', action: 'add-passkey', summary: 'Request did not complete' },
        },
        ...callbacks,
      });
      expect(element(res.container, '[role="status"][aria-label="Last result"]')).to.equal(result);
      expect(result.textContent).to.eql('Add Passkey — failure: Request did not complete');
      expect(valueCell(res.container, 'Principal').textContent).to.eql('principal-test-01');
      expect(valueCell(res.container, 'Authentication').textContent).to.eql('Signed in');
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
      const pendingStyle = view.getComputedStyle(slot);
      expect(pendingStyle.width).to.eql('24px');
      expect(pendingStyle.height).to.eql('3px');
      expect(slot.getAttribute('aria-hidden')).to.eql('true');
      expect(operation.textContent).to.eql('Sign In: Verifying response');
      expect(operation.getAttribute('aria-atomic')).to.eql('true');
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
      expect(buttons(res.container).map((el) => el.textContent)).to.eql([
        'Add Passkey',
        'Sign Out',
      ]);
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
      expect(view.getComputedStyle(result).opacity || '1').to.eql('1');

      res.update({
        snapshot: {
          ...signedIn,
          authentication: { kind: 'signed-in', principal: '-' },
          result: { kind: 'success', action: 'add-passkey', summary: 'Credential added' },
        },
        ...callbacks,
      });
      expect(dashes().length).to.eql(1);
      expect(view.getComputedStyle(dashes()[0]).opacity || '1').to.eql('1');
      expect(element(res.container, '[role="status"][aria-label="Last result"]')).to.equal(result);
      expect(result.textContent).to.eql('Add Passkey — success: Credential added');
      expect(view.getComputedStyle(result).opacity || '1').to.eql('1');
    } finally {
      res.dispose();
    }
  });

  it('panel framing → nonfocusable title and no outer inset', async () => {
    const res = await renderPanel({ snapshot: signedOut, ...callbacks });
    try {
      const title = textElement(res.container, D.name);
      expect(title.closest('[tabindex]')).to.eql(null);
      const root = element(res.container, '[data-component]');
      const view = root.ownerDocument.defaultView!;
      const style = view.getComputedStyle(root);
      expect(style.padding).to.eql('0px');
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
      expect(valueCell(res.container, 'Principal').textContent).to.eql(principal);
      expect(valueCell(res.container, 'Last result').textContent)
        .to.eql(`Add Passkey — failure: ${summary}`);
      expect(res.container.querySelector('script')).to.eql(null);
      const root = element(res.container, '[data-component]');
      const view = root.ownerDocument.defaultView!;
      expect(view.getComputedStyle(root).padding).to.eql('17px');
      const result = element(res.container, '[role="status"][aria-label="Last result"]');
      expect(view.getComputedStyle(result).overflowWrap).to.eql('anywhere');
      expect(Color.toHex(view.getComputedStyle(root).color)).to.eql(
        Color.toHex(Color.theme('Light').fg),
      );
      res.update({ snapshot: signedIn, ...callbacks, theme: 'Dark' });
      expect(Color.toHex(view.getComputedStyle(root).color)).to.eql(
        Color.toHex(Color.theme('Dark').fg),
      );
    } finally {
      res.dispose();
    }
  });
});
