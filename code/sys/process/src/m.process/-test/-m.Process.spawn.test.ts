import { describe, expect, it, Rx, slug, type t, Testing, Time } from '../../-test.ts';
import { Process } from '../mod.ts';

describe('Process.spawn (async long-lived)', () => {
  describe('lifecycle', () => {
    it('spawn → dispose', async () => {
      const args = ['eval', 'console.log("👋")'];
      const handle = Process.spawn({ args, silent: true });

      const fired: t.DisposeAsyncEvent[] = [];
      handle.dispose$.subscribe((e) => fired.push(e));

      expect(handle.disposed).to.eql(false);
      const wait = handle.dispose();
      expect(handle.disposed).to.eql(false);
      await wait;
      expect(handle.disposed).to.eql(true);
      expect(fired.length).to.eql(2);
    });

    it('spawn → until', async () => {
      const { dispose$, dispose } = Rx.lifecycle();
      const args = ['eval', 'console.log("👋")'];
      const handle = Process.spawn({ args, silent: true, until: dispose$ });

      const fired: t.DisposeAsyncEvent[] = [];
      handle.dispose$.subscribe((e) => fired.push(e));

      expect(handle.disposed).to.eql(false);
      dispose();
      await Time.wait(50);
      expect(handle.disposed).to.eql(true);
      expect(fired.length).to.eql(2);
    });
  });

  it('spawn → wait ("ready signal") → events', async () => {
    const test = async (readySignal: string) => {
      const env = { FOO: `tx.${slug()}` };
      const cmd = `
          setInterval(() => console.log(Deno.env.get('FOO')), 30);
          console.info('${readySignal}');
        `;
      const args = ['eval', cmd];
      const handle = Process.spawn({ args, env, readySignal, silent: true });

      const firedWhenReady: t.Process.ReadyHandlerArgs[] = [];
      const firedObservable: t.Process.Event[] = [];
      const firedOnHandler: t.Process.Event[] = [];
      handle.$.subscribe((e) => firedObservable.push(e));
      handle.onStdOut((e) => firedOnHandler.push(e));

      expect(typeof handle.pid === 'number').to.be.true;
      expect(handle.is.ready).to.eql(false);

      const res = await handle.whenReady((e) => firedWhenReady.push(e));
      expect(res).to.equal(handle);
      expect(handle.is.ready).to.eql(true);

      expect(firedWhenReady.length).to.eql(1);
      expect(typeof firedWhenReady[0].pid === 'number').to.be.true;
      expect(firedWhenReady[0].cmd).to.include(`console.log(Deno.env.get('FOO'))`);

      expect(firedObservable.length).to.eql(1);
      expect(firedOnHandler.length).to.eql(1);
      expect(firedObservable[0]).to.eql(firedOnHandler[0]);
      expect(firedObservable[0].toString()).to.eql(`${readySignal}\n`);

      await Time.wait(50); // NB: wait for 30ms timeout in command script (above).
      expect(firedObservable.length).to.eql(2);
      expect(firedObservable[1].toString()).to.eql(`${env.FOO}\n`); // NB: passed in {env} variable emitted in console.

      await handle.dispose();
    };

    await test(Process.Signal.ready);
    await test(`MY_SIGNAL_${slug()}`);
  });

  it('spawn → wait rejects when child exits before ready', async () => {
    const args = ['eval', 'Deno.exit(7)'];
    const handle = Process.spawn({ args, readySignal: 'NEVER_READY', silent: true });

    const error = await catchErrorWithin(() => handle.whenReady());

    expect(error?.message).to.contain('Process.spawn: child exited before ready:');
    expect(error?.message).to.contain('code=7');
  });

  it('spawn → wait rejects when disposed before ready', async () => {
    const args = ['eval', 'setInterval(() => {}, 1_000)'];
    const handle = Process.spawn({ args, readySignal: 'NEVER_READY', silent: true });
    const errorPromise = catchErrorWithin(() => handle.whenReady());

    await handle.dispose('test:dispose-before-ready');
    const error = await errorPromise;

    expect(error?.message).to.contain('Process.spawn: disposed before ready:');
  });

  it('spawn → wait ("ready signal" function) → events', async () => {
    let fired = 0;
    const readySignal: t.Process.ReadySignalFilter = (e) => {
      fired++;
      return e.toString() === 'foo:3\n';
    };

    const cmd = `
        let count = 0;
        setInterval(() => {
          count++;
          console.info(\`foo:\${count}\`);
        }, 100);
    `;
    const args = ['eval', cmd];
    const handle = Process.spawn({ args, readySignal, silent: true });

    expect(fired).to.eql(0);
    await handle.whenReady();
    expect(fired).to.eql(3);

    await handle.dispose();
  });

  it('spawn → server HTTP', async () => {
    const port = Testing.randomPort();
    const tx = `tx.${Testing.slug()}`;
    const text = `Hello World ← ${tx}`;

    const readySignal = Process.Signal.ready;
    const cmd = `
        Deno.serve({ port: ${port} }, () => new Response('${text}'));
        console.info('${Process.Signal.ready}');
      `;
    const args = ['eval', cmd];
    const child = await Process.spawn({ args, readySignal, silent: true }).whenReady();

    /**
     * Client Fetch
     */
    const url = `http://localhost:${port}`;
    const res = await fetch(url);
    const resText = await res.text();

    expect(res.status).to.eql(200);
    expect(resText).to.eql(text);

    await child.dispose();
  });
});

async function catchErrorWithin(
  fn: () => Promise<unknown>,
  timeout: t.Msecs = 1_000,
): Promise<Error | undefined> {
  let timer: t.Time.Delay.Promise | undefined;
  try {
    return await Promise.race([
      catchError(fn),
      new Promise<Error>((resolve) => {
        timer = Time.delay(timeout, () => resolve(new Error('Timed out waiting for rejection')));
      }),
    ]);
  } finally {
    timer?.cancel();
  }
}

async function catchError(fn: () => Promise<unknown>): Promise<Error | undefined> {
  try {
    await fn();
    return undefined;
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
}
