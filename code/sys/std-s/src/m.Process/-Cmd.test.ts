import { describe, expect, it, rx, slug, Time, type t } from '../-test.ts';
import { Testing } from './common.ts';
import { Cmd } from './mod.ts';

describe('Cmd', () => {
  describe('Cmd.sh', () => {
    it('run: "echo"', async () => {
      const sh = Cmd.sh({ silent: true });
      const res = await sh.run('echo foo');
      expect(res.code).to.eql(0);
      expect(res.success).to.eql(true);
      expect(res.text.stdout).to.eql('foo\n');
    });
  });

  describe('Cmd.invoke (sync)', () => {
    it('invoke → stdout', async () => {
      const args = ['eval', 'console.log("👋 hello world")'];
      const res = await Cmd.invoke({ args, silent: true });

      expect(res.code).to.eql(0);
      expect(res.success).to.eql(true);

      expect(res.toString()).to.include('👋 hello world');
      expect(res.text.stdout).to.eql(res.toString());
      expect(res.text.stderr).to.eql('');
    });

    it('invoke → stderr', async () => {
      const args = ['eval', 'throw new Error("my-error")'];
      const res = await Cmd.invoke({ args, silent: true });

      expect(res.code).to.eql(1);
      expect(res.success).to.eql(false);

      expect(res.toString()).to.include('my-error');
      expect(res.text.stdout).to.eql('');
      expect(res.text.stderr).to.eql(res.toString());
    });
  });

  describe('Cmd.spawn (async long-lived)', () => {
    describe('lifecycle', () => {
      it('spawn → dispose', async () => {
        const args = ['eval', 'console.log("👋")'];
        const handle = Cmd.spawn({ args, silent: true });

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
        const handle = Cmd.spawn({ args, silent: true, dispose$ });

        const fired: t.DisposeAsyncEvent[] = [];
        handle.dispose$.subscribe((e) => fired.push(e));

        expect(handle.disposed).to.eql(false);
        dispose();
        await Time.wait(50);
        expect(handle.disposed).to.eql(true);
        expect(fired.length).to.eql(2);
      });
    });

    it('spawn → wait → events', async () => {
      const env = { FOO: `tx.${slug()}` };
      const cmd = `setInterval(() => console.log(Deno.env.get('FOO')), 50);`;
      const args = ['eval', cmd];
      const handle = Cmd.spawn({ args, env, silent: true });

      const firedWhenReady: t.CmdProcessReadyHandlerArgs[] = [];
      const firedObs: t.CmdProcessEvent[] = [];
      const firedOn: t.CmdProcessEvent[] = [];
      handle.$.subscribe((e) => firedObs.push(e));
      handle.onStdOut((e) => firedOn.push(e));

      expect(typeof handle.pid === 'number').to.be.true;
      expect(handle.is.ready).to.eql(false);

      const res = await handle.whenReady((e) => firedWhenReady.push(e));
      expect(res).to.equal(handle);
      expect(handle.is.ready).to.eql(true);

      expect(firedWhenReady.length).to.eql(1);
      expect(typeof firedWhenReady[0].pid === 'number').to.be.true;
      expect(firedWhenReady[0].cmd).to.include(`console.log(Deno.env.get('FOO'))`);

      expect(firedObs.length).to.eql(1);
      expect(firedOn.length).to.eql(1);
      expect(firedObs[0]).to.eql(firedOn[0]);
      expect(firedObs[0].toString()).to.eql(`${env.FOO}\n`);

      await handle.dispose();
    });

    it('spawn → server HTTP', async () => {
      const port = Testing.randomPort();
      const tx = `tx.${Testing.slug()}`;
      const text = `Hello World ← ${tx}`;

      const cmd = `Deno.serve({ port: ${port} }, () => new Response('${text}'))`;
      const child = await Cmd.spawn({ args: ['eval', cmd] }).whenReady();

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
