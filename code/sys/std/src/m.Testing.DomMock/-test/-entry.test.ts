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

describe('DomMock public entry', () => {
  it('import → leaves DOM globals unchanged', async () => {
    const before = snapshotDomGlobals();
    const { DomMock } = await import('@sys/std/testing/server/dom');
    const target = new EventTarget();
    const point = DomMock.Touch.point({ identifier: 1, target });

    expect(snapshotDomGlobals()).to.eql(before);
    expect(Object.isFrozen(DomMock)).to.eql(true);
    expect(Object.isFrozen(DomMock.Touch)).to.eql(true);
    expect(point.target).to.equal(target);
  });
});
