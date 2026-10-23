import { Document, Window } from 'happy-dom';
import { afterEach, describe, expect, expectError, it, Time } from '../../-test.ts';
import { Is } from '../../m.Is/mod.ts';
import { DomMock } from '../mod.ts';

describe('DomMock.polyfill', () => {
  afterEach(DomMock.unpolyfill);

  it('polyfill', () => {
    expect((globalThis as any).window).to.eql(undefined);
    expect((globalThis as any).document).to.eql(undefined);

    DomMock.polyfill();

    expect((globalThis as any).window).to.be.instanceof(Window);
    expect((globalThis as any).document).to.be.instanceof(Document);
    expect((globalThis as any).window).to.equal((globalThis as any).window);
    expect((globalThis as any).window.location.host).to.eql('localhost:1234');

    const before = (globalThis as any).window;
    DomMock.polyfill();
    DomMock.polyfill();
    expect((globalThis as any).window).to.equal(before); // NB: instance re-used.
  });

  it('polyfill: custom URL', () => {
    const url = 'https://foo.com/bar?a=123';
    DomMock.polyfill({ url });
    expect((globalThis as any).window.location.href).to.eql(url);
  });

  it('unpolyfill', async () => {
    DomMock.polyfill();
    const before = (globalThis as any).window;
    expect(before).to.be.instanceof(Window);

    await DomMock.unpolyfill();
    expect((globalThis as any).window).to.eql(undefined);
    expect((globalThis as any).document).to.eql(undefined);

    DomMock.polyfill();
    expect((globalThis as any).window).to.not.equal(before); // NB: instance reset.
  });

  it('unpolyfill closes every tracked HappyDOM window', async () => {
    DomMock.polyfill();
    const first = (globalThis as any).window as Window;
    first.setTimeout(() => undefined, 60_000);

    DomMock.polyfill({ url: 'https://example.com/' });
    const second = (globalThis as any).window as Window;
    second.setTimeout(() => undefined, 60_000);

    expect(second).to.not.equal(first);
    await DomMock.unpolyfill();
  });

  it('a rejected close does not poison later teardown', async () => {
    DomMock.polyfill();
    const win = (globalThis as any).window as Window;
    const close = win.happyDOM.close.bind(win.happyDOM);
    const failure = new Error('SYS:DOM-MOCK:CLOSE-FAIL');
    win.happyDOM.close = async () => {
      await close();
      throw failure;
    };

    await expectError(() => DomMock.unpolyfill(), failure.message);

    DomMock.polyfill();
    await DomMock.unpolyfill();
  });

  it('waits for every close before reporting an individual failure', async () => {
    DomMock.polyfill();
    const first = (globalThis as any).window as Window;
    await first.happyDOM.close();

    const failure = new Error('SYS:DOM-MOCK:CLOSE-FAIL');
    first.happyDOM.close = () => Promise.reject(failure);

    DomMock.polyfill({ url: 'https://example.com/' });
    const second = (globalThis as any).window as Window;
    const closeSecond = second.happyDOM.close.bind(second.happyDOM);
    const gate = Promise.withResolvers<void>();
    let secondClosed = false;
    second.happyDOM.close = async () => {
      await gate.promise;
      await closeSecond();
      secondClosed = true;
    };

    let settled = false;
    let observed: unknown;
    const closing = DomMock.unpolyfill().then(
      () => (settled = true),
      (error) => {
        settled = true;
        observed = error;
      },
    );

    try {
      await Time.wait(0);
      expect(settled).to.eql(false);
    } finally {
      gate.resolve();
      await closing;
    }

    expect(secondClosed).to.eql(true);
    expect(observed).to.equal(failure);
  });

  it('env flags (is)', () => {
    expect((globalThis as any).__SYS_BROWSER_MOCK__).to.not.eql(true);
    expect(DomMock.isPolyfilled).to.eql(false);
    expect(Is.browser()).to.eql(false);

    DomMock.polyfill();

    expect((globalThis as any).__SYS_BROWSER_MOCK__).to.eql(true);
    expect(DomMock.isPolyfilled).to.eql(true);
    expect(Is.browser()).to.eql(true);
  });
});
