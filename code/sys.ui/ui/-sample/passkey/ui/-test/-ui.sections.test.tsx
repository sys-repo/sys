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
  press,
  renderPanel,
  signedIn,
  signedOut,
  textWithoutHidden,
  valueCell,
} from './u.fixture.tsx';

const countLabels = ['Total accounts', 'Total passkeys', 'Total sessions'];

const pending: t.Passkey.Snapshot = {
  ...signedOut,
  operation: { kind: 'pending', action: 'sign-in', phase: 'Waiting' },
};

/** Sections and the separators between them, not the KeyValue markup inside a section. */
function framing(container: HTMLElement) {
  return [...container.querySelectorAll('[data-passkey-section], [data-passkey-divider]')]
    .map((el) => el.getAttribute('data-passkey-section') ?? '|').join(' ');
}

describe('Passkey diagnostic sections', () => {
  DomMock.init({ beforeAll, afterAll });

  it('panel composes visible sections; standalone views ignore panel visibility', async () => {
    using panel = await renderPanel({ snapshot: signedOut });
    expect(framing(panel.container)).to.eql('actions | status | context');
    const sections = { actions: false, status: false, context: false };
    panel.update({ snapshot: signedOut, sections });
    expect(panel.container.firstChild).to.eql(null);
    for (const view of ['actions', 'status', 'context'] as const) {
      panel.update({ snapshot: pending, view, sections });
      expect(framing(panel.container)).to.eql(view);
      expect(!!panel.container.querySelector('[role="progressbar"]')).to.eql(view === 'actions');
    }
    panel.update({ snapshot: { ...signedOut, authentication: { kind: 'checking' } } });
    expect(framing(panel.container)).to.eql('status | context');
  });

  it('note-bearing panel and Actions → no clipping rule on the action frame', async () => {
    const context = { ...signedOut.context, registrationAdvisory: 'Use a test passkey.' };
    const snapshot = { ...signedOut, context };
    using panel = await renderPanel({ snapshot });
    for (const view of ['panel', 'actions'] as const) {
      panel.update({ snapshot, view });
      element(panel.container, '[role="note"]');
      const actions = element(panel.container, '[data-passkey-section="actions"]');
      const frame = actions.parentElement!;
      const { overflow, overflowX, overflowY } = frame.ownerDocument.defaultView!
        .getComputedStyle(frame);
      for (const rule of [overflow, overflowX, overflowY]) {
        expect(rule || 'visible').to.eql('visible');
      }
    }
  });

  it('hide Status during work → progress moves to the title without taking focus', async () => {
    const props = { snapshot: pending, onSignIn: () => {} };
    using panel = await renderPanel({ ...props, snapshot: signedOut });
    const { container } = panel;
    const signIn = actionButton(container, 'sign-in');
    React.act(() => signIn.focus());
    panel.update({ ...props, sections: { status: false } });
    expect(framing(container)).to.eql('actions | context');
    const bar = element(container, '[role="progressbar"]');
    expect(bar.getAttribute('aria-label')).to.eql('Passkey operation in progress');
    expect(bar.hasAttribute('aria-valuenow')).to.eql(false);
    expect(document.activeElement).to.equal(signIn);
    panel.update(props);
    expect(document.activeElement).to.equal(signIn);
    expect(container.querySelector('[role="progressbar"]')).to.eql(null);
    const op = element(container, '[aria-label="Operation"]');
    const result = element(container, '[aria-label="Last result"]');
    expect(op.textContent).to.include('Waiting');
    panel.update({ ...props, sections: { actions: false, context: false } });
    expect(element(container, '[aria-label="Operation"]')).to.equal(op);
    expect(element(container, '[aria-label="Last result"]')).to.equal(result);
  });

  it('bare pending Actions → no progress announcement or actionable intent', async () => {
    let calls = 0;
    const record = () => calls++;
    using res = await TestReact.render(
      <Passkey.UI.Actions {...pending} onSignIn={record} onCreateAccount={record} />,
    );
    const controls = buttons(res.container);
    expect(controls.map((el) => el.textContent)).to.have.members(['Sign In', 'Create Passkey']);
    expect(res.container.querySelector('[role="progressbar"], [role="status"]')).to.eql(null);
    for (const el of controls) {
      expect(el.getAttribute('aria-disabled')).to.eql('true');
      press(el, 'Enter');
      React.act(() => DomMock.Mouse.activate(el));
    }
    expect(calls).to.eql(0);
  });

  it('Context and service headings can be replaced or omitted without hiding their data', async () => {
    const counts = { accounts: 2, registeredPasskeys: 3, validSessions: 1 };
    const observation = { kind: 'observed', counts } as const;
    const titles = [
      [undefined, undefined],
      ['Environment', null],
      [' ', 'Totals'],
    ] as const;
    for (const [title, serviceTitle] of titles) {
      const serviceProps = { observation, title: serviceTitle };
      using res = await TestReact.render(
        <Passkey.UI.Context context={signedOut.context} title={title} service={serviceProps} />,
      );
      const { container } = res;
      const service = element(container, '[data-passkey-service]');
      expect(container.textContent?.includes('Context')).to.eql(title === undefined);
      expect(service.textContent?.includes('Account Service')).to.eql(serviceTitle === undefined);
      expect(container.textContent?.includes('Environment')).to.eql(title === 'Environment');
      expect(service.textContent?.includes('Totals')).to.eql(serviceTitle === 'Totals');
      const memory = service.querySelector('[role="img"][aria-label="Service: In memory storage"]');
      expect(!!memory).to.eql(serviceTitle !== null);
      expect(valueCell(container, 'Origin').textContent).to.eql(signedOut.context.origin);
      expect(countLabels.map((k) => valueCell(service, k).textContent)).to.eql(['2', '3', '1']);
    }
  });

  it('Account Service status can change while counts and sign-in stay unchanged', async () => {
    const snapshot = signedOut;
    const observation = { kind: 'failed' } as const;
    const states = ['unknown', 'available', 'unavailable'] as const;
    using panel = await renderPanel({ snapshot });
    const selector = '[data-passkey-service] [role="img"][aria-label^="Accounts API:"]';
    for (const availability of states) {
      const label = `Accounts API: ${availability}`;
      panel.update({ snapshot, service: { observation, availability } });
      const cue = element(panel.container, selector);
      expect(cue.title).to.eql(label);
      expect(cue.getAttribute('aria-label')).to.eql(label);
    }
    panel.update({ snapshot, service: { observation: { kind: 'failed' }, title: null } });
    expect(panel.container.querySelector(selector)).to.eql(null);
  });

  it('failed service observation → linked labels, dashed totals, and unchanged sign-in', async () => {
    const service = { observation: { kind: 'failed' } } as const;
    using res = await renderPanel({ snapshot: signedIn, service });
    const block = element(res.container, '[data-passkey-service]');
    expect(textWithoutHidden(block).trim()).to.match(
      /^Account Service\s*Total accounts\s*-\s*Total passkeys\s*-\s*Total sessions\s*-$/,
    );
    const links = [...block.querySelectorAll('a')];
    expect(links.map((link) => [link.textContent, link.href])).to.eql([
      ['accounts', 'https://www.w3.org/TR/webauthn-3/#user-account'],
      ['passkeys', 'https://www.w3.org/TR/webauthn-3/#passkey'],
      ['sessions', 'https://pages.nist.gov/800-63-4/sp800-63b/session/#sessmgmt'],
    ]);
    expect(links.map((link) => link.target)).to.eql(['_blank', '_blank', '_blank']);
    expect(valueCell(res.container, 'Authentication').textContent).to.eql('Signed in');
    expect(valueCell(res.container, 'Last result').textContent).to.eql('-');
  });

  it('authentication cue follows the session even when the action outcome suggests otherwise', async () => {
    using panel = await renderPanel({ snapshot: signedOut });
    const accepted = { kind: 'success', action: 'create-account', summary: 'Accepted' } as const;
    const refused = { kind: 'failure', action: 'add-passkey', summary: 'Refused' } as const;
    const cases = [
      [signedOut, accepted, Color.theme('Light').bg],
      [signedIn, refused, Color.GREEN],
    ] as const;
    for (const [snapshot, result, color] of cases) {
      panel.update({ theme: 'Light', snapshot: { ...snapshot, result } });
      const cell = valueCell(panel.container, 'Authentication');
      const cue = cell.querySelector<HTMLElement>('[aria-hidden="true"] :empty')!;
      const { backgroundColor } = cue.ownerDocument.defaultView!.getComputedStyle(cue);
      expect(Color.toHex(backgroundColor)).to.eql(Color.toHex(color));
    }
  });

  it('Last result → emphasis follows the outcome, not the summary', async () => {
    using panel = await renderPanel({ snapshot: signedOut });
    const cases = [
      [{ kind: 'success' }, 'info'],
      [{ kind: 'failure' }, 'error'],
      [{ kind: 'indeterminate' }, 'warn'],
      [{ kind: 'not-submitted', reason: 'cancelled' }, 'info'],
      [{ kind: 'not-submitted', reason: 'invalid-input' }, 'warn'],
    ] as const;
    for (const [outcome, level] of cases) {
      const result = { ...outcome, action: 'sign-in' as const, summary: 'Same summary' };
      panel.update({ snapshot: { ...signedOut, result } });
      const node = element(panel.container, '[aria-label="Last result"]');
      expect(node.getAttribute('data-level')).to.eql(level);
    }
  });

  it('renderer owns link destinations → only the exact configured Origin value becomes a link', async () => {
    const origin = `${browserOrigin}.example.test`;
    const principal = 'https://identity.example.test/<principal>';
    const authentication = { ...signedIn.authentication, principal, credentialCount: 2 };
    const context = { ...signedOut.context, origin };
    using panel = await renderPanel({ snapshot: { ...signedIn, context, authentication } });
    const { container } = panel;
    const w3c = 'https://www.w3.org/TR/webauthn-3/#';
    const links = [...container.querySelectorAll('a')];
    expect(Object.fromEntries(links.map((link) => [link.textContent, link.href]))).to.eql({
      Principal: 'https://www.rfc-editor.org/rfc/rfc4949.html#page-232',
      'Registered credentials': `${w3c}credential-record`,
      Origin: `${w3c}sctn-validating-origin`,
      'Relying Party': `${w3c}dom-publickeycredentialentity-name`,
      'Relying Party ID': `${w3c}relying-party-identifier`,
      WebAuthn: `${w3c}sctn-api`,
    });
    const contextLinks = container.querySelectorAll('[data-passkey-section="context"] a');
    expect([...contextLinks].map((link) => link.textContent)).to.eql([
      'Origin',
      'Relying Party',
      'Relying Party ID',
      'WebAuthn',
    ]);
    expect(valueCell(container, 'Principal').textContent).to.eql(principal);
    const supplied = valueCell(container, 'Origin');
    expect(supplied.textContent).to.eql(origin);
    const style = supplied.ownerDocument.defaultView!.getComputedStyle(supplied);
    expect(style.userSelect).to.eql('text');
    panel.update({ snapshot: { ...signedOut, context: { ...context, origin: browserOrigin } } });
    const link = valueCell(container, 'Origin').querySelector('a')!;
    expect([link.href, link.target]).to.eql([new URL(browserOrigin).href, '_blank']);
    expect(link.rel.split(' ')).to.include.members(['noopener', 'noreferrer']);
  });
});
