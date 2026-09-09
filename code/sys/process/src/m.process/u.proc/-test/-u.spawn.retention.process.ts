// Permission-scoped process proof: deliberately not named `*.test.ts`.
// Run only through `deno task test:retention` with exposed GC and no runtime permissions.
import { describe, expect, Is, it, type t, Time } from '../../../-test.ts';
import { spawnWith } from '../u.spawn.ts';

type OwnedReferences = Record<string, WeakRef<object>>;

describe('Process.spawn terminal retention', () => {
  it('fulfilled cleanup → retained handle releases owned capabilities', async () => {
    await expectOwnedCapabilitiesReleased(false);
  });

  it('rejected cleanup → retained handle releases owned capabilities', async () => {
    await expectOwnedCapabilitiesReleased(true);
  });
});

async function expectOwnedCapabilitiesReleased(rejectCleanup: boolean) {
  const references: OwnedReferences = {};
  const { cleanupFailed, handle } = await createDisposedHandle(rejectCleanup, references);

  expect(cleanupFailed).to.eql(rejectCleanup);
  expect(handle.disposed).to.eql(true);
  expect(Object.keys(references).sort()).to.eql([
    'child',
    'status',
    'stderr:reader',
    'stderr:stream',
    'stdout:reader',
    'stdout:stream',
  ]);
  expect(await retainedReferenceNames(references)).to.eql([]);
  expect(handle.disposed).to.eql(true); // Keep the public handle live through the collection proof.
}

async function createDisposedHandle(
  rejectCleanup: boolean,
  references: OwnedReferences,
) {
  const streamFailure = rejectCleanup ? new Error('stdout:substrate') : undefined;
  const child = trackedChild(references, streamFailure);

  const handle = spawnWith(
    {
      spawnChild: oneShotSpawn(child),
      cleanupTimeout: 20 as t.Msecs,
      streamTimeout: 1 as t.Msecs,
      terminationGraceTimeout: 1 as t.Msecs,
      terminationSettleTimeout: 1 as t.Msecs,
    },
    { args: [], silent: true },
  );

  let cleanupFailed = false;
  try {
    await handle.dispose();
  } catch {
    cleanupFailed = true;
  }
  return { cleanupFailed, handle };
}

function trackedChild(references: OwnedReferences, streamFailure?: Error) {
  const status = Promise.withResolvers<Deno.CommandStatus>();
  references.status = new WeakRef(status.promise);
  const child = {
    pid: 601,
    status: status.promise,
    stdout: trackedStream('stdout', references, streamFailure),
    stderr: trackedStream('stderr', references),
    kill(signal: Deno.Signal) {
      status.resolve({ success: true, code: 0, signal });
    },
  } as unknown as Deno.ChildProcess;
  references.child = new WeakRef(child);
  return child;
}

function oneShotSpawn(input: Deno.ChildProcess) {
  let child: Deno.ChildProcess | undefined = input;
  return () => {
    const output = child;
    child = undefined;
    if (!output) throw new Error('Test child was released before acquisition.');
    return output;
  };
}

function trackedStream(
  source: t.Process.StdStream,
  references: OwnedReferences,
  failure?: Error,
) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      if (failure === undefined) controller.close();
      else controller.error(failure);
    },
  });
  const getReader = stream.getReader.bind(stream);
  Object.defineProperty(stream, 'getReader', {
    value() {
      const reader = getReader();
      references[`${source}:reader`] = new WeakRef(reader);
      return reader;
    },
  });
  references[`${source}:stream`] = new WeakRef(stream);
  return stream;
}

async function retainedReferenceNames(references: OwnedReferences) {
  const collect = garbageCollector();
  let retained = Object.keys(references);

  for (let attempt = 0; attempt < 20; attempt++) {
    collect();
    await Time.delay(0);
    retained = Object.entries(references).flatMap(([name, reference]) =>
      reference.deref() === undefined ? [] : [name]
    );
    if (retained.length === 0) return retained;
    await Time.delay(0); // End the job that dereferenced each weak target before collecting again.
  }

  return retained;
}

function garbageCollector() {
  const collect = Reflect.get(globalThis, 'gc');
  if (!Is.func(collect)) {
    throw new Error('Expected --v8-flags=--expose-gc for the retention proof.');
  }
  return () => Reflect.apply(collect, globalThis, []);
}
