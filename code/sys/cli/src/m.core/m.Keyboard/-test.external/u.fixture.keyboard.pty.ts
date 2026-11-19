import process from 'node:process';
import { Keyboard } from '../mod.ts';
import { Is as CliIs } from '../../m.Is/mod.ts';
import { expect, Is } from '../../../-test.ts';

console.info(`KEYBOARD_OWNER:${Deno.pid}`);
const [runner, mode] = Deno.args;
if (runner === 'test') {
  Deno.test({
    name: 'native keyboard owner',
    sanitizeOps: true,
    sanitizeResources: true,
    fn: main,
  });
} else {
  await main();
}

async function main() {
  // Deno.test captures stdout; input remains a real PTY and uses the production predicate.
  expect(CliIs.terminal('stdin')).to.eql(true);
  const before = await stty(['-g']);
  if (mode.startsWith('stop-')) {
    const schedule = mode.slice('stop-'.length);
    const until = Promise.withResolvers<void>();
    if (schedule === 'until-resolved') until.resolve();
    let calls = 0;
    const owner = Keyboard.bind({
      until: until.promise,
      onQuit() {
        calls += 1;
      },
      onKey() {
        calls += 1;
      },
    });
    if (!owner) throw new Error('Expected terminal keyboard binding.');
    if (schedule === 'dispose' || schedule === 'until') {
      // A real event-loop turn with raw input flowing, but no input bytes supplied.
      expect(await stty(['-g'])).not.to.eql(before);
      expect(process.stdin.readableFlowing).to.eql(true);
    }
    if (schedule.startsWith('until')) {
      until.resolve();
      await bounded(owner.finished);
    } else {
      await bounded(Keyboard.shutdown(owner));
    }
    expect(calls).to.eql(0);
    console.info('KEYBOARD_CLEAN');
    // End the child test here: no later input, reacquisition, or asynchronous terminal probe.
    return;
  }

  // The baseline precedes both APIs: assert end-to-end restoration, not intermediate
  // flags left by raw Cliffy before the managed owner acquires stdin.
  if (mode === 'raw-first') await rawKey('a');

  if (mode === 'already-raw') {
    process.stdin.setRawMode(true);
    const rawMode = await stty(['-g']);
    try {
      const owner = Keyboard.bind({ onQuit() {} });
      if (!owner) throw new Error('Expected binding over raw stdin.');
      await bounded(Keyboard.shutdown(owner));
      expect(process.stdin.isRaw).to.eql(true);
      expect(await stty(['-g'])).to.eql(rawMode);
    } finally {
      process.stdin.setRawMode(false);
    }
    expect(await stty(['-g'])).to.eql(before);
    console.info('KEYBOARD_CLEAN');
    return;
  }

  const raw = Keyboard.keypress(); // Acquisition alone must not couple raw/bind disposal.
  const until = Promise.withResolvers<void>();
  if (mode === 'until-resolved') until.resolve();
  let calls = 0;
  const first = Keyboard.bind({
    until: until.promise,
    onQuit() {
      calls += 1;
    },
  });
  if (!first) throw new Error('Expected terminal keyboard binding.');
  // Immediate means no await between acquisition and disposal: exercise queued native resume.
  if (!['immediate', 'until-immediate', 'until-resolved'].includes(mode)) {
    expect(await stty(['-g'])).not.to.eql(before);
  }
  if (mode.startsWith('until')) until.resolve();
  else first.dispose();
  await bounded(first.finished);
  expect(calls).to.eql(0);
  expect(raw.disposed).to.eql(false);
  expect(await stty(['-g'])).to.eql(before);

  if (mode === 'shared') {
    const observed: string[] = [];
    const received = Promise.withResolvers<void>();
    const owners = ['first', 'second'].map((name) => {
      const owner = Keyboard.bind({
        onQuit() {},
        onKey(event) {
          observed.push(`${name}:${event.key}`);
          if (observed.length === 2) received.resolve();
        },
      });
      if (!owner) throw new Error('Expected shared binding.');
      return owner;
    });
    console.info('KEYBOARD_INPUT:ab');
    await bounded(received.promise);
    owners[0].dispose();
    await bounded(Promise.all(owners.map((owner) => owner.finished)));
    expect(observed).to.eql(['first:a', 'second:b']);
    expect(await stty(['-g'])).to.eql(before);
  }

  const entered = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const second = Keyboard.bind({
    onQuit() {
      calls += 1;
    },
    async onKey(event) {
      expect(event.key).to.eql('r');
      entered.resolve();
      await release.promise;
      calls += 1;
    },
  });
  if (!second) throw new Error('Expected reusable stdin.');
  expect(await stty(['-g'])).not.to.eql(before);
  console.info(`KEYBOARD_INPUT:${mode === 'burst' ? 'rxxxxxxxxxxxxxxx' : 'r'}`);
  await bounded(entered.promise);
  let settled = false;
  const closing = (async () => {
    await Keyboard.shutdown(second);
    settled = true;
  })();
  await stty(['-g']); // A real asynchronous boundary while the callback remains held.
  expect(settled).to.eql(false);
  release.resolve();
  await bounded(closing);
  expect(calls).to.eql(1);
  expect(await stty(['-g'])).to.eql(before);

  // No old reader or read-ahead may intercept the next raw owner's input after finished.
  await rawKey('q', before);
  console.info('KEYBOARD_CLEAN');
}

async function rawKey(key: string, before?: string) {
  const keys = Keyboard.keypress();
  const next = keys.next();
  console.info(`KEYBOARD_INPUT:${key}`);
  expect((await bounded(next)).value?.key).to.eql(key);
  keys.dispose();
  if (before !== undefined) expect(await stty(['-g'])).to.eql(before);
}
// Natural process exit matters: no exit() or unref() may hide input work.

async function bounded<T>(work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Keyboard operation did not settle.')), 2_000);
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

// Independent terminal measurement; capture needs inherited stdin and captured stdout together.
async function stty(args: string[]) {
  const child = new Deno.Command('stty', {
    args,
    stdin: 'inherit',
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  let failure: unknown;
  const timer = setTimeout(() => {
    failure = new Error('Terminal measurement timed out.');
    try {
      child.kill('SIGKILL');
    } catch (error) {
      if (!Is.error(error) || error.name !== 'NotFound') failure = error;
    }
  }, 2_000);
  try {
    const result = await child.output();
    if (failure) throw failure;
    expect(result.code, new TextDecoder().decode(result.stderr)).to.eql(0);
    return new TextDecoder().decode(result.stdout).trim();
  } finally {
    clearTimeout(timer);
  }
}
