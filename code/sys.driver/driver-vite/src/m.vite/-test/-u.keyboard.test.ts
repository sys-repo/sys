import { describe, expect, it, Rx } from '../../-test/common.ts';
import type { t } from '../common.ts';
import { keyboardFactory } from '../u/u.keyboard.ts';

describe('Vite.dev keyboard', () => {
  it('routes footer-advertised quit controls through the same disposal path', async () => {
    for (const input of [{ key: 'q' }, { key: 'c', ctrlKey: true }]) {
      const events: string[] = [];
      const keyboard = keyboardFactory({
        cwd: '/tmp/pkg',
        url: 'http://localhost:1234/',
        dispose: async () => void events.push('dispose'),
      }, {
        keypress: () => keypress([input]),
        exit: (code) => events.push(`exit:${code}`),
      });

      await keyboard();
      expect(events).to.eql(['dispose', 'exit:0']);
    }
  });

  it('opens the normalized resolved URL without changing lifecycle state', async () => {
    const events: string[] = [];
    const keyboard = keyboardFactory({
      cwd: '/tmp/pkg',
      url: 'http://localhost:1234',
      dispose: async () => void events.push('dispose'),
    }, {
      keypress: () => keypress([{ key: 'o' }]),
      open: (url) => events.push(`open:${url}`),
      exit: (code) => events.push(`exit:${code}`),
    });

    await keyboard();
    expect(events).to.eql(['open:http://localhost:1234/']);
  });

  it('waits for child disposal when keyboard input is unavailable', async () => {
    const events: string[] = [];
    const dispose$ = new Rx.Subject<t.DisposeAsyncEvent>();
    let entered: () => void;
    const inputUnavailable = new Promise<void>((resolve) => {
      entered = resolve;
    });
    let resolved = false;
    const keyboard = keyboardFactory({
      cwd: '/tmp/pkg',
      url: 'http://localhost:1234/',
      until: dispose$,
      dispose: async () => void events.push('dispose'),
    }, {
      keypress: () => ({
        async *[Symbol.asyncIterator]() {
          entered();
          throw new Error('ENOTTY');
        },
      }),
      exit: (_code) => {},
    });

    const run = keyboard().then(() => {
      resolved = true;
      events.push('done');
    });
    await inputUnavailable;
    expect(resolved).to.eql(false);
    expect(events).to.eql([]);

    dispose$.next({
      type: 'dispose',
      payload: { is: { ok: true, done: true }, stage: 'complete' },
    });
    dispose$.complete();
    await run;

    expect(events).to.eql(['done']);
  });
});

/**
 * Helpers:
 */
function keypress(items: readonly KeypressInput[]) {
  return (async function* () {
    for (const item of items) yield item;
  })();
}

type KeypressInput = {
  key: string;
  ctrlKey?: boolean;
};
