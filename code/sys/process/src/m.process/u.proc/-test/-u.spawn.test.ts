import { describe, expect, Is, it, Rx, slug, type t, Testing, Time } from '../../../-test.ts';
import { Process } from '../../mod.ts';
import { ProcessTest } from '../../-test/u.fixture.ts';
import type { FailureRecord } from '../../u/u.ts';
import { type SpawnFailurePhase, spawnWith } from '../u.spawn.ts';

describe('Process.spawn (async long-lived)', () => {
  describe('lifecycle', () => {
    it('spawn → dispose', async () => {
      const args = ProcessTest.evalArgs('console.log("👋")');
      const handle = Process.spawn({ args, silent: true });

      const fired: t.DisposeAsyncEvent[] = [];
      let outputCompleted = 0;
      handle.dispose$.subscribe((e) => fired.push(e));
      const outputSubscription = handle.$.subscribe({
        complete: () => outputCompleted++,
      });

      expect(handle.disposed).to.eql(false);
      const wait = handle.dispose();
      expect(handle.disposed).to.eql(false);
      await wait;
      expect(handle.disposed).to.eql(true);
      expect(fired.length).to.eql(2);
      expect(outputCompleted).to.eql(1);
      expect(outputSubscription.closed).to.eql(true);

      let lateCompleted = 0;
      const lateSubscription = handle.$.subscribe({ complete: () => lateCompleted++ });
      expect(lateCompleted).to.eql(1);
      expect(lateSubscription.closed).to.eql(true);
    });

    it('dispose → keeps output open until status and streams settle', async () => {
      const status = Promise.withResolvers<Deno.CommandStatus>();
      const tailObserved = Promise.withResolvers<void>();
      let stdoutController: ReadableStreamDefaultController<Uint8Array> | undefined;
      let stderrController: ReadableStreamDefaultController<Uint8Array> | undefined;
      const stdout = new ReadableStream<Uint8Array>({
        start(controller) {
          stdoutController = controller;
        },
      });
      const stderr = new ReadableStream<Uint8Array>({
        start(controller) {
          stderrController = controller;
        },
      });
      const child = fakeChild({ status: status.promise, stdout, stderr });
      const handle = spawnWith(
        { spawnChild: () => child, terminationGraceTimeout: 100 as t.Msecs },
        { args: [], silent: true },
      );
      const observed: string[] = [];
      let completed = 0;
      const subscription = handle.$.subscribe({
        next(event) {
          observed.push(event.toString());
          tailObserved.resolve();
        },
        complete: () => completed++,
      });

      const settling = handle.dispose();
      expect(completed).to.eql(0);
      expect(subscription.closed).to.eql(false);

      stdoutController?.enqueue(new TextEncoder().encode('SHUTDOWN_TAIL\n'));
      await tailObserved.promise;
      expect(observed).to.eql(['SHUTDOWN_TAIL\n']);
      expect(completed).to.eql(0);
      expect(subscription.closed).to.eql(false);

      status.resolve({ success: true, code: 0, signal: 'SIGTERM' });
      stdoutController?.close();
      stderrController?.close();
      await settling;

      expect(completed).to.eql(1);
      expect(subscription.closed).to.eql(true);
    });

    it('dispose → preserves shutdown tail for handlers and subscribers attached during cleanup', async () => {
      const status = Promise.withResolvers<Deno.CommandStatus>();
      const disposalStarted = Promise.withResolvers<void>();
      let stdoutController: ReadableStreamDefaultController<Uint8Array> | undefined;
      let stderrController: ReadableStreamDefaultController<Uint8Array> | undefined;
      const stdout = new ReadableStream<Uint8Array>({
        start(controller) {
          stdoutController = controller;
        },
      });
      const stderr = new ReadableStream<Uint8Array>({
        start(controller) {
          stderrController = controller;
        },
      });
      const child = fakeChild({ status: status.promise, stdout, stderr });
      const handle = spawnWith(
        { spawnChild: () => child, terminationGraceTimeout: 100 as t.Msecs },
        { args: [], silent: true },
      );
      const handled: string[] = [];
      const observed: string[] = [];
      const duringCleanup: string[] = [];
      let completedDuringCleanup = 0;
      handle.onStdOut((event) => handled.push(event.toString()));
      handle.$.subscribe((event) => observed.push(event.toString()));
      handle.dispose$.subscribe((event) => {
        if (event.payload.stage === 'start') disposalStarted.resolve();
      });

      const settling = handle.dispose();
      await disposalStarted.promise;
      const duringSubscription = handle.$.subscribe({
        next: (event) => duringCleanup.push(event.toString()),
        complete: () => completedDuringCleanup++,
      });

      stdoutController?.enqueue(new TextEncoder().encode('SHUTDOWN_TAIL\n'));
      status.resolve({ success: true, code: 0, signal: 'SIGTERM' });
      stdoutController?.close();
      stderrController?.close();
      await settling;

      expect(handled).to.eql(['SHUTDOWN_TAIL\n']);
      expect(observed).to.eql(['SHUTDOWN_TAIL\n']);
      expect(duringCleanup).to.eql(['SHUTDOWN_TAIL\n']);
      expect(completedDuringCleanup).to.eql(1);
      expect(duringSubscription.closed).to.eql(true);
    });

    it('rejecting cleanup → completes output only after stream settlement', async () => {
      const statusFailure = new Error('status:failure');
      const streamFailure = new Error('stdout:cancel');
      const status = Promise.withResolvers<Deno.CommandStatus>();
      const cancelStarted = Promise.withResolvers<void>();
      const cancelGate = Promise.withResolvers<void>();
      const stdout = new ReadableStream<Uint8Array>({
        cancel() {
          cancelStarted.resolve();
          return cancelGate.promise;
        },
      });
      const stderr = new ReadableStream<Uint8Array>();
      const child = fakeChild({
        status: status.promise,
        stdout,
        stderr,
        kill() {
          status.reject(statusFailure);
        },
      });
      const handle = spawnWith(
        {
          spawnChild: () => child,
          streamTimeout: 10 as t.Msecs,
          terminationGraceTimeout: 1 as t.Msecs,
        },
        { args: [], silent: true },
      );
      let completed = 0;
      const subscription = handle.$.subscribe({ complete: () => completed++ });

      const settling = ProcessTest.catchErrorWithin(() => handle.dispose(), 500);
      await cancelStarted.promise;
      expect(completed).to.eql(0);
      expect(subscription.closed).to.eql(false);

      cancelGate.reject(streamFailure);
      const error = await settling;

      expect(error).to.be.instanceOf(Error);
      expect(completed).to.eql(1);
      expect(subscription.closed).to.eql(true);

      let lateCompleted = 0;
      const lateSubscription = handle.$.subscribe({ complete: () => lateCompleted++ });
      expect(lateCompleted).to.eql(1);
      expect(lateSubscription.closed).to.eql(true);
    });

    it('successful stream cancellation after drain timeout → rejects before output completion', async () => {
      const status = Promise.withResolvers<Deno.CommandStatus>();
      const signals: Deno.Signal[] = [];
      const stdout = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('PARTIAL\n'));
        },
      });
      const stderr = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.close();
        },
      });
      const child = fakeChild({
        status: status.promise,
        stdout,
        stderr,
        kill(signal) {
          signals.push(signal);
          status.resolve({ success: true, code: 0, signal });
        },
      });
      const handle = spawnWith(
        {
          spawnChild: () => child,
          streamTimeout: 1 as t.Msecs,
          terminationGraceTimeout: 10 as t.Msecs,
        },
        { args: [], silent: true },
      );
      const handled: string[] = [];
      const observed: string[] = [];
      let completed = 0;
      handle.onStdOut((event) => handled.push(event.toString()));
      const subscription = handle.$.subscribe({
        next: (event) => observed.push(event.toString()),
        complete: () => completed++,
      });
      await handle.whenReady();

      const disposalStarted = Promise.withResolvers<void>();
      handle.dispose$.subscribe((event) => {
        if (event.payload.stage === 'start') disposalStarted.resolve();
      });
      const completion = handle.dispose();
      const settling = ProcessTest.catchErrorWithin(() => completion, 100);
      await disposalStarted.promise;

      let completedDuringCleanup = 0;
      const duringSubscription = handle.$.subscribe({
        complete: () => completedDuringCleanup++,
      });
      const error = await settling;

      expect(error?.message).to.contain('Timed out settling an owned process stream.');
      expect(handled).to.eql(['PARTIAL\n']);
      expect(observed).to.eql(['PARTIAL\n']);
      expect(signals).to.eql(['SIGTERM']);
      expect(completed).to.eql(1);
      expect(completedDuringCleanup).to.eql(1);
      expect(subscription.closed).to.eql(true);
      expect(duringSubscription.closed).to.eql(true);
      expect(stdout.locked).to.eql(false);
      expect(stderr.locked).to.eql(false);

      let lateCompleted = 0;
      const lateSubscription = handle.$.subscribe({ complete: () => lateCompleted++ });
      expect(lateCompleted).to.eql(1);
      expect(lateSubscription.closed).to.eql(true);
    });

    it('native disposal entrypoints share one completion', async () => {
      const args = ProcessTest.evalArgs('setInterval(() => {}, 1_000)');
      const handle = Process.spawn({ args, silent: true });
      const fired: t.DisposeAsyncEvent[] = [];
      handle.dispose$.subscribe((event) => fired.push(event));

      const completion = handle.dispose('direct:first');
      expect(handle[Symbol.asyncDispose]()).to.equal(completion);
      expect(handle.dispose('direct:later')).to.equal(completion);

      await completion;
      expect(handle.disposed).to.eql(true);
      expect(fired.map((event) => event.payload.stage)).to.eql(['start', 'complete']);
      expect(fired.map((event) => event.payload.reason)).to.eql(['direct:first', 'direct:first']);
    });

    it('native await using disposes on scope exit', async () => {
      const args = ProcessTest.evalArgs('setInterval(() => {}, 1_000)');
      const handle = Process.spawn({ args, silent: true });
      const fired: t.DisposeAsyncEvent[] = [];
      handle.dispose$.subscribe((event) => fired.push(event));

      {
        await using resource = handle;
        expect(resource).to.equal(handle);
        expect(handle.disposed).to.eql(false);
      }

      expect(handle.disposed).to.eql(true);
      expect(fired.map((event) => event.payload.reason)).to.eql([undefined, undefined]);
    });

    it('operation and stream cleanup reject → preserves both failures', async () => {
      const bodyFailure = new Error('body:failure');
      const cleanupFailure = new Error('stream:failure');
      const output = Promise.withResolvers<void>();
      const args = ProcessTest.evalArgs(
        `setTimeout(() => console.info('OUTPUT'), 10); setInterval(() => {}, 1_000);`,
      );

      let caught: unknown;
      try {
        await using handle = Process.spawn({ args, silent: true });
        handle.onStdOut(() => {
          output.resolve();
          throw cleanupFailure;
        });
        await output.promise;
        throw bodyFailure;
      } catch (error) {
        caught = error;
      }

      expect(caught).to.be.instanceOf(SuppressedError);
      if (!(caught instanceof SuppressedError)) throw caught;
      expectSingleCleanupFailure(caught.error, cleanupFailure, [
        'stdout:handler',
        'stdout:pump',
      ]);
      expect(caught.suppressed).to.equal(bodyFailure);
    });

    it('stream pump failure before readiness → owns disposal and preserves cause', async () => {
      const failure = new Error('stream:pump-failure');
      const output = Promise.withResolvers<void>();
      const args = ProcessTest.evalArgs(
        `console.info('OUTPUT'); setInterval(() => {}, 1_000);`,
      );
      const handle = Process.spawn({ args, readySignal: 'NEVER_READY', silent: true });
      handle.onStdOut(() => {
        output.resolve();
        throw failure;
      });

      const readiness = ProcessTest.catchErrorWithin(() => handle.whenReady(), 500);
      await output.promise;
      const readyError = await readiness;
      const disposeError = await ProcessTest.catchErrorWithin(() => handle.dispose());

      expect(readyError?.cause).to.equal(failure);
      expectSingleCleanupFailure(disposeError, failure, ['stdout:handler', 'stdout:pump']);
      expect(handle.disposed).to.eql(true);
    });

    it('readiness callback failure → settles its waiter and owns disposal', async () => {
      const failure = new Error('ready:callback-failure');
      const args = ProcessTest.evalArgs(
        `console.info('${Process.Signal.ready}'); setInterval(() => {}, 1_000);`,
      );
      const handle = Process.spawn({ args, readySignal: Process.Signal.ready, silent: true });

      const readyError = await ProcessTest.catchErrorWithin(() =>
        handle.whenReady(() => {
          throw failure;
        }), 500);
      const disposeError = await ProcessTest.catchErrorWithin(() => handle.dispose());

      expect(readyError).to.equal(failure);
      expectSingleCleanupFailure(disposeError, failure, ['readiness', 'stdout:pump']);
      expect(handle.disposed).to.eql(true);
    });

    it('already-ready callback failure → rejects and owns lifecycle disposal', async () => {
      const failure = new Error('ready:already-ready-callback-failure');
      const args = ProcessTest.evalArgs(
        `console.info('${Process.Signal.ready}'); setInterval(() => {}, 1_000);`,
      );
      const handle = Process.spawn({ args, readySignal: Process.Signal.ready, silent: true });

      await handle.whenReady();
      const readyError = await ProcessTest.catchErrorWithin(() =>
        handle.whenReady(() => {
          throw failure;
        }), 500);
      const disposeError = await ProcessTest.catchErrorWithin(() => handle.dispose());

      expect(readyError).to.equal(failure);
      expect(disposeError).to.equal(failure);
      expect(handle.disposed).to.eql(true);
    });

    it('readiness predicate failure → owns disposal and preserves cause', async () => {
      const failure = new Error('ready:predicate-failure');
      const args = ProcessTest.evalArgs(
        `console.info('OUTPUT'); setInterval(() => {}, 1_000);`,
      );
      const handle = Process.spawn({
        args,
        readySignal() {
          throw failure;
        },
        silent: true,
      });

      const readyError = await ProcessTest.catchErrorWithin(() => handle.whenReady(), 500);
      const disposeError = await ProcessTest.catchErrorWithin(() => handle.dispose());

      expect(readyError?.cause).to.equal(failure);
      expectSingleCleanupFailure(disposeError, failure, ['readiness', 'stdout:pump']);
      expect(handle.disposed).to.eql(true);
    });

    it('stream pump failure after readiness → requests lifecycle disposal', async () => {
      const failure = new Error('stream:after-ready-failure');
      const output = Promise.withResolvers<void>();
      const args = ProcessTest.evalArgs(`
        console.info('${Process.Signal.ready}');
        setTimeout(() => console.info('OUTPUT'), 10);
        setInterval(() => {}, 1_000);
      `);
      const handle = Process.spawn({ args, readySignal: Process.Signal.ready, silent: true });
      handle.onStdOut((event) => {
        if (event.toString() !== 'OUTPUT\n') return;
        output.resolve();
        throw failure;
      });

      await handle.whenReady();
      await output.promise;
      await waitForTerminal(handle);
      const disposeError = await ProcessTest.catchErrorWithin(() => handle.dispose());

      expectSingleCleanupFailure(disposeError, failure, ['stdout:handler', 'stdout:pump']);
      expect(handle.disposed).to.eql(true);
    });

    it('status failure after readiness → requests lifecycle disposal', async () => {
      const failure = new Error('status:after-ready-failure');
      const status = Promise.withResolvers<Deno.CommandStatus>();
      const stdout = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`${Process.Signal.ready}\n`));
        },
      });
      const stderr = new ReadableStream<Uint8Array>();
      const child = fakeChild({ status: status.promise, stdout, stderr });
      const handle = spawnWith(
        { spawnChild: () => child, terminationGraceTimeout: 1 as t.Msecs },
        { args: [], readySignal: Process.Signal.ready, silent: true },
      );

      await handle.whenReady();
      status.reject(failure);
      await waitForTerminal(handle);
      const disposeError = await ProcessTest.catchErrorWithin(() => handle.dispose());

      expect(disposeError).to.equal(failure);
      expect(handle.disposed).to.eql(true);
    });

    it('termination and stream failures → preserves phase order and cancellation truth', async () => {
      const termFailure = new Error('termination:SIGTERM');
      const killFailure = new Error('termination:SIGKILL');
      const stdoutFailure = new Error('stdout:cancel');
      const stderrFailure = new Error('stderr:cancel');
      const status = new Promise<Deno.CommandStatus>(() => undefined);
      const stream = (failure: Error) =>
        new ReadableStream<Uint8Array>({
          cancel() {
            throw failure;
          },
        });
      const child = fakeChild({
        status,
        stdout: stream(stdoutFailure),
        stderr: stream(stderrFailure),
        kill(signal) {
          throw signal === 'SIGTERM' ? termFailure : killFailure;
        },
      });
      const handle = spawnWith(
        {
          spawnChild: () => child,
          terminationGraceTimeout: 1 as t.Msecs,
          terminationSettleTimeout: 1 as t.Msecs,
        },
        { args: [], silent: true },
      );

      const error = await ProcessTest.catchErrorWithin(() => handle.dispose());

      expect(error).to.be.instanceOf(AggregateError);
      if (!(error instanceof AggregateError)) throw error;
      expect(error.errors.length).to.eql(5);
      expect(error.errors.slice(0, 2)).to.eql([termFailure, killFailure]);
      expect(error.errors.slice(3)).to.eql([stdoutFailure, stderrFailure]);
      expect(cleanupFailures(error).map((entry) => entry.phases[0])).to.eql([
        'signal:SIGTERM',
        'signal:SIGKILL',
        'status:settle',
        'stdout:cancel',
        'stderr:cancel',
      ]);
    });

    it('errored stream read → preserves one identity with every causal phase', async () => {
      const failure = new Error('stdout:substrate');
      const status = Promise.withResolvers<Deno.CommandStatus>();
      const stdout = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.error(failure);
        },
      });
      const stderr = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.close();
        },
      });
      const child = fakeChild({
        status: status.promise,
        stdout,
        stderr,
        kill(signal) {
          status.resolve({ success: true, code: 0, signal });
        },
      });
      const handle = spawnWith(
        { spawnChild: () => child, streamTimeout: 1 as t.Msecs },
        { args: [], silent: true },
      );

      await waitForTerminal(handle);
      const error = await ProcessTest.catchErrorWithin(() => handle.dispose());

      expectSingleCleanupFailure(error, failure, [
        'stdout:read',
        'stdout:pump',
        'stdout:cancel',
      ]);
      expect(stdout.locked).to.eql(false);
      expect(stderr.locked).to.eql(false);
    });

    it('distinct stream read and release failures → preserves both identities', async () => {
      const readFailure = new Error('stdout:read');
      const releaseFailure = new Error('stdout:release');
      const status = Promise.withResolvers<Deno.CommandStatus>();
      let stdoutLocked = true;
      const stdoutReader = {
        read: () => Promise.reject(readFailure),
        cancel: () => {
          stdoutLocked = false;
          return Promise.resolve();
        },
        releaseLock: () => {
          throw releaseFailure;
        },
      } as unknown as ReadableStreamDefaultReader<Uint8Array>;
      const stdout = {
        get locked() {
          return stdoutLocked;
        },
        getReader: () => stdoutReader,
        cancel: () => {
          stdoutLocked = false;
          return Promise.resolve();
        },
      } as unknown as ReadableStream<Uint8Array>;
      const stderr = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.close();
        },
      });
      const child = fakeChild({
        status: status.promise,
        stdout,
        stderr,
        kill(signal) {
          status.resolve({ success: true, code: 0, signal });
        },
      });
      const handle = spawnWith(
        { spawnChild: () => child, streamTimeout: 1 as t.Msecs },
        { args: [], silent: true },
      );

      await waitForTerminal(handle);
      const error = await ProcessTest.catchErrorWithin(() => handle.dispose());

      expect(error).to.be.instanceOf(AggregateError);
      if (!(error instanceof AggregateError)) throw error;
      expect(error.errors).to.eql([readFailure, releaseFailure]);
      expect(error.cause).to.equal(readFailure);
      const failures = cleanupFailures(error);
      expect(failures.map((entry) => entry.error)).to.eql([readFailure, releaseFailure]);
      expect(failures.map((entry) => entry.phases)).to.eql([
        ['stdout:read', 'stdout:pump'],
        ['stdout:release'],
      ]);
      expect(stdout.locked).to.eql(false);
      expect(stderr.locked).to.eql(false);
    });

    it('operation then termination failures → preserves causal identities and phases', async () => {
      const operationFailure = new Error('stdout:handler');
      const termFailure = new Error('termination:SIGTERM');
      const killFailure = new Error('termination:SIGKILL');
      const status = new Promise<Deno.CommandStatus>(() => undefined);
      let stdoutController: ReadableStreamDefaultController<Uint8Array> | undefined;
      const stdout = new ReadableStream<Uint8Array>({
        start(controller) {
          stdoutController = controller;
        },
      });
      const stderr = new ReadableStream<Uint8Array>();
      const child = fakeChild({
        status,
        stdout,
        stderr,
        kill(signal) {
          throw signal === 'SIGTERM' ? termFailure : killFailure;
        },
      });
      const handle = spawnWith(
        {
          spawnChild: () => child,
          streamTimeout: 1 as t.Msecs,
          terminationGraceTimeout: 1 as t.Msecs,
          terminationSettleTimeout: 1 as t.Msecs,
        },
        { args: [], silent: true },
      );
      let completed = 0;
      const subscription = handle.$.subscribe({ complete: () => completed++ });
      handle.onStdOut(() => {
        throw operationFailure;
      });

      stdoutController?.enqueue(new TextEncoder().encode('OUTPUT\n'));
      await waitForTerminal(handle);
      const error = await ProcessTest.catchErrorWithin(() => handle.dispose());

      expect(completed).to.eql(1);
      expect(subscription.closed).to.eql(true);
      let lateCompleted = 0;
      const late = handle.$.subscribe({ complete: () => lateCompleted++ });
      expect(lateCompleted).to.eql(1);
      expect(late.closed).to.eql(true);
      expect(error).to.be.instanceOf(AggregateError);
      if (!(error instanceof AggregateError)) throw error;
      expect(error.cause).to.equal(operationFailure);
      expect(error.errors.slice(0, 3)).to.eql([operationFailure, termFailure, killFailure]);
      const failures = cleanupFailures(error);
      expect(failures[0].phases).to.eql(['stdout:handler', 'stdout:pump']);
      expect(failures.slice(0, 3).map((entry) => entry.error)).to.eql([
        operationFailure,
        termFailure,
        killFailure,
      ]);
    });

    it('status rejection before signal failures → remains causally first', async () => {
      const statusFailure = new Error('status:rejected');
      const termFailure = new Error('termination:SIGTERM');
      const killFailure = new Error('termination:SIGKILL');
      const status = Promise.withResolvers<Deno.CommandStatus>();
      const stdout = new ReadableStream<Uint8Array>();
      const stderr = new ReadableStream<Uint8Array>();
      const child = fakeChild({
        status: status.promise,
        stdout,
        stderr,
        kill(signal) {
          throw signal === 'SIGTERM' ? termFailure : killFailure;
        },
      });
      const handle = spawnWith(
        {
          spawnChild: () => child,
          streamTimeout: 1 as t.Msecs,
          terminationGraceTimeout: 1 as t.Msecs,
        },
        { args: [], silent: true },
      );

      status.reject(statusFailure);
      await waitForTerminal(handle);
      const error = await ProcessTest.catchErrorWithin(() => handle.dispose());

      expect(error).to.be.instanceOf(AggregateError);
      if (!(error instanceof AggregateError)) throw error;
      expect(error.errors.slice(0, 3)).to.eql([statusFailure, termFailure, killFailure]);
      expect(cleanupFailures(error).slice(0, 3).map((entry) => entry.phases[0])).to.eql([
        'status',
        'signal:SIGTERM',
        'signal:SIGKILL',
      ]);
    });

    it('stream cancellation timeout → rejects within the owned deadline', async () => {
      const status = Promise.withResolvers<Deno.CommandStatus>();
      const stdout = new ReadableStream<Uint8Array>({
        cancel() {
          return new Promise<void>(() => undefined);
        },
      });
      const stderr = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.close();
        },
      });
      const child = fakeChild({
        status: status.promise,
        stdout,
        stderr,
        kill(signal) {
          status.resolve({ success: true, code: 0, signal });
        },
      });
      const handle = spawnWith(
        { spawnChild: () => child, streamTimeout: 1 as t.Msecs },
        { args: [], silent: true },
      );

      const error = await ProcessTest.catchErrorWithin(() => handle.dispose(), 100);

      expect(error).to.be.instanceOf(AggregateError);
      if (!(error instanceof AggregateError)) throw error;
      expect(cleanupFailures(error).map((entry) => entry.phases[0])).to.eql([
        'stdout:settle',
        'stdout:cancel',
      ]);
      expect(handle.disposed).to.eql(true);
    });

    it('cleanup phases → share one aggregate deadline', async () => {
      const status = new Promise<Deno.CommandStatus>(() => undefined);
      const blockingStream = () =>
        new ReadableStream<Uint8Array>({
          cancel() {
            return new Promise<void>(() => undefined);
          },
        });
      const child = fakeChild({
        status,
        stdout: blockingStream(),
        stderr: blockingStream(),
      });
      const handle = spawnWith(
        {
          spawnChild: () => child,
          cleanupTimeout: 10 as t.Msecs,
          streamTimeout: 50 as t.Msecs,
          terminationGraceTimeout: 50 as t.Msecs,
          terminationSettleTimeout: 50 as t.Msecs,
        },
        { args: [], silent: true },
      );

      const error = await ProcessTest.catchErrorWithin(() => handle.dispose(), 100);

      expect(error).to.be.instanceOf(Error);
      expect(handle.disposed).to.eql(true);
    });

    it('spawn → until', async () => {
      const { dispose$, dispose } = Rx.lifecycle();
      const args = ProcessTest.evalArgs('console.log("👋")');
      const handle = Process.spawn({ args, silent: true, until: dispose$ });

      const fired: t.DisposeAsyncEvent[] = [];
      handle.dispose$.subscribe((e) => fired.push(e));

      expect(handle.disposed).to.eql(false);
      dispose();
      await Time.wait(50);
      expect(handle.disposed).to.eql(true);
      expect(fired.length).to.eql(2);
    });

    it('synchronous until → constructs before disposal starts', async () => {
      const args = ProcessTest.evalArgs('setInterval(() => {}, 1_000)');
      const handle = Process.spawn({
        args,
        silent: true,
        until: Rx.of({ reason: 'synchronous:until' }),
      });
      const fired: t.DisposeAsyncEvent[] = [];
      handle.dispose$.subscribe((event) => fired.push(event));

      expect(handle.disposed).to.eql(false);
      await waitForTerminal(handle);

      expect(handle.disposed).to.eql(true);
      expect(fired.map((event) => event.payload.stage)).to.eql(['start', 'complete']);
      expect(fired[0].payload.reason).to.eql('synchronous:until');
    });

    it('child stream setup failure → returns a terminal handle with rollback truth', async () => {
      const termFailure = new Error('setup:SIGTERM');
      const killFailure = new Error('setup:SIGKILL');
      const status = new Promise<Deno.CommandStatus>(() => undefined);
      const signals: Deno.Signal[] = [];
      const stdout = new ReadableStream<Uint8Array>();
      const stderr = new ReadableStream<Uint8Array>();
      const externalReader = stderr.getReader();
      const child = fakeChild({
        status,
        stdout,
        stderr,
        kill(signal) {
          signals.push(signal);
          throw signal === 'SIGTERM' ? termFailure : killFailure;
        },
      });

      try {
        const handle = spawnWith(
          {
            spawnChild: () => child,
            cleanupTimeout: 20 as t.Msecs,
            streamTimeout: 1 as t.Msecs,
            terminationGraceTimeout: 1 as t.Msecs,
            terminationSettleTimeout: 1 as t.Msecs,
          },
          { args: [], silent: true },
        );
        let outputCompleted = 0;
        const outputSubscription = handle.$.subscribe({ complete: () => outputCompleted++ });

        const readyError = await ProcessTest.catchErrorWithin(() => handle.whenReady(), 100);
        const completion = handle.dispose();
        expect(handle.dispose()).to.equal(completion);
        const cleanupError = await ProcessTest.catchErrorWithin(() => completion, 100);

        expect(readyError).to.be.instanceOf(TypeError);
        expect(cleanupError).to.be.instanceOf(AggregateError);
        if (!(cleanupError instanceof AggregateError)) throw cleanupError;
        const failures = cleanupFailures(cleanupError);
        expect(failures.map((entry) => entry.phases[0])).to.eql([
          'setup',
          'signal:SIGTERM',
          'signal:SIGKILL',
          'status:settle',
        ]);
        expect(failures[0].error).to.equal(readyError);
        expect(cleanupError.cause).to.equal(readyError);
        expect(signals).to.eql(['SIGTERM', 'SIGKILL']);
        expect(stdout.locked).to.eql(false);
        expect(handle.disposed).to.eql(true);
        expect(outputCompleted).to.eql(1);
        expect(outputSubscription.closed).to.eql(true);

        let lateCompleted = 0;
        const lateSubscription = handle.$.subscribe({ complete: () => lateCompleted++ });
        expect(lateCompleted).to.eql(1);
        expect(lateSubscription.closed).to.eql(true);
      } finally {
        externalReader.releaseLock();
      }
    });

    it('synchronous until → setup failure occurs before child ownership', async () => {
      const failure = new Error('Process.spawn:test:setup-failure');
      const args = ProcessTest.evalArgs('setTimeout(() => Deno.exit(0), 1_000)');
      Object.defineProperty(args, 'join', {
        value: () => {
          throw failure;
        },
      });

      let caught: unknown;
      try {
        Process.spawn({ args, silent: true, until: Rx.of(undefined) });
      } catch (error) {
        caught = error;
      }

      expect(caught).to.equal(failure);

      // The test sanitizer proves setup did not retain a child.
      await Time.wait(100);
    });
  });

  it('spawn → wait ("ready signal") → events', async () => {
    const test = async (readySignal: string) => {
      const env = { FOO: `tx.${slug()}` };
      const cmd = `
          setInterval(() => console.log(Deno.env.get('FOO')), 30);
          console.info('${readySignal}');
        `;
      const args = ProcessTest.evalArgs(cmd);
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

  it('spawn → wait rejects and disposes when child exits before ready', async () => {
    const args = ProcessTest.evalArgs('Deno.exit(7)');
    const handle = Process.spawn({ args, readySignal: 'NEVER_READY', silent: true });

    const error = await ProcessTest.catchErrorWithin(() => handle.whenReady());
    await waitForTerminal(handle);

    expect(error?.message).to.contain('Process.spawn: child exited before ready:');
    expect(error?.message).to.contain('code=7');
    expect(handle.disposed).to.eql(true);
  });

  it('spawn → child exits after readiness → drains output and disposes', async () => {
    const args = ProcessTest.evalArgs(`
      console.info('${Process.Signal.ready}');
      setTimeout(() => console.info('FINAL_OUTPUT'), 10);
    `);
    const output: string[] = [];
    const observed: string[] = [];
    let completed = 0;
    const handle = Process.spawn({ args, readySignal: Process.Signal.ready, silent: true });
    handle.onStdOut((event) => output.push(event.toString()));
    const subscription = handle.$.subscribe({
      next: (event) => observed.push(event.toString()),
      complete: () => completed++,
    });

    await handle.whenReady();
    await waitForTerminal(handle);

    expect(output.join('')).to.contain('FINAL_OUTPUT\n');
    expect(observed.join('')).to.contain('FINAL_OUTPUT\n');
    expect(completed).to.eql(1);
    expect(subscription.closed).to.eql(true);
    expect(handle.disposed).to.eql(true);
    await handle.dispose();

    let lateCompleted = 0;
    const lateSubscription = handle.$.subscribe({ complete: () => lateCompleted++ });
    expect(lateCompleted).to.eql(1);
    expect(lateSubscription.closed).to.eql(true);
  });

  it('spawn → wait rejects when disposed before ready', async () => {
    const args = ProcessTest.evalArgs('setInterval(() => {}, 1_000)');
    const handle = Process.spawn({ args, readySignal: 'NEVER_READY', silent: true });
    const errorPromise = ProcessTest.catchErrorWithin(() => handle.whenReady());

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
    const args = ProcessTest.evalArgs(cmd);
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
    const args = ProcessTest.evalArgs(cmd);
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

/**
 * Helpers:
 */
function cleanupFailures(error: AggregateError) {
  const failures = Reflect.get(error, 'failures');
  if (!Is.array<FailureRecord<SpawnFailurePhase>>(failures)) {
    throw new Error('Expected owned-process cleanup failure detail.');
  }
  return failures;
}

function expectSingleCleanupFailure(
  error: unknown,
  failure: unknown,
  phases: readonly SpawnFailurePhase[],
) {
  expect(error).to.be.instanceOf(AggregateError);
  if (!(error instanceof AggregateError)) throw error;
  expect(error.errors).to.eql([failure]);
  expect(error.cause).to.equal(failure);
  const records = cleanupFailures(error);
  expect(records.length).to.eql(1);
  expect(records[0].error).to.equal(failure);
  expect(records[0].phases).to.eql(phases);
}

function fakeChild(input: {
  status: Promise<Deno.CommandStatus>;
  stdout: ReadableStream<Uint8Array>;
  stderr: ReadableStream<Uint8Array>;
  kill?: (signal: Deno.Signal) => void;
}) {
  return {
    pid: 101,
    status: input.status,
    stdout: input.stdout,
    stderr: input.stderr,
    kill: input.kill ?? (() => undefined),
  } as unknown as Deno.ChildProcess;
}

async function waitForTerminal(life: t.LifecycleAsync) {
  if (life.disposed) return;

  const terminal = Promise.withResolvers<void>();
  const subscription = life.dispose$.subscribe((event) => {
    if (event.payload.is.done) terminal.resolve();
  });
  if (life.disposed) terminal.resolve();

  const timeout = Time.delay(1_000);
  const waitForDispose = async () => {
    await terminal.promise;
    return true;
  };
  const waitForTimeout = async () => {
    await timeout;
    return false;
  };

  try {
    const completed = await Promise.race([waitForDispose(), waitForTimeout()]);
    if (!completed) throw new Error('Timed out waiting for process disposal');
  } finally {
    subscription.unsubscribe();
    timeout.cancel();
  }
}
