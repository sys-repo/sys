import { Cmd } from '../mod.ts';
import { Time, type t } from './common.ts';

export function methodTests(setup: t.CmdTestSetup, args: t.TestArgs) {
  const { describe, it, expect } = args;

  type P = { a: number; b: number };
  type R = { sum: number };
  type E = t.ErrorLike & { code: number; type: 'myType-1' | 'myType-2' };
  type C = C1 | C2 | C3;
  type C1 = t.CmdType<'add', P>;
  type C2 = t.CmdType<'add:res', R, E>;
  type C3 = t.CmdType<'foo', { msg?: string }>;
  const sum = ({ a, b }: P): R => ({ sum: a + b });

  describe('Methods', () => {
    describe('examples', () => {
      /**
       * This manual example shows the basics of call and response
       * using nothing but the {Cmd} primitives.
       *
       * The {Response} and {Listener} helpers are simply wrappers
       * around the observable pattern below to provide some strongly
       * typed developer ergonomics.
       */
      it('via manual event hookup', async () => {
        const { doc, dispose, dispose$ } = await setup();
        const cmd = Cmd.create<C>(doc);
        const events = cmd.events(dispose$);

        const responses: t.CmdTx<C2>[] = [];
        events.on('add').subscribe((e) => cmd.invoke('add:res', sum(e.params)));
        events.on('add:res').subscribe((e) => responses.push(e));

        cmd.invoke('add', { a: 2, b: 3 });
        await Time.wait(20);

        expect(responses[0].params.sum).to.eql(5);
        dispose();
      });
    });

    describe('Factory', () => {
      it('factory overloads (void | responder)', async () => {
        const { doc, dispose } = await setup();
        const cmd = Cmd.create<C>(doc);
        const method1 = cmd.method('foo');
        const method2 = cmd.method('add', 'add:res');
        expect(typeof method1 === 'function').to.eql(true);
        expect(typeof method2 === 'function').to.eql(true);
        dispose();
      });

      it('invoke: (void)', async () => {
        const { doc, dispose, dispose$ } = await setup();
        const cmd = Cmd.create<C>(doc);
        const method = cmd.method('foo');

        const fired: t.CmdTx<C3>[] = [];
        cmd
          .events(dispose$)
          .on('foo')
          .subscribe((e) => fired.push(e));

        const res = method({ msg: 'hello' });
        await Time.wait(0);

        expect(res.req.name).to.eql('foo');
        expect(res.req.params).to.eql({ msg: 'hello' });

        expect(fired.length).to.eql(1);
        expect(fired[0].name).to.eql('foo');
        expect(fired[0].params).to.eql({ msg: 'hello' });
        expect(fired[0].tx).to.eql(res.tx);

        dispose();
      });

      it('invoke: (response)', async () => {
        const { doc, dispose, dispose$ } = await setup();
        const cmd = Cmd.create<C>(doc);
        const method = cmd.method('add', 'add:res');
        const events = cmd.events(dispose$);
        events.on('add').subscribe((e) => cmd.invoke('add:res', sum(e.params), e.tx));

        const res = await method({ a: 1, b: 2 }).promise();
        expect(res.result?.sum).to.eql(3);
        dispose();
      });

      describe('issuer (identifier)', () => {
        it('invoke: (void) ← with "issuer"', async () => {
          const { doc, dispose, dispose$ } = await setup();
          const issuer = 'foo:me';
          const cmd = Cmd.create<C>(doc, { issuer });
          const method = cmd.method('foo');

          const fired: t.CmdTx<C3>[] = [];
          cmd
            .events(dispose$)
            .on('foo')
            .subscribe((e) => fired.push(e));

          const res = method({ msg: 'hello' });
          expect(res.issuer).to.eql(issuer);

          await Time.wait(0);
          expect(fired.length).to.eql(1);
          expect(fired[0].issuer).to.eql(issuer);

          dispose();
        });

        it('invoke: (response) ← issuer', async () => {
          const { doc, dispose, dispose$ } = await setup();
          const issuer = 'foo:me';
          const cmd = Cmd.create<C>(doc, { issuer });
          const method = cmd.method('add', 'add:res');
          const events = cmd.events(dispose$);
          const fired: t.CmdTx<C>[] = [];
          events.on('add').subscribe((e) => {
            cmd.invoke('add:res', sum(e.params), e.tx);
            fired.push(e);
          });

          const res1 = method({ a: 1, b: 2 });
          const res2 = await res1.promise();
          expect(fired[0].issuer).to.eql(issuer);
          expect(res2.result?.sum).to.eql(3);

          expect(res1.issuer).to.eql(issuer);
          expect(res2.issuer).to.eql(issuer);

          dispose();
        });
      });
    });

    describe('Responses', () => {
      it('Response {object} → "tx" passing', async () => {
        const { doc, dispose } = await setup();
        const cmd = Cmd.create<C>(doc);

        const tx = 'tx.abc';
        const method = cmd.method('add', 'add:res');
        const res1 = cmd.invoke('foo', {}, { tx });
        const res2 = method({ a: 1, b: 2 }, { tx });

        expect(typeof res1 === 'object').to.be.true;
        expect((res1 as any).listen).to.be.undefined;
        expect(typeof res2 === 'object').to.be.true;

        expect(res1.tx).to.eql(tx);
        expect(res2.tx).to.eql(tx);

        expect(res1.req.name === 'foo').to.be.true;
        expect(res1.req.params).to.eql({});

        expect(res2.req.name === 'add').to.be.true;
        expect(res2.req.params).to.eql({ a: 1, b: 2 });

        dispose();
      });

      describe('Response (listen)', () => {
        it('listen', async () => {
          const { doc, dispose, dispose$ } = await setup();
          const cmd = Cmd.create<C>(doc);
          const events = cmd.events(dispose$);
          events.on('add').subscribe((e) => cmd.invoke('add:res', sum(e.params), e.tx));

          const method = cmd.method('add', 'add:res');
          const res = method({ a: 1, b: 2 });

          expect(res.tx).to.be.a.string;
          expect(res.req.name).to.eql('add');
          expect(res.req.params.a).to.eql(1);
          expect(res.req.params.b).to.eql(2);

          expect(res.status).to.eql('Pending');
          expect(res.result).to.eql(undefined);
          expect(res.disposed).to.eql(false);

          await Time.wait(10);

          expect(res.ok).to.eql(true);
          expect(res.status).to.eql('Complete');
          expect(res.result?.sum).to.eql(3);
          expect(res.disposed).to.eql(true);

          dispose();
        });

        it('listen → events.on("name", fn:<callback>)', async () => {
          const { doc, dispose, dispose$ } = await setup();
          const cmd = Cmd.create<C>(doc);
          cmd.events(dispose$).on('add', function (e) {
            cmd.invoke('add:res', sum(e.params), e.tx);
          });

          const method = cmd.method('add', 'add:res');
          const res = method({ a: 2, b: 3 });
          await Time.wait(10);

          expect(res.result?.sum).to.eql(5);
          dispose();
        });

        it('listen → {promise}', async () => {
          const { doc, dispose, dispose$ } = await setup();
          const cmd = Cmd.create<C>(doc);
          cmd.events(dispose$).on('add', (e) => cmd.invoke('add:res', sum(e.params), e.tx));

          const method = cmd.method('add', 'add:res');
          const res = method({ a: 2, b: 3 });
          expect(res.result).to.eql(undefined);

          const promise = await res.promise();
          expect(res.result?.sum).to.eql(5);
          expect(promise.result?.sum).to.eql(5);

          dispose();
        });

        it('list → (delay:complete) → {promise} returns', async () => {
          const { doc, dispose, dispose$ } = await setup();
          const cmd = Cmd.create<C>(doc);
          cmd.events(dispose$).on('add', (e) => cmd.invoke('add:res', sum(e.params), e.tx));

          const method = cmd.method('add', 'add:res');
          const res1 = method({ a: 2, b: 3 }, { timeout: 10 });

          await Time.wait(30); // NB: ensure the request has already resolved before creating the promise.
          const promise = res1.promise();
          const res2 = await promise;

          expect(res2.status).to.eql('Complete');
          expect(res2.result?.sum).to.eql(5);

          dispose();
        });

        it('listen ← timeout', async () => {
          const { doc, dispose, dispose$ } = await setup();
          const cmd = Cmd.create<C>(doc);
          cmd.events(dispose$).on('add', async (e) => {
            await Time.wait(20); // NB: response is issued after invokation has timed-out.
            cmd.invoke('add:res', sum(e.params), e.tx);
          });

          const timeout = 10;
          const method = cmd.method('add', 'add:res');
          const res = method({ a: 1, b: 2 }, { timeout });
          expect(res.ok).to.eql(true);
          expect(res.status).to.eql('Pending');
          expect(res.disposed).to.eql(false);

          await Time.wait(50);

          expect(res.ok).to.eql(false);
          expect(res.status === 'Timeout').to.eql(true);
          expect(res.result).to.eql(undefined);
          expect(res.disposed).to.eql(true);

          dispose();
        });

        it('listen(ƒ) ← register callback: onComplete', async () => {
          const { doc, dispose, dispose$ } = await setup();
          const cmd = Cmd.create<C>(doc);

          const fired: t.CmdResponseHandlerArgs<C1, C2>[] = [];
          const events = cmd.events(dispose$);
          events.on('add', (e) => cmd.invoke('add:res', sum(e.params), e.tx));

          // Handler added to {listener} invoke parameter.
          const method = cmd.method('add', 'add:res');
          await method({ a: 1, b: 2 }, (e) => fired.push(e)).promise();

          expect(fired[0].result?.sum).to.eql(3);

          // Handler added to {listener} via method.
          await method({ a: 2, b: 3 })
            .onComplete((e) => {
              fired.push(e);
              expect(e.result?.sum).to.eql(5); // NB: result strongly typed.
            })
            .promise();

          expect(fired[1].result?.sum).to.eql(5);
          dispose();
        });

        it('listen(ƒ) ← register callback: onError', async () => {
          const { doc, dispose, dispose$ } = await setup();
          const cmd = Cmd.create<C>(doc);
          const events = cmd.events(dispose$);

          const error: E = { message: 'boo', code: 123, type: 'myType-1' };
          const fired: t.CmdResponseHandlerArgs<C1, C2>[] = [];
          events
            .on('add')
            .subscribe(({ tx, params }) => cmd.invoke('add:res', sum(params), { tx, error }));

          // Handler passed to listener constructor.
          const method = cmd.method('add', 'add:res');
          await method({ a: 1, b: 2 })
            .onError((e) => fired.push(e))
            .promise();

          expect(fired.length).to.eql(1);
          expect(fired[0].error).to.eql(error);

          await method({ a: 1, b: 2 }, { onError: (e) => fired.push(e) }).promise();

          expect(fired.length).to.eql(2);
          expect(fired[1].error).to.eql(error);

          // Example.
          method({ a: 1, b: 2 }, (e) => {
            e.error; /*  handle error */
            e.result; /* do something with result */
          });

          dispose();
        });

        it('listen(ƒ) ← register callback: onTimeout', async () => {
          const { doc, dispose, dispose$ } = await setup();
          const cmd = Cmd.create<C>(doc);

          // NB: no handler attached to "add" method.
          const method = cmd.method('add', 'add:res');
          let timedOut = 0;

          // Handler added to {listener} via method.
          method({ a: 2, b: 3 }, { timeout: 10 }).onTimeout((e) => timedOut++);
          await Time.wait(20);
          expect(timedOut).to.eql(1);

          // Handler added to {listener} via invocation parameter.
          method({ a: 1, b: 2 }, { timeout: 10, onTimeout: () => timedOut++ });
          await Time.wait(20);
          expect(timedOut).to.eql(2);

          // Add listener now ← stops timing out.
          const events = cmd.events(dispose$);
          events.on('add', (e) => cmd.invoke('add:res', sum(e.params), e.tx));

          // ↑
          method({ a: 2, b: 3 }, { timeout: 10 }).onTimeout((e) => timedOut++);
          method({ a: 1, b: 2 }, { timeout: 10, onTimeout: () => timedOut++ });
          await Time.wait(30);
          expect(timedOut).to.eql(2); // NB: no change.

          dispose();
        });

        it('listen ← dispose', async () => {
          const { doc, dispose, dispose$ } = await setup();
          const cmd = Cmd.create<C>(doc);

          const events = cmd.events(dispose$);
          events.on('add').subscribe(async (e) => {
            await Time.wait(10); // NB: response is issued after listener has disposed.
            cmd.invoke('add:res', sum(e.params), res1.tx);
            cmd.invoke('add:res', sum(e.params), res2.tx);
          });

          const method = cmd.method('add', 'add:res');
          const params: P = { a: 1, b: 2 };
          const res1 = method(params);
          const res2 = method(params, { dispose$ });
          expect(res1.disposed).to.eql(false);
          expect(res2.disposed).to.eql(false);

          res1.dispose();
          dispose();
          expect(res1.disposed).to.eql(true);
          expect(res2.disposed).to.eql(true);

          expect(res1.ok).to.eql(true);
          expect(res2.ok).to.eql(true);

          expect(res1.result).to.eql(undefined);
          expect(res2.result).to.eql(undefined);
        });
      });

      describe('Response → Error', () => {
        it('with error (default)', async () => {
          const { doc, dispose, dispose$ } = await setup();
          const cmd = Cmd.create<C>(doc);
          const events = cmd.events(dispose$);

          const error: E = { code: 123, type: 'myType-2', message: 'stink' };
          events.on('add').subscribe(({ tx, params }) => {
            cmd.invoke('add:res', sum(params), { tx, error });
          });

          const method = cmd.method('add', 'add:res');
          const res = method({ a: 1, b: 2 });
          await res.promise();

          expect(res.error).to.eql(error);
          expect(res.ok).to.eql(false);
          expect(res.status === 'Error').to.eql(true);

          const queue = doc.current.queue as t.CmdQueue;
          expect(queue[0].error).to.eql(undefined);
          expect(queue[1].error).to.eql(error);

          dispose();
        });

        it('with custom error', async () => {
          const { doc, dispose, dispose$ } = await setup();
          const cmd = Cmd.create<C>(doc);
          const events = cmd.events(dispose$);

          const error: E = { code: 123, type: 'myType-1', message: 'boo' };
          events.on('add').subscribe(({ tx, params }) => {
            cmd.invoke('add:res', sum(params), { tx, error });
          });

          const method = cmd.method('add', 'add:res');
          const res = method({ a: 1, b: 2 });
          await res.promise();

          expect(res.error?.code).to.eql(123);
          expect(res.error?.type).to.eql('myType-1');
          expect(res.error?.message).to.eql('boo');
          expect(res.status === 'Error').to.eql(true);

          dispose();
        });
      });
    });
  });
}
