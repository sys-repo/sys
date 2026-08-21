import { describe, expect, it } from '../../../-test.ts';
import { Cli } from '../../m.Cli/mod.ts';

const redrawExact = {
  key: 'r',
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  shiftKey: false,
} as const;
const redrawRejected = [
  { ...redrawExact, key: 'R' },
  { ...redrawExact, key: 'x' },
  { ...redrawExact, ctrlKey: true },
  { ...redrawExact, altKey: true },
  { ...redrawExact, metaKey: true },
  { ...redrawExact, shiftKey: true },
];
const redrawIncomplete = [
  { ctrlKey: false, altKey: false, metaKey: false, shiftKey: false },
  { key: 'r', altKey: false, metaKey: false, shiftKey: false },
  { key: 'r', ctrlKey: false, metaKey: false, shiftKey: false },
  { key: 'r', ctrlKey: false, altKey: false, shiftKey: false },
  { key: 'r', ctrlKey: false, altKey: false, metaKey: false },
];

describe('Cli.Keyboard.Is', () => {
  it('recognizes canonical quit controls', () => {
    expect(Cli.Keyboard.Is.quit({ key: 'q', ctrlKey: false })).to.eql(true);
    expect(Cli.Keyboard.Is.quit({ key: 'Q', ctrlKey: false })).to.eql(true);
    expect(Cli.Keyboard.Is.quit({ key: 'c', ctrlKey: true })).to.eql(true);
    expect(Cli.Keyboard.Is.quit({ key: 'c', ctrlKey: false })).to.eql(false);
  });

  it('admits only unmodified lowercase r for redraw', () => {
    expect(Cli.Keyboard.Is.redraw(redrawExact)).to.eql(true);
    for (const event of redrawRejected) expect(Cli.Keyboard.Is.redraw(event)).to.eql(false);
  });

  it('rejects every missing key or modifier field for redraw', () => {
    for (const event of redrawIncomplete) expect(Cli.Keyboard.Is.redraw(event)).to.eql(false);
  });

  it('recognizes native terminal-unavailability errors', () => {
    expect(Cli.Keyboard.Is.unavailableError(new Deno.errors.BadResource('closed keyboard'))).to.eql(
      true,
    );
    expect(Cli.Keyboard.Is.unavailableError(new Error('ENOTTY'))).to.eql(true);
    expect(Cli.Keyboard.Is.unavailableError(new Error('No such device'))).to.eql(true);
    expect(Cli.Keyboard.Is.unavailableError(new Error('other failure'))).to.eql(false);
  });

  it('rejects hostile errors without invoking accessors or Proxy traps', () => {
    let trapCalls = 0;
    const native = new Error('ENOTTY');
    Object.defineProperty(native, 'message', {
      configurable: true,
      get() {
        trapCalls += 1;
        throw new Error('message trap');
      },
    });
    const proxy = new Proxy({}, {
      getPrototypeOf() {
        trapCalls += 1;
        throw new Error('proxy trap');
      },
    });
    const revoked = Proxy.revocable({}, {});
    revoked.revoke();

    expect(Cli.Keyboard.Is.unavailableError(native)).to.eql(false);
    expect(Cli.Keyboard.Is.unavailableError(proxy)).to.eql(false);
    expect(Cli.Keyboard.Is.unavailableError(revoked.proxy)).to.eql(false);
    expect(trapCalls).to.eql(0);
  });
});
