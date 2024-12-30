import { type t, Testing, describe, expect, it, rx, slug, Time } from '../-test.ts';
import { Process } from './mod.ts';

describe('Process', () => {
  describe('Process.sh', () => {
    it('run: "echo"', async () => {
      const sh = Process.sh({ silent: true });
      const res = await sh.run('echo foo');
      expect(res.code).to.eql(0);
      expect(res.success).to.eql(true);
      expect(res.text.stdout).to.eql('foo\n');
    });
  });

  describe('Process.invoke (sync)', () => {
    it('invoke → stdout', async () => {
      const args = ['eval', 'console.log("👋 hello world")'];
      const res = await Process.invoke({ args, silent: true });

      expect(res.code).to.eql(0);
      expect(res.success).to.eql(true);

      expect(res.toString()).to.include('👋 hello world');
      expect(res.text.stdout).to.eql(res.toString());
      expect(res.text.stderr).to.eql('');
    });

    it('invoke → stderr', async () => {
      const args = ['eval', 'throw new Error("my-error")'];
      const res = await Process.invoke({ args, silent: true });

      expect(res.code).to.eql(1);
      expect(res.success).to.eql(false);

      expect(res.toString()).to.include('my-error');
      expect(res.text.stdout).to.eql('');
      expect(res.text.stderr).to.eql(res.toString());
    });
  });

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

      it('spawn → dispose$', async () => {
        const { dispose$, dispose } = rx.lifecycle();
        const args = ['eval', 'console.log("👋")'];
        const handle = Process.spawn({ args, silent: true, dispose$ });

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

        const firedWhenReady: t.CmdProcessReadyHandlerArgs[] = [];
        const firedObservable: t.CmdProcessEvent[] = [];
        const firedOnHandler: t.CmdProcessEvent[] = [];
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

    it('spawn → wait ("ready signal" function) → events', async () => {
      let fired = 0;
      const readySignal: t.CmdReadySignalFilter = (e) => {
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
});
