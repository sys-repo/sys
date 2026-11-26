import React from 'react';
import {
  afterAll,
  beforeAll,
  Color,
  describe,
  DomMock,
  expect,
  it,
  type t,
  TestReact,
} from './common.ts';
import { Passkey } from '../mod.ts';
import { actionLabel } from '../u.actions.ts';
import { Warning } from '../ui.Warning.tsx';
import {
  actionButton,
  buttons,
  element,
  expectActions,
  press,
  renderPanel,
  signedIn,
  signedOut,
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
      const signIn = actionButton(res.container, 'sign-in');
      const create = actionButton(res.container, 'create-account');
      expect(valueCell(res.container, 'Existing account').contains(signIn)).to.eql(true);
      expect(valueCell(res.container, 'New account').contains(create)).to.eql(true);
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

  it('session changes → filled session action first, text registration action second', async () => {
    using panel = await renderPanel({ snapshot: signedOut, ...callbacks });
    const cases = [
      [signedOut, 'Sign In', 'Create Passkey'],
      [signedIn, 'Sign Out', 'Add Passkey'],
    ] as const;
    for (const theme of ['Light', 'Dark'] as const) {
      for (const [snapshot, session, registration] of cases) {
        panel.update({ snapshot, ...callbacks, theme });
        const rows = buttons(panel.container).map((button) => {
          const bg = button.ownerDocument.defaultView!.getComputedStyle(button).backgroundColor;
          const filled = !!bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)';
          return [button.textContent, filled];
        });
        expect(rows).to.eql([[session, true], [registration, false]]);
      }
    }
  });

  it('signed in → distinct intents and unknown versus zero credential count', async () => {
    const intents: string[] = [];
    const props: t.Passkey.Props = {
      snapshot: signedIn,
      onAddPasskey: () => intents.push('add-passkey'),
      onSignOut: () => intents.push('sign-out'),
    };
    const res = await renderPanel(props);
    try {
      const signOut = actionButton(res.container, 'sign-out');
      const add = actionButton(res.container, 'add-passkey');
      expect(valueCell(res.container, 'Session').contains(signOut)).to.eql(true);
      expect(valueCell(res.container, 'Passkeys').contains(add)).to.eql(true);
      expect(valueCell(res.container, 'Principal').textContent).to.eql('principal-test-01');
      expect(valueCell(res.container, 'Registered credentials').textContent).to.eql('Unknown');
      press(signOut, ' ');
      press(add, 'Enter');
      expect(intents).to.eql(['sign-out', 'add-passkey']);
      expect(valueCell(res.container, 'Authentication').textContent).to.eql('Signed in');
      res.update({
        ...props,
        snapshot: {
          ...signedIn,
          authentication: { ...signedIn.authentication, credentialCount: 0 },
        },
      });
      expect(valueCell(res.container, 'Registered credentials').textContent).to.eql('0');
    } finally {
      res.dispose();
    }
  });

  it('Actions owns the registration note; only eligible registration controls refer to it', async () => {
    const context = {
      ...signedOut.context,
      registrationAdvisory:
        '# Use a sample passkey\n\nRead the [reference](https://example.test/term).',
    };
    const props = { snapshot: { ...signedOut, context }, ...callbacks };
    using panel = await renderPanel(props);
    const selector = '[role="note"][id]';
    const note = () => panel.container.querySelector(selector);
    const create = () => actionButton(panel.container, 'create-account');
    const initialNote = element(panel.container, selector);
    const contextSection = element(panel.container, '[data-passkey-section="context"]');
    expect(initialNote.previousElementSibling?.contains(contextSection)).to.eql(true);
    expect(create().getAttribute('aria-describedby')).to.eql(initialNote.id);
    expect(initialNote.ownerDocument.defaultView!.getComputedStyle(initialNote).marginTop).to.eql(
      '20px',
    );
    const reference = element(panel.container, `${selector} a[href="https://example.test/term"]`);
    expect(reference.getAttribute('target')).to.eql('_blank');
    expect(reference.getAttribute('rel')?.split(' ')).to.include.members([
      'noopener',
      'noreferrer',
    ]);
    expect(actionButton(panel.container, 'sign-in').hasAttribute('aria-describedby')).to.eql(false);
    panel.update({ ...props, snapshot: { ...signedIn, context } });
    const signedInNote = element(panel.container, selector);
    const add = actionButton(panel.container, 'add-passkey');
    expect(add.getAttribute('aria-describedby')).to.eql(signedInNote.id);
    const signOut = actionButton(panel.container, 'sign-out');
    expect(signOut.hasAttribute('aria-describedby')).to.eql(false);
    const updated = { ...context, registrationAdvisory: 'Updated guidance.' };
    const snapshot = { ...signedOut, context: updated };
    panel.update({ ...props, snapshot, onCreateAccount: undefined });
    expect(note()).to.equal(initialNote);
    expect(initialNote.textContent).to.include('Updated guidance.');
    expect(create().hasAttribute('aria-describedby')).to.eql(false);
    expect(panel.container.textContent).to.include('Action not connected');
    panel.update({ ...props, snapshot: signedOut });
    expect(note()).to.eql(null);
    panel.update({ ...props, sections: { actions: false } });
    expect(note()).to.eql(null);

    using bare = await TestReact.render(<Passkey.UI.Actions {...props.snapshot} {...callbacks} />);
    const bareNote = element(bare.container, selector);
    const bareCreate = actionButton(bare.container, 'create-account');
    expect(bareNote.previousElementSibling?.contains(bareCreate)).to.eql(true);
    expect(bareCreate.getAttribute('aria-describedby')).to.eql(bareNote.id);
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
        expectActions(res.container, 'sign-in', 'create-account');
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
      expectActions(res.container, 'sign-in', 'create-account');
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

  it('hidden Context and unavailable WebAuthn → explain blocked Add; Sign Out still works', async () => {
    let count = 0;
    const res = await renderPanel({
      snapshot: {
        ...signedIn,
        context: { ...signedIn.context, webAuthn: { kind: 'unavailable', reason: 'Unsupported' } },
      },
      sections: { context: false },
      onAddPasskey: () => count++,
      onSignOut: () => count++,
    });
    try {
      expect(element(res.container, '[role="note"]').textContent).to.contain('Unsupported');
      const add = actionButton(res.container, 'add-passkey');
      expect(add.getAttribute('aria-disabled')).to.eql('true');
      press(add, 'Enter');
      expect(count).to.eql(0);
      const signOut = actionButton(res.container, 'sign-out');
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
      expect(result.textContent)
        .to.eql(`${actionLabel('create-account')} — success: Credential registered`);
      res.update({
        snapshot: {
          ...signedIn,
          result: { kind: 'failure', action: 'add-passkey', summary: 'Request did not complete' },
        },
        ...callbacks,
      });
      expect(element(res.container, '[role="status"][aria-label="Last result"]')).to.equal(result);
      expect(result.textContent)
        .to.eql(`${actionLabel('add-passkey')} — failure: Request did not complete`);
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
      const action = actionButton(res.container, 'sign-in');
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
      expect(actionButton(res.container, 'sign-in')).to.equal(action);
      expect(document.activeElement).to.equal(action);
      expect(action.tabIndex).to.eql(-1);
      const pendingStyle = view.getComputedStyle(slot);
      expect(pendingStyle.width).to.eql('24px');
      expect(pendingStyle.height).to.eql('3px');
      expect(slot.getAttribute('aria-hidden')).to.eql('true');
      expect(operation.textContent).to.eql(`${action.textContent}: Verifying response`);
      expect(operation.getAttribute('aria-atomic')).to.eql('true');
      res.update({
        ...props,
        snapshot: {
          ...signedOut,
          result: { kind: 'failure', action: 'sign-in', summary: 'Request did not complete' },
        },
      });
      expect(actionButton(res.container, 'sign-in')).to.equal(action);
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
      const action = actionButton(res.container, 'sign-in');
      React.act(() => action.focus());
      expect(document.activeElement).to.equal(action);
      res.update({ snapshot: signedIn, ...callbacks });
      expect(res.container.contains(document.activeElement)).to.eql(false);
      const add = actionButton(res.container, 'add-passkey');
      React.act(() => add.focus());
      expect(document.activeElement).to.equal(add);
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
      React.act(() => actionButton(res.container, 'sign-in').focus());
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

  it('missing values → dim dashes; a supplied principal keeps normal opacity', async () => {
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
          authentication: { ...signedIn.authentication, principal: '-' },
          result: { kind: 'success', action: 'add-passkey', summary: 'Credential added' },
        },
        ...callbacks,
      });
      expect(dashes().length).to.eql(1);
      expect(view.getComputedStyle(dashes()[0]).opacity || '1').to.eql('1');
      expect(element(res.container, '[role="status"][aria-label="Last result"]')).to.equal(result);
      expect(result.textContent)
        .to.eql(`${actionLabel('add-passkey')} — success: Credential added`);
    } finally {
      res.dispose();
    }
  });

  it('panel framing → no tab stop before the first action and no outer inset', async () => {
    using panel = await renderPanel({ snapshot: signedOut, ...callbacks });
    const root = element(panel.container, '[data-component]');
    const nodes = [root, ...root.querySelectorAll<HTMLElement>('*')];
    expect(nodes.find((el) => el.tabIndex >= 0)).to.equal(actionButton(root, 'sign-in'));
    expect(root.ownerDocument.defaultView!.getComputedStyle(root).padding).to.eql('0px');
  });

  it('spaced rows → action groups and status text align to the value edge', async () => {
    const res = await renderPanel({ snapshot: signedOut, ...callbacks });
    try {
      const view = res.container.ownerDocument.defaultView!;
      const operation = element(res.container, '[role="status"][aria-label="Operation"]');
      const result = element(res.container, '[role="status"][aria-label="Last result"]');
      expect(view.getComputedStyle(operation).textAlign).to.eql('right');
      expect(view.getComputedStyle(result).textAlign).to.eql('right');
      const action = actionButton(res.container, 'create-account').parentElement!;
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
        authentication: { ...signedIn.authentication, principal, credentialCount: 2 },
        result: { kind: 'failure', action: 'add-passkey', summary },
      },
      ...callbacks,
      theme: 'Light',
      style: { padding: 17 },
    });
    try {
      expect(valueCell(res.container, 'Principal').textContent).to.eql(principal);
      expect(valueCell(res.container, 'Last result').textContent)
        .to.eql(`${actionLabel('add-passkey')} — failure: ${summary}`);
      expect(res.container.querySelector('script')).to.eql(null);
      const root = element(res.container, '[data-component]');
      const view = root.ownerDocument.defaultView!;
      expect(view.getComputedStyle(root).padding).to.eql('17px');
      const result = element(res.container, '[role="status"][aria-label="Last result"]');
      const style = view.getComputedStyle(result);
      expect(style.overflowWrap).to.eql('anywhere');
      expect(style.getPropertyValue('text-wrap')).to.eql('pretty');
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
