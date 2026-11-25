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
import { browserOrigin } from '../../u/u.issuer.ts';
import { Passkey } from '../mod.ts';
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

const names = ['actions', 'status', 'context'] as const;
const pending: t.Passkey.Snapshot = {
  ...signedOut,
  operation: { kind: 'pending', action: 'sign-in', phase: 'Waiting' },
};
const section = (name: string) => `[data-passkey-section="${name}"]`;
const cssOf = (el: Element) => el.ownerDocument.defaultView!.getComputedStyle(el);

/** Order matters: no leading, trailing, or orphan divider. */
function framing(container: HTMLElement) {
  return [...container.querySelectorAll('[data-passkey-section], [data-passkey-divider]')]
    .map((el) => el.getAttribute('data-passkey-section') ?? '|').join(' ');
}

describe('Passkey diagnostic sections', () => {
  DomMock.init({ beforeAll, afterAll });

  for (const mask of [0, 1, 2, 3, 4, 5, 6, 7]) {
    const sections = { actions: !!(mask & 1), status: !!(mask & 2), context: !!(mask & 4) };
    const visible = names.filter((name) => sections[name]);
    it(`${visible.join(' + ') || 'none'} → only visible sections, one progress location`, async () => {
      using panel = await renderPanel({ snapshot: pending, sections });
      const { container } = panel;
      if (!visible.length) return expect(container.innerHTML).to.eql('');
      expect(framing(container)).to.eql(visible.join(' | '));
      const count = (selector: string) => container.querySelectorAll(selector).length;
      expect(count('[data-passkey-title-spinner]')).to.eql(1);
      expect(count('[role="progressbar"]')).to.eql(sections.status ? 0 : 1);
      expect(count('[data-spinner-slot]')).to.eql(sections.status ? 1 : 0);
      for (const divider of container.querySelectorAll('[data-passkey-divider]')) {
        expect(divider.getAttribute('aria-hidden')).to.eql('true');
      }
    });
  }

  it('view selects a framed panel or standalone section; only panel honors sections', async () => {
    const props = { snapshot: pending, sections: { context: false }, style: { padding: 7 } };
    using panel = await renderPanel(props);
    const { container } = panel;
    const cases = [
      ['panel', 'actions | status', true, false, true],
      ['actions', 'actions', true, true, false],
      ['status', 'status', false, false, true],
      ['context', 'context', false, false, false],
    ] as const;
    for (const [view, expected, framed, titleProgress, statusProgress] of cases) {
      panel.update({ ...props, view });
      expect(framing(container)).to.eql(expected);
      expect(!!container.querySelector('[data-passkey-title-spinner]')).to.eql(framed);
      expect(!!container.querySelector('[role="progressbar"]')).to.eql(titleProgress);
      expect(!!container.querySelector('[data-spinner-slot]')).to.eql(statusProgress);
      expect(cssOf(container.firstElementChild!).padding).to.eql('7px');
    }
  });

  it('registration note → stays mounted at a fixed panel height across account operations', async () => {
    const context = { ...signedOut.context, registrationAdvisory: 'Use a test passkey.' };
    const out = { ...signedOut, context };
    const props = { snapshot: out, onCreateAccount: () => {}, onAddPasskey: () => {} };
    using panel = await renderPanel(props);
    const note = () => panel.container.querySelector<HTMLElement>('[role="note"][id]');
    const tracks = () => {
      const grid = panel.container.querySelector(`${section('status')} > div`);
      return grid && (cssOf(grid).gridTemplateRows || 'none');
    };
    const original = element(panel.container, '[role="note"][id]');
    const body = original.previousElementSibling!;
    const height = cssOf(body).height;
    const margin = cssOf(original).marginTop;
    expect(height).to.match(/^[\d.]+(?:px|rem)$/);
    expect(cssOf(body).overflowY).to.eql('auto');
    const transitions = [
      { ...out, operation: pending.operation },
      { ...out, authentication: { kind: 'checking' }, operation: { kind: 'checking' } },
      { ...out, authentication: { kind: 'unknown', summary: 'Session unknown' } },
      { ...signedIn, context },
      out,
    ] satisfies t.Passkey.Snapshot[];
    for (const snapshot of transitions) {
      panel.update({ ...props, snapshot });
      expect(note()).to.equal(original);
      expect(original.previousElementSibling).to.equal(body);
      expect(cssOf(body).height).to.eql(height);
      expect(cssOf(original).marginTop).to.eql(margin);
    }
    expect(tracks()).to.eql('repeat(4, auto) 1lh 1lh');
    panel.update({ ...props, snapshot: { ...signedIn, context } });
    expect(tracks()).to.eql('none');
    expect(valueCell(panel.container, 'Account label').textContent).to.eql('Test account');
    panel.update({ ...props, view: 'actions' });
    expect(note()?.previousElementSibling?.contains(element(panel.container, section('actions'))))
      .to.eql(true);
    expect(tracks()).to.eql(null);
    panel.update({ ...props, view: 'actions', snapshot: { ...out, operation: pending.operation } });
    expect(note()).to.equal(original);

    const withoutNote: t.Passkey.Props[] = [
      { ...props, snapshot: signedOut },
      { ...props, sections: { actions: false } },
      { ...props, view: 'status' },
      { ...props, view: 'context' },
    ];
    for (const next of withoutNote) {
      panel.update(next);
      expect(note()).to.eql(null);
      expect(tracks() ?? 'none').to.eql('none');
      const { height, minHeight, overflowY } = cssOf(panel.container.firstElementChild!);
      expect([height || 'auto', minHeight || 'auto', overflowY || 'visible']).to.eql([
        'auto',
        'auto',
        'visible',
      ]);
    }
  });

  it('omitted sections default on; empty Actions leave no title or divider', async () => {
    using panel = await renderPanel({ snapshot: signedOut });
    expect(framing(panel.container)).to.eql('actions | status | context');
    const states = [{ kind: 'checking' }, { kind: 'unknown', summary: 'Failed' }] as const;
    for (const authentication of states) {
      const snapshot = { ...signedOut, authentication };
      panel.update({ snapshot });
      expect(framing(panel.container)).to.eql('status | context');
      panel.update({ snapshot, sections: { status: false, context: false } });
      expect(panel.container.innerHTML).to.eql('');
      using bare = await TestReact.render(<Passkey.UI.Actions {...snapshot} />);
      expect(bare.container.innerHTML).to.eql('');
    }
  });

  it('hide Status during work → title takes over without moving focus or reallocating its slot', async () => {
    const props = { onSignIn: () => {}, sections: { status: false } };
    using panel = await renderPanel({ ...props, snapshot: signedOut });
    const slot = element(panel.container, '[data-passkey-title-spinner]');
    const signIn = actionButton(panel.container, 'sign-in');
    const context = element(panel.container, section('context'));
    React.act(() => signIn.focus());
    const transitions = [
      [signedOut, false, false],
      [pending, false, true],
      [pending, true, false],
      [pending, false, true],
      [signedOut, false, false],
    ] as const;
    for (const [snapshot, status, busy] of transitions) {
      panel.update({ ...props, snapshot, sections: { status } });
      expect(element(panel.container, '[data-passkey-title-spinner]')).to.equal(slot);
      expect([slot.getAttribute('role'), slot.getAttribute('aria-label')]).to.eql(
        busy ? ['progressbar', 'Passkey operation in progress'] : [null, null],
      );
      expect(slot.hasAttribute('aria-valuenow')).to.eql(false);
      expect(slot.hasAttribute('tabindex')).to.eql(false);
      expect([cssOf(slot).width, cssOf(slot).height]).to.eql(['24px', '3px']);
      expect(actionButton(panel.container, 'sign-in')).to.equal(signIn);
      expect(document.activeElement).to.equal(signIn);
      expect(element(panel.container, section('context'))).to.equal(context);
    }
  });

  it('hide either sibling → Status keeps both announcement nodes and its spinner slot', async () => {
    using panel = await renderPanel({ snapshot: signedOut });
    const selectors = [
      section('status'),
      '[aria-label="Operation"]',
      '[aria-label="Last result"]',
      '[data-spinner-slot]',
    ];
    const nodes = () => selectors.map((selector) => element(panel.container, selector));
    const original = nodes();
    const transitions: t.Passkey.Props[] = [
      { snapshot: pending, sections: { context: false } },
      { snapshot: { ...signedOut, authentication: { kind: 'checking' } } },
      { snapshot: signedOut, sections: { actions: false } },
      { snapshot: signedOut },
    ];
    for (const props of transitions) {
      panel.update(props);
      nodes().forEach((node, i) => expect(node).to.equal(original[i]));
    }
  });

  it('bare sections → caller styling and independent content, no aggregate frame', async () => {
    const { authentication, operation } = signedIn;
    for (const theme of ['Light', 'Dark'] as const) {
      const props = { theme, style: { padding: 7 } };
      using res = await TestReact.render(
        <>
          <Passkey.UI.Actions {...signedOut} {...props} />
          <Passkey.UI.Status authentication={authentication} operation={operation} {...props} />
          <Passkey.UI.Context context={signedOut.context} {...props} />
        </>,
      );
      expect(framing(res.container)).to.eql('actions status context');
      expect(res.container.querySelector('[data-passkey-title-spinner]')).to.eql(null);
      expectActions(res.container, 'sign-in', 'create-account');
      expect(element(res.container, section('status')).textContent).to.include('principal-test-01');
      expect(element(res.container, section('context')).textContent).to.include('Context');
      for (const name of names) {
        const root = element(res.container, section(name));
        expect(cssOf(root).padding).to.eql('7px');
        expect(Color.toHex(cssOf(root).color)).to.eql(Color.toHex(Color.theme(theme).fg));
      }
    }
  });

  for (const action of ['create-account', 'sign-in', 'add-passkey', 'sign-out'] as const) {
    it(`pending ${action} → bare Actions exposes no progress and admits no intent`, async () => {
      const out = action === 'create-account' || action === 'sign-in';
      let calls = 0;
      const record = () => calls++;
      const callbacks = {
        onCreateAccount: record,
        onSignIn: record,
        onAddPasskey: record,
        onSignOut: record,
      };
      const snapshot = out ? signedOut : signedIn;
      const operation = { kind: 'pending', action, phase: 'Waiting' } as const;
      using res = await TestReact.render(
        <Passkey.UI.Actions {...snapshot} {...callbacks} operation={operation} />,
      );
      if (out) expectActions(res.container, 'sign-in', 'create-account');
      else expectActions(res.container, 'add-passkey', 'sign-out');
      const progress = '[role="progressbar"], [data-spinner-slot], [role="status"]';
      expect(res.container.querySelector(progress)).to.eql(null);
      expect(res.container.textContent).not.to.include('Waiting');
      for (const el of buttons(res.container)) {
        expect(el.getAttribute('aria-disabled')).to.eql('true');
        expect(el.tabIndex).to.eql(-1);
        press(el, 'Enter');
        press(el, ' ');
        React.act(() => DomMock.Mouse.activate(el));
      }
      expect(calls).to.eql(0);
    });
  }

  for (const theme of ['Light', 'Dark'] as const) {
    it(`${theme} → only a signed-in session selects the decorative green cue`, async () => {
      using panel = await renderPanel({ snapshot: signedOut, theme });
      const neutral = Color.theme(theme).bg;
      const success = { kind: 'success', action: 'create-account', summary: 'Registered' } as const;
      const failure = { kind: 'failure', action: 'add-passkey', summary: 'Failed' } as const;
      const unknown = { kind: 'unknown', summary: 'Failed' } as const;
      const adding = { kind: 'pending', action: 'add-passkey', phase: 'Waiting' } as const;
      const cases = [
        [{ ...signedOut, result: success }, 'Signed out', neutral],
        [{ ...signedOut, authentication: { kind: 'checking' } }, 'Checking session', neutral],
        [{ ...signedOut, authentication: unknown }, '⚠ Unknown: Failed', neutral],
        [{ ...signedIn, result: failure }, 'Signed in', Color.GREEN],
        [{ ...signedIn, operation: adding }, 'Signed in', Color.GREEN],
      ] as const;
      for (const [snapshot, text, color] of cases) {
        panel.update({ snapshot, theme });
        const cell = valueCell(panel.container, 'Authentication');
        expect(cell.textContent).to.eql(text);
        const bullet = cell.querySelector<HTMLElement>('[aria-hidden="true"] :empty')!;
        expect(Color.toHex(cssOf(bullet).backgroundColor)).to.eql(Color.toHex(color));
        expect(cell.querySelector('[tabindex], button, a')).to.eql(null);
      }
    });
  }

  it('Last result → emphasis follows the outcome, never the summary text', async () => {
    using panel = await renderPanel({ snapshot: signedOut });
    const node = element(panel.container, '[role="status"][aria-label="Last result"]');
    const cases = [
      [{ kind: 'success' }, 'info'],
      [{ kind: 'failure' }, 'error'],
      [{ kind: 'indeterminate' }, 'warn'],
      [{ kind: 'not-submitted', reason: 'cancelled' }, 'info'],
      [{ kind: 'not-submitted', reason: 'unavailable' }, 'info'],
      [{ kind: 'not-submitted', reason: 'invalid-input' }, 'warn'],
    ] as const;
    for (const [outcome, level] of cases) {
      const result = { action: 'sign-in' as const, summary: 'Same summary', ...outcome };
      panel.update({ snapshot: { ...signedOut, result } });
      expect(node.getAttribute('data-level')).to.eql(level);
      const style = cssOf(node);
      expect(Number(style.opacity || 1)).to.eql(level === 'info' ? 0.5 : 1);
      expect(style.fontStyle || 'normal').to.eql(level === 'info' ? 'italic' : 'normal');
      expect(style.getPropertyValue('padding-inline-end') || '0px').to.eql(
        level === 'info' ? '2px' : '0px',
      );
      expect(style.getPropertyValue('text-wrap')).to.eql('pretty');
    }
  });

  it('only the configured Origin value links; other identifiers remain selectable text', async () => {
    const principal = 'https://identity.example.test/<principal>';
    const origin = `https://${'long-origin-'.repeat(20)}.test`;
    const w3c = 'https://www.w3.org/TR/webauthn-3/#';
    const context: t.Passkey.Context = {
      origin,
      rpId: '-',
      rpName: 'Example service',
      webAuthn: { kind: 'unknown', reason: 'Not checked' },
      verifier: { kind: 'unavailable', reason: 'Offline' },
    };
    const authentication = { ...signedIn.authentication, principal, credentialCount: 2 };
    using panel = await renderPanel({ snapshot: { ...signedIn, context, authentication } });
    const links = [...panel.container.querySelectorAll('a')];
    expect(links.map((a) => [a.textContent, a.href])).to.eql([
      ['Principal', 'https://www.rfc-editor.org/rfc/rfc4949.html#page-232'],
      ['Registered credentials', `${w3c}credential-record`],
      ['Origin', `${w3c}sctn-validating-origin`],
      ['Relying Party ID', `${w3c}relying-party-identifier`],
      ['Relying Party Name', `${w3c}dom-publickeycredentialentity-name`],
      ['WebAuthn', `${w3c}sctn-api`],
    ]);
    for (const link of links) {
      expect(link.target).to.eql('_blank');
      expect(link.rel.split(' ').sort()).to.eql(['noopener', 'noreferrer']);
    }
    expect(valueCell(panel.container, 'Principal').textContent).to.eql(principal);
    const values = [
      ['Origin', origin],
      ['Relying Party ID', '-'],
      ['Relying Party Name', 'Example service'],
      ['WebAuthn', 'Unknown: Not checked'],
      ['Account service', 'Unavailable: Offline'],
    ];
    for (const [label, text] of values) {
      const cell = valueCell(panel.container, label);
      expect(cell.textContent).to.eql(text);
      expect(cssOf(cell).userSelect).to.eql('text');
      const style = cssOf(cell.firstElementChild!);
      expect(style.overflowWrap).to.eql('anywhere');
      expect(style.whiteSpace).to.eql('normal');
      expect(style.fontFamily).to.eql('sans-serif');
    }
    const showOrigin = (origin?: string) => {
      panel.update({ snapshot: { ...signedOut, context: { ...signedOut.context, origin } } });
      return valueCell(panel.container, 'Origin');
    };
    const cell = showOrigin(browserOrigin);
    const link = cell.querySelector('a')!;
    expect([link.getAttribute('href'), link.target]).to.eql([browserOrigin, '_blank']);
    expect(link.rel.split(' ').sort()).to.eql(['noopener', 'noreferrer']);
    expect(cssOf(link).fontFamily).to.eql('sans-serif');
    expect(showOrigin(`${browserOrigin}.example.test`).querySelector('a')).to.eql(null);
    const missing = showOrigin();
    expect(missing.textContent).to.eql('Unknown');
    expect(cssOf(missing.firstElementChild!).fontFamily).to.eql('sans-serif');
    expect(panel.container.querySelector('a[href$="#credential-record"]')).to.eql(null);
  });
});
