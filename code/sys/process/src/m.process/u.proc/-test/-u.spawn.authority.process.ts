// Permission-scoped process proof: deliberately not named `*.test.ts`.
// Run only through `deno task test:process`; default unit permissions are broader.
import { describe, expect, it, Time } from '../../../-test.ts';
import { Process } from '../../mod.ts';
import { ProcessTest } from '../../-test/u.fixture.ts';

describe('Process.spawn finite run authority', () => {
  it('owned child handle → dispose without ambient run authority', async () => {
    const owned = await Deno.permissions.query({ name: 'run', command: Deno.execPath() });
    const deniedCommands = ['sh', 'node', 'npm'];
    const denied = await Promise.all(
      deniedCommands.map((command) =>
        ProcessTest.catchError(() => new Deno.Command(command).output())
      ),
    );
    expect(owned.state).to.eql('granted');
    expect(denied.map((error) => error?.name)).to.eql(
      deniedCommands.map(() => 'NotCapable'),
    );

    const ambientInspection = await ProcessTest.catchError(() => {
      Process.isRunning(Deno.pid);
      return Promise.resolve();
    });
    expect(ambientInspection?.name).to.eql('NotCapable');

    const tailMarker = 'PROCESS_SHUTDOWN_TAIL';
    const args = ProcessTest.evalArgs(`
      Deno.addSignalListener('SIGTERM', () => {
        console.info('${tailMarker}');
        setTimeout(() => Deno.exit(0), 10);
      });
      console.info('${Process.Signal.ready}');
      setInterval(() => {}, 1_000);
    `);
    await using handle = Process.spawn({
      args,
      readySignal: Process.Signal.ready,
      silent: true,
    });

    const handled: string[] = [];
    const observed: string[] = [];
    let completed = 0;
    handle.onStdOut((event) => handled.push(event.toString()));
    const subscription = handle.$.subscribe({
      next: (event) => observed.push(event.toString()),
      complete: () => completed++,
    });

    await handle.whenReady();
    const started = performance.now();
    await handle.dispose();
    const elapsed = performance.now() - started;

    expect(elapsed).to.lessThan(2_000);
    expect(handled.join('')).to.contain(`${tailMarker}\n`);
    expect(observed.join('')).to.contain(`${tailMarker}\n`);
    expect(completed).to.eql(1);
    expect(subscription.closed).to.eql(true);
    expect(handle.disposed).to.eql(true);

    let lateCompleted = 0;
    const late = handle.$.subscribe({ complete: () => lateCompleted++ });
    expect(lateCompleted).to.eql(1);
    expect(late.closed).to.eql(true);
  });

  it('owned child ignores SIGTERM → public disposal escalates and settles', async () => {
    const marker = 'PROCESS_FORCE_READY';
    const termMarker = 'PROCESS_TERM_OBSERVED';
    const args = ProcessTest.evalArgs(`
      Deno.addSignalListener('SIGTERM', () => console.info('${termMarker}'));
      console.info('${marker}');
      setInterval(() => {}, 1_000);
    `);
    const handle = Process.spawn({ args, readySignal: marker, silent: true });

    const output: string[] = [];
    let completed = 0;
    const subscription = handle.$.subscribe({
      next: (event) => output.push(event.toString()),
      complete: () => completed++,
    });

    await handle.whenReady();
    const started = performance.now();
    await handle.dispose();
    const elapsed = performance.now() - started;

    expect(output.join('')).to.contain(`${termMarker}\n`);
    expect(elapsed).to.lessThan(10_000);
    expect(completed).to.eql(1);
    expect(subscription.closed).to.eql(true);
    expect(handle.disposed).to.eql(true);
  });

  it('ambient PID signalling and PID redirection → cannot target another child', async () => {
    const ownerArgs = ProcessTest.evalArgs(`
      console.info('OWNER_READY');
      setInterval(() => {}, 1_000);
    `);
    const bystanderArgs = ProcessTest.evalArgs(`
      console.info('BYSTANDER_READY');
      setInterval(() => console.info('BYSTANDER_PULSE'), 20);
    `);
    await using owner = Process.spawn({
      args: ownerArgs,
      readySignal: 'OWNER_READY',
      silent: true,
    });
    await using bystander = Process.spawn({
      args: bystanderArgs,
      readySignal: 'BYSTANDER_READY',
      silent: true,
    });

    await Promise.all([owner.whenReady(), bystander.whenReady()]);
    const ambientSignal = await ProcessTest.catchError(() => {
      Deno.kill(bystander.pid, 'SIGTERM');
      return Promise.resolve();
    });
    expect(ambientSignal?.name).to.eql('NotCapable');

    const redirected = Reflect.set(owner, 'pid', bystander.pid);
    expect(redirected).to.eql(true);
    expect(owner.pid).to.eql(bystander.pid);

    let ownerDisposed = false;
    const pulse = Promise.withResolvers<void>();
    bystander.onStdOut((event) => {
      if (ownerDisposed && event.toString() === 'BYSTANDER_PULSE\n') pulse.resolve();
    });

    await owner.dispose();
    ownerDisposed = true;
    const timeout = Time.delay(500);
    const survived = await Promise.race([
      pulse.promise.then(() => true),
      timeout.then(() => false),
    ]);
    timeout.cancel();

    expect(survived).to.eql(true);
    expect(bystander.disposed).to.eql(false);
  });
});
