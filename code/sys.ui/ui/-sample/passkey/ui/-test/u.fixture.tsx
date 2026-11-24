import React from 'react';
import { DomMock, expect, Is, Schedule, type t, TestReact, WebFixture } from './common.ts';
import { Passkey } from '../mod.ts';
import { actionLabel } from '../u.actions.ts';

/** Observe page-lifetime listener identity without replacing event delivery. */
export function pageListeners() {
  const page: EventTarget = window;
  const add = page.addEventListener.bind(page);
  const remove = page.removeEventListener.bind(page);
  const acquired: string[] = [];
  const attached = new Map<EventListenerOrEventListenerObject | null, string>();
  const on = (...[type, listener, options]: Parameters<typeof add>) => {
    if (type === 'pagehide' || type === 'pageshow') {
      acquired.push(type);
      attached.set(listener, type);
    }
    add(type, listener, options);
  };
  const off = (...[type, listener, options]: Parameters<typeof remove>) => {
    if (attached.get(listener) === type) attached.delete(listener);
    remove(type, listener, options);
  };
  const mock = WebFixture.Property.mock([
    { target: window, key: 'addEventListener', descriptor: { value: on } },
    { target: window, key: 'removeEventListener', descriptor: { value: off } },
  ]);
  return { acquired, attached, [Symbol.dispose]: () => mock.dispose() };
}

/** Test-owned observations, independent of the interactive harness fixtures. */
export const signedOut: t.Passkey.Snapshot = {
  authentication: { kind: 'signed-out' },
  operation: { kind: 'idle' },
  context: {
    origin: 'https://app.example.test',
    rpId: 'example.test',
    webAuthn: { kind: 'available' },
    verifier: { kind: 'available' },
  },
};

export const signedIn = {
  ...signedOut,
  authentication: { kind: 'signed-in', principal: 'principal-test-01', label: 'Test account' },
} satisfies t.Passkey.Snapshot;

export async function renderPanel(props: t.Passkey.Props) {
  let update!: (props: t.Passkey.Props) => void;
  function Host() {
    const [value, setValue] = React.useState(props);
    update = setValue;
    return <Passkey.UI {...value} />;
  }
  const res = await TestReact.render(<Host />);
  return {
    container: res.container,
    update: (props: t.Passkey.Props) => React.act(() => update(props)),
    dispose: () => res.dispose(),
    [Symbol.dispose]: () => res.dispose(),
  };
}

export function element(container: HTMLElement, selector: string): HTMLElement {
  const el = container.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
}

export function button(container: HTMLElement, label: string): HTMLElement {
  const el = buttons(container).find((el) => el.textContent === label);
  if (!el) throw new Error(`Missing action: ${label}`);
  return el;
}

/** Assert the complete set and order, including the absence of unexpected controls. */
export function expectActions(container: HTMLElement, ...actions: t.Passkey.Action[]) {
  expect(buttons(container).map((el) => el.textContent)).to.eql(actions.map(actionLabel));
}

/** Resolve an intent through its rendered button, not through a direct callback or test-only ID. */
export function actionButton(container: HTMLElement, action: t.Passkey.Action): HTMLElement {
  const section = element(container, '[data-passkey-section="actions"]');
  const label = actionLabel(action);
  const matches = buttons(section).filter((el) => el.textContent === label);
  if (matches.length !== 1) {
    throw new Error(`Expected one ${action} button; found ${matches.length}`);
  }
  return matches[0];
}

export function buttons(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[role="button"]'));
}

/** Find a text leaf without depending on its tag, generated classes or wrapper depth. */
export function textElement(container: HTMLElement, text: string): HTMLElement {
  const el = [...container.querySelectorAll<HTMLElement>('*')].find((el) =>
    el.childElementCount === 0 && el.textContent === text
  );
  if (Is.nil(el)) throw new Error(`Missing text: ${text}`);
  return el;
}

/** A plain or linked KeyValue key and its adjacent value cell. */
export function valueCell(container: HTMLElement, label: string): Element {
  const anchor = [...container.querySelectorAll<HTMLAnchorElement>('a')].find((el) =>
    el.textContent === label
  );
  const key = anchor ? anchor.parentElement : textElement(container, label);
  const value = key?.nextElementSibling;
  if (Is.nil(value)) throw new Error(`Missing value for: ${label}`);
  return value;
}

/** Activate with the keyboard and flush the async account notification into React. */
export function activate(el: HTMLElement) {
  return React.act(async () => {
    press(el, 'Enter');
    await Schedule.micro();
  });
}

/** Drive the integration specimen through its rendered controls, not the runtime. */
export async function exerciseAccountFlow(container: HTMLElement) {
  const value = (label: string) => valueCell(container, label).textContent;
  const choose = (action: t.Passkey.Action) => activate(actionButton(container, action));
  expect(value('Authentication')).to.eql('Signed out');
  expect(value('Account service')).to.eql('Configured');
  await choose('create-account');
  expect(value('Account label')).to.eql('Test account');
  expect(value('Principal')).to.eql('principal');
  expect(value('Registered credentials')).to.eql('1');
  await choose('sign-out');
  expect(value('Authentication')).to.eql('Signed out');
  expect(container.textContent).not.to.contain('Account label');
  await choose('sign-in');
  expect(value('Account label')).to.eql('Test account');
  expect(value('Principal')).to.eql('principal');
  await choose('add-passkey');
  expect(value('Principal')).to.eql('principal');
  expect(value('Registered credentials')).to.eql('2');
  expect(value('Last result')).to.contain('Accepted by the account service');
}

export function press(el: HTMLElement, key: string) {
  React.act(() => {
    el.focus();
    for (const type of ['keydown', 'keyup'] as const) {
      el.dispatchEvent(DomMock.Keyboard.event(type, key, { bubbles: true, cancelable: true }));
    }
  });
}
