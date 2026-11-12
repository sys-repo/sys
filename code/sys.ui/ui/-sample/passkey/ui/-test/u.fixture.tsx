import React from 'react';
import { DomMock, Is, type t, TestReact } from './common.ts';
import { Passkey } from '../mod.ts';

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

export const signedIn: t.Passkey.Snapshot = {
  ...signedOut,
  authentication: { kind: 'signed-in', principal: 'principal-test-01' },
};

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
    dispose: () => React.act(() => res.dispose()),
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

export function buttons(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[role="button"]'));
}

/** Find authored text without depending on generated classes or wrapper depth. */
export function textElement(container: HTMLElement, text: string): HTMLElement {
  const el = [...container.querySelectorAll<HTMLElement>('div')].find((el) =>
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

export function press(el: HTMLElement, key: string) {
  React.act(() => {
    el.focus();
    for (const type of ['keydown', 'keyup'] as const) {
      el.dispatchEvent(DomMock.Keyboard.event(type, key, { bubbles: true, cancelable: true }));
    }
  });
}
