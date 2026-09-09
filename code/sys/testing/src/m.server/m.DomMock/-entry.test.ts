import { describe, expect, it } from '@sys/std/testing';

// DomMock's process-global lifecycle owns these exact bindings.
const domGlobalKeys = [
  'window',
  'document',
  'MediaStream',
  'MediaStreamTrack',
  'HTMLElement',
  'self',
  '__SYS_BROWSER_MOCK__',
] as const;

const snapshotDomGlobals = () =>
  Object.fromEntries(
    domGlobalKeys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  );

describe('Server DOM mock public entry', () => {
  it('import → leaves DOM globals unchanged', async () => {
    const before = snapshotDomGlobals();
    const entry = await import('@sys/testing/server/dom');

    expect(snapshotDomGlobals()).to.eql(before);
    expect(Object.isFrozen(entry.DomMock)).to.eql(true);
  });
});
