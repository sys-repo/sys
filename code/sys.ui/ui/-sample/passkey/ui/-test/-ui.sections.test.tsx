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
  type t,
  TestReact,
} from './common.ts';
import { Passkey } from '../mod.ts';
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

const callbacks: t.Passkey.Callbacks = {
  onCreateAccount: () => {},
  onSignIn: () => {},
  onAddPasskey: () => {},
  onSignOut: () => {},
};
const names = ['actions', 'status', 'context'] as const;

describe('Passkey diagnostic sections', () => {
  DomMock.init({ beforeAll, afterAll });

  for (const theme of ['Light', 'Dark'] as const) {
    for (const mask of [0, 1, 2, 3, 4, 5, 6, 7]) {
      const sections = { actions: !!(mask & 1), status: !!(mask & 2), context: !!(mask & 4) };
      const selected = names.filter((name) => sections[name]);
      it(`${theme} ${selected.join(' + ') || 'empty'} → framing and progress follow visible sections`, async () => {
        const res = await renderPanel({ snapshot: signedOut, ...callbacks, sections, theme });
        try {
          expect(sectionNames(res.container)).to.eql(selected);
          expect(
            [...res.container.querySelectorAll('[data-passkey-divider]')].map((el) =>
              el.getAttribute('data-passkey-divider')
            ),
          ).to.eql(selected.slice(1));
          expect(leaves(res.container, D.name).length).to.eql(selected.length ? 1 : 0);
          expect(leaves(res.container, 'Context').length).to.eql(sections.context ? 1 : 0);
          expect(buttons(res.container).length).to.eql(sections.actions ? 2 : 0);
          expect(res.container.querySelectorAll('[role="status"]').length).to.eql(
            sections.status ? 2 : 0,
          );
          expect(res.container.querySelectorAll('a').length).to.eql(sections.context ? 3 : 0);
          res.update({
            snapshot: {
              ...signedOut,
              operation: { kind: 'pending', action: 'sign-in', phase: 'Waiting' },
            },
            ...callbacks,
            sections,
            theme,
          });
          expect(res.container.querySelectorAll('[role="progressbar"]').length).to.eql(
            selected.length && !sections.status ? 1 : 0,
          );
          expect(res.container.querySelectorAll('[data-spinner-slot]').length).to.eql(
            sections.status ? 1 : 0,
          );
          if (!selected.length) expect(res.container.innerHTML).to.eql('');
          else {
            const root = element(res.container, '[data-component]');
            expect(Color.toHex(root.ownerDocument.defaultView!.getComputedStyle(root).color)).to
              .eql(Color.toHex(Color.theme(theme).fg));
            for (const divider of res.container.querySelectorAll('[data-passkey-divider]')) {
              expect(divider.getAttribute('aria-hidden')).to.eql('true');
              expect(divider.previousElementSibling?.hasAttribute('data-passkey-section')).to.eql(
                true,
              );
              expect(divider.nextElementSibling?.hasAttribute('data-passkey-section')).to.eql(true);
              const lines = [...divider.querySelectorAll<HTMLElement>('div')]
                .filter((el) => el.childElementCount === 0)
                .map((el) => {
                  const style = el.ownerDocument.defaultView!.getComputedStyle(el);
                  return {
                    height: style.height,
                    color: Color.toHex(style.backgroundColor),
                    opacity: style.opacity,
                  };
                });
              expect(lines).to.eql([
                { height: '1px', color: Color.toHex(Color.theme(theme).fg), opacity: '0.2' },
              ]);
            }
          }
        } finally {
          res.dispose();
        }
      });
    }

    it(`${theme} title activity → stable allocation and controls; only pending without Status activates it`, async () => {
      const props = { snapshot: signedOut, ...callbacks, sections: { status: false }, theme };
      const res = await renderPanel(props);
      try {
        const title = textElement(res.container, D.name);
        const slot = element(res.container, '[data-passkey-title-spinner]');
        const actions = element(res.container, '[data-passkey-section="actions"]');
        const signIn = button(actions, 'Sign In');
        const context = element(res.container, '[data-passkey-section="context"]');
        React.act(() => signIn.focus());
        const pending: t.Passkey.Snapshot = {
          ...signedOut,
          operation: { kind: 'pending', action: 'sign-in', phase: 'Verifying response' },
        };
        const transitions: readonly [t.Passkey.Snapshot, t.Passkey.Sections, boolean][] = [
          [signedOut, { status: false }, false],
          [pending, { status: false }, true],
          [pending, {}, false],
          [pending, { status: false }, true],
          [
            {
              ...signedOut,
              result: { kind: 'failure', action: 'sign-in', summary: 'Failed' },
            },
            { status: false },
            false,
          ],
        ];
        for (const [snapshot, sections, busy] of transitions) {
          res.update({ ...props, snapshot, sections });
          expect(textElement(res.container, D.name)).to.equal(title);
          expect(element(res.container, '[data-passkey-title-spinner]')).to.equal(slot);
          expect(slot.getAttribute('role')).to.eql(busy ? 'progressbar' : null);
          expect(slot.getAttribute('aria-label')).to.eql(
            busy ? 'Passkey operation in progress' : null,
          );
          expect(slot.hasAttribute('aria-valuenow')).to.eql(false);
          expect(slot.hasAttribute('tabindex')).to.eql(false);
          const style = slot.ownerDocument.defaultView!.getComputedStyle(slot);
          expect(style.width).to.eql('24px');
          expect(style.height).to.eql('3px');
          expect(element(res.container, '[data-passkey-section="actions"]')).to.equal(actions);
          expect(actions.textContent).to.eql(
            'New accountCreate with PasskeyExisting accountSign In',
          );
          expect(button(actions, 'Sign In')).to.equal(signIn);
          expect(document.activeElement).to.equal(signIn);
          expect(element(res.container, '[data-passkey-section="context"]')).to.equal(context);
        }
        // Each independent source of unavailability stays distinct from pending work.
        const idleCases: readonly t.Passkey.Props[] = [
          { ...props, onCreateAccount: undefined, onSignIn: undefined },
          {
            ...props,
            snapshot: {
              ...signedOut,
              context: {
                ...signedOut.context,
                webAuthn: { kind: 'unavailable', reason: 'Unsupported' },
              },
            },
          },
          {
            ...props,
            snapshot: {
              ...signedOut,
              authentication: { kind: 'unknown', summary: 'Session not checked' },
            },
          },
        ];
        for (const props of idleCases) {
          res.update(props);
          expect(res.container.querySelector('[role="progressbar"]')).to.eql(null);
          expect(element(res.container, '[data-passkey-title-spinner]')).to.equal(slot);
        }
      } finally {
        res.dispose();
      }
    });

    it(`${theme} standalone → narrow inputs, caller style, and no aggregate framing`, async () => {
      const cases = [
        [
          'actions',
          <Passkey.UI.Actions
            key='actions'
            {...signedOut}
            {...callbacks}
            theme={theme}
            style={{ padding: 7 }}
          />,
        ],
        [
          'status',
          <Passkey.UI.Status
            key='status'
            authentication={signedIn.authentication}
            operation={signedIn.operation}
            theme={theme}
            style={{ padding: 7 }}
          />,
        ],
        [
          'context',
          <Passkey.UI.Context
            key='context'
            context={signedOut.context}
            theme={theme}
            style={{ padding: 7 }}
          />,
        ],
      ] as const;
      for (const [name, node] of cases) {
        const res = await TestReact.render(node);
        try {
          expect(sectionNames(res.container)).to.eql([name]);
          expect(leaves(res.container, D.name).length).to.eql(0);
          expect(res.container.querySelectorAll('[data-passkey-divider]').length).to.eql(0);
          const root = element(res.container, '[data-passkey-section]');
          const view = root.ownerDocument.defaultView!;
          expect(view.getComputedStyle(root).padding).to.eql('7px');
          expect(Color.toHex(view.getComputedStyle(root).color)).to.eql(
            Color.toHex(Color.theme(theme).fg),
          );
          if (name === 'actions') {
            expect(buttons(root).map((el) => el.textContent)).to.eql([
              'Create with Passkey',
              'Sign In',
            ]);
          } else if (name === 'status') {
            expect(valueCell(root, 'Authentication').textContent).to.eql('Signed in');
            expect(valueCell(root, 'Principal').textContent).to.eql('principal-test-01');
            expect(valueCell(root, 'Registered keys').textContent).to.eql('Unknown');
            expect(root.querySelectorAll('[role="status"]').length).to.eql(2);
            expect(buttons(root)).to.eql([]);
          } else {
            expect(valueCell(root, 'Verifier').textContent).to.eql('Available');
            expect(root.querySelectorAll('[role="status"]').length).to.eql(0);
          }
        } finally {
          React.act(() => res.dispose());
        }
      }
    });
  }

  it('omitted visibility members → visible; checking/unknown Actions-only → truly empty', async () => {
    const res = await renderPanel({ snapshot: signedOut, ...callbacks });
    try {
      expect(sectionNames(res.container)).to.eql(names);
      res.update({ snapshot: signedOut, sections: { context: false } });
      expect(sectionNames(res.container)).to.eql(['actions', 'status']);
      for (
        const authentication of [
          { kind: 'checking' },
          { kind: 'unknown', summary: 'Lookup failed' },
        ] satisfies t.Passkey.Authentication[]
      ) {
        const snapshot = { ...signedOut, authentication };
        res.update({ snapshot, sections: { status: false, context: false } });
        expect(res.container.innerHTML).to.eql('');
        res.update({ snapshot });
        expect(sectionNames(res.container)).to.eql(['status', 'context']);
        expect(res.container.querySelectorAll('[data-passkey-divider]').length).to.eql(1);
        const standalone = await TestReact.render(<Passkey.UI.Actions {...snapshot} />);
        try {
          expect(standalone.container.innerHTML).to.eql('');
        } finally {
          React.act(() => standalone.dispose());
        }
      }
      res.update({
        snapshot: signedOut,
        ...callbacks,
        sections: { status: false, context: false },
      });
      expect(sectionNames(res.container)).to.eql(['actions']);
      expect(leaves(res.container, D.name).length).to.eql(1);
      expect(res.container.querySelectorAll('[data-passkey-divider]').length).to.eql(0);
    } finally {
      res.dispose();
    }
  });

  it('sibling hiding and effective-empty transitions → surviving roots, focus, announcements, and slot remain', async () => {
    const props = { snapshot: signedOut, ...callbacks };
    const res = await renderPanel(props);
    try {
      const actions = element(res.container, '[data-passkey-section="actions"]');
      const status = element(res.container, '[data-passkey-section="status"]');
      const signIn = button(actions, 'Sign In');
      const operation = element(status, '[role="status"][aria-label="Operation"]');
      const result = element(status, '[role="status"][aria-label="Last result"]');
      const slot = element(status, '[data-spinner-slot]');
      React.act(() => signIn.focus());
      res.update({
        ...props,
        snapshot: {
          ...signedOut,
          operation: { kind: 'pending', action: 'sign-in', phase: 'Waiting' },
        },
        sections: { context: false },
      });
      expect(element(res.container, '[data-passkey-section="status"]')).to.equal(status);
      expect(element(status, '[aria-label="Operation"]')).to.equal(operation);
      expect(element(status, '[aria-label="Last result"]')).to.equal(result);
      expect(element(status, '[data-spinner-slot]')).to.equal(slot);
      expect(document.activeElement).to.equal(signIn);
      for (
        const sections of [
          { context: false },
          { status: false },
          { status: false, context: false },
          {},
        ]
      ) {
        res.update({ ...props, sections });
        expect(element(res.container, '[data-passkey-section="actions"]')).to.equal(actions);
        expect(button(actions, 'Sign In')).to.equal(signIn);
        expect(document.activeElement).to.equal(signIn);
      }
      // Status was deliberately removed above, so take its new identity before hiding Actions.
      const survivingStatus = element(res.container, '[data-passkey-section="status"]');
      const survivingOperation = element(survivingStatus, '[aria-label="Operation"]');
      const survivingResult = element(survivingStatus, '[aria-label="Last result"]');
      const survivingSlot = element(survivingStatus, '[data-spinner-slot]');
      for (
        const authentication of [
          { kind: 'checking' },
          { kind: 'unknown', summary: 'Failed' },
          signedOut.authentication,
        ] satisfies t.Passkey.Authentication[]
      ) {
        res.update({ ...props, snapshot: { ...signedOut, authentication } });
        expect(element(res.container, '[data-passkey-section="status"]')).to.equal(survivingStatus);
        expect(element(survivingStatus, '[aria-label="Operation"]')).to.equal(survivingOperation);
        expect(element(survivingStatus, '[aria-label="Last result"]')).to.equal(survivingResult);
        expect(element(survivingStatus, '[data-spinner-slot]')).to.equal(survivingSlot);
      }
      const stableContext = element(res.container, '[data-passkey-section="context"]');
      res.update({ ...props, sections: { actions: false } });
      expect(element(res.container, '[data-passkey-section="status"]')).to.equal(survivingStatus);
      expect(element(res.container, '[data-passkey-section="context"]')).to.equal(stableContext);
    } finally {
      res.dispose();
    }
  });

  for (const action of ['create-account', 'sign-in', 'add-passkey', 'sign-out'] as const) {
    it(`pending ${action} → Actions preserves its controls and suppresses every callback`, async () => {
      const isSignedOut = action === 'create-account' || action === 'sign-in';
      const snapshot: t.Passkey.Snapshot = {
        ...(isSignedOut ? signedOut : signedIn),
        operation: { kind: 'pending', action, phase: 'Waiting for response' },
      };
      const intents: t.Passkey.Action[] = [];
      const res = await TestReact.render(
        <Passkey.UI.Actions
          {...snapshot}
          onCreateAccount={() => intents.push('create-account')}
          onSignIn={() => intents.push('sign-in')}
          onAddPasskey={() => intents.push('add-passkey')}
          onSignOut={() => intents.push('sign-out')}
        />,
      );
      try {
        expect(res.container.textContent).to.eql(
          isSignedOut
            ? 'New accountCreate with PasskeyExisting accountSign In'
            : 'PasskeysAdd PasskeySessionSign Out',
        );
        const controls = buttons(res.container);
        expect(controls.map((el) => el.textContent)).to.eql(
          isSignedOut ? ['Create with Passkey', 'Sign In'] : ['Add Passkey', 'Sign Out'],
        );
        for (const el of controls) {
          expect(el.getAttribute('aria-disabled')).to.eql('true');
          expect(el.tabIndex).to.eql(-1);
          press(el, 'Enter');
          press(el, ' ');
          React.act(() => DomMock.Mouse.activate(el));
        }
        expect(intents).to.eql([]);
      } finally {
        React.act(() => res.dispose());
      }
    });
  }

  it('hidden Context → prerequisites still gate ceremonies, not idle sign-out', async () => {
    let count = 0;
    const snapshot: t.Passkey.Snapshot = {
      ...signedIn,
      context: {
        ...signedIn.context,
        webAuthn: { kind: 'unavailable', reason: 'Unsupported browser' },
      },
    };
    const res = await renderPanel({
      snapshot,
      sections: { context: false },
      onAddPasskey: () => count++,
      onSignOut: () => count++,
    });
    try {
      expect(sectionNames(res.container)).to.eql(['actions', 'status']);
      expect(res.container.textContent).to.contain('Unsupported browser');
      const add = button(res.container, 'Add Passkey');
      expect(add.getAttribute('aria-disabled')).to.eql('true');
      press(add, 'Enter');
      expect(count).to.eql(0);
      press(button(res.container, 'Sign Out'), 'Enter');
      expect(count).to.eql(1);
    } finally {
      res.dispose();
    }
  });

  for (const theme of ['Light', 'Dark'] as const) {
    it(`${theme} authentication cue → only supplied authentication selects green; text retains uncertainty`, async () => {
      const res = await renderPanel({ snapshot: signedOut, ...callbacks, theme });
      try {
        const states: readonly [t.Passkey.Snapshot, string, boolean][] = [
          [signedOut, 'Signed out', false],
          [{ ...signedOut, authentication: { kind: 'checking' } }, 'Checking session', false],
          [
            { ...signedOut, authentication: { kind: 'unknown', summary: 'Lookup failed' } },
            'Unknown: Lookup failed',
            false,
          ],
          [
            {
              ...signedOut,
              result: { kind: 'success', action: 'create-account', summary: 'Registered' },
            },
            'Signed out',
            false,
          ],
          [signedIn, 'Signed in', true],
          [
            {
              ...signedIn,
              operation: { kind: 'pending', action: 'add-passkey', phase: 'Waiting' },
            },
            'Signed in',
            true,
          ],
          [
            { ...signedIn, result: { kind: 'failure', action: 'add-passkey', summary: 'Failed' } },
            'Signed in',
            true,
          ],
          [signedOut, 'Signed out', false],
        ];
        for (const [snapshot, text, green] of states) {
          res.update({ snapshot, ...callbacks, theme });
          const value = valueCell(res.container, 'Authentication');
          expect(value.textContent).to.eql(
            snapshot.authentication.kind === 'unknown' ? `⚠ ${text}` : text,
          );
          const decorations = value.querySelectorAll<HTMLElement>('[aria-hidden="true"]');
          const decoration = [...decorations].find((el) => el.textContent === '');
          if (Is.nil(decoration)) throw new Error('Missing decorative authentication Bullet');
          expect(decoration.hasAttribute('tabindex')).to.eql(false);
          expect(decoration.querySelector('[tabindex], button, a')).to.eql(null);
          const painted = [...decoration.querySelectorAll<HTMLElement>('*')].filter((el) =>
            el.childElementCount === 0
          );
          const view = decoration.ownerDocument.defaultView!;
          expect(painted.map((el) => Color.toHex(view.getComputedStyle(el).backgroundColor)))
            .to.eql([Color.toHex(green ? Color.GREEN : Color.theme(theme).bg)]);
        }
      } finally {
        res.dispose();
      }
    });

    it(`${theme} Context → exact references on keys, secure opening, and unchanged selectable values`, async () => {
      const context: t.Passkey.Context = {
        origin: `https://${'long-origin-'.repeat(20)}.example.test`,
        rpId: '-',
        webAuthn: { kind: 'unknown', reason: 'Not checked' },
        verifier: { kind: 'unavailable', reason: 'Not configured' },
      };
      const res = await TestReact.render(<Passkey.UI.Context context={context} theme={theme} />);
      try {
        const anchors = [...res.container.querySelectorAll<HTMLAnchorElement>('a')];
        const references = [
          ['Origin', 'sctn-validating-origin', context.origin],
          ['Relying Party ID', 'relying-party-identifier', '-'],
          ['WebAuthn', 'sctn-api', 'Unknown: Not checked'],
        ];
        expect(anchors.length).to.eql(3);
        for (const [index, [label, fragment, text]] of references.entries()) {
          const anchor = anchors[index];
          expect(anchor.textContent).to.eql(label);
          expect(anchor.href).to.eql(`https://www.w3.org/TR/webauthn-3/#${fragment}`);
          expect(anchor.target).to.eql('_blank');
          expect(anchor.rel.split(' ').sort()).to.eql(['noopener', 'noreferrer']);
          const ids = anchor.getAttribute('aria-describedby')!.split(' ');
          expect(ids.length).to.eql(1);
          const hint = document.getElementById(ids[0])!;
          expect(hint.hidden).to.eql(true);
          expect(hint.textContent).to.eql('Opens in a new tab');
          const value = anchor.parentElement!.nextElementSibling!;
          expect(value.textContent).to.eql(text);
          expect(value.querySelector('a')).to.eql(null);
          const view = value.ownerDocument.defaultView!;
          expect(view.getComputedStyle(value).userSelect).to.eql('text');
          expect(view.getComputedStyle(value.firstElementChild!).overflowWrap).to.eql('anywhere');
          expect(view.getComputedStyle(value.firstElementChild!).whiteSpace).to.eql('normal');
        }
        const verifier = leaves(res.container, 'Verifier')[0];
        expect(verifier.nextElementSibling!.textContent).to.eql('Unavailable: Not configured');
        expect(
          verifier.ownerDocument.defaultView!.getComputedStyle(verifier.nextElementSibling!)
            .userSelect,
        ).to.eql('text');
      } finally {
        React.act(() => res.dispose());
      }
    });
  }
});

function sectionNames(container: HTMLElement) {
  return [...container.querySelectorAll('[data-passkey-section]')].map((el) =>
    el.getAttribute('data-passkey-section')
  );
}

function leaves(container: HTMLElement, text: string) {
  return [...container.querySelectorAll<HTMLElement>('div')].filter((el) =>
    el.children.length === 0 && el.textContent === text
  );
}
