import { describe, expect, it, type t } from '../../-test.ts';
import { Zip } from '../mod.ts';
import { drain, rejected } from './u.fixture.extract.ts';
import { zip } from './u.fixture.ts';

const WORK = { timeout: 10_000 };
const BLOCK = 64 * 1024;

/** Queue an action at an exact promise-continuation offset, without an async wrapper. */
function after(turns: number, fn: () => void): Promise<void> {
  let queued = Promise.resolve();
  for (let i = 0; i < turns; i++) queued = queued.then(() => {});
  return queued.then(fn);
}

/** Runtime promise state, not an observer that itself adds another continuation window. */
function pending(promise: Promise<unknown>): boolean {
  return Deno.inspect(promise) === 'Promise { <pending> }';
}

function file(entries: readonly t.Zip.Extract.TreeEntry[]): t.Zip.Extract.TreeFile {
  const entry = entries[0];
  if (entry.kind !== 'file') throw new Error('Missing fixture file');
  return entry;
}

describe('@sys/archive/zip: public settlement boundaries', () => {
  it('cancellation at every tested continuation offset rejects still-pending public demand without bytes', async () => {
    // Fail visibly if a runtime changes the inspection format, rather than silently weakening proof.
    expect(pending(new Promise(() => {}))).to.eql(true);
    expect(pending(Promise.resolve())).to.eql(false);
    const archive = await Zip.open(zip([{ name: 'a', data: 'payload' }]).bytes, WORK);
    for (let turns = 0; turns <= 10; turns++) {
      const controller = new AbortController();
      let wasPending = false;
      let exposed = false;
      await rejected(
        archive.extractTo({
          async writeTree(entries) {
            const demand = file(entries).content[Symbol.asyncIterator]().next();
            const stopping = after(turns, () => {
              wasPending = pending(demand);
              controller.abort();
            });
            try {
              exposed = !(await demand).done;
            } catch { /* Inspect the operation below. */ }
            await stopping;
          },
        }, { ...WORK, until: controller.signal }),
        'cancelled',
      );
      expect(wasPending && exposed, `offset ${turns}`).to.eql(false);
    }
  });

  it('continuation-window overlap cannot release the slot before the public promise settles', async () => {
    const archive = await Zip.open(
      zip([{ name: 'a', data: new Uint8Array(BLOCK * 2) }]).bytes,
      WORK,
    );
    for (let turns = 0; turns <= 10; turns++) {
      let overlap = false;
      let failure: unknown;
      try {
        await archive.extractTo({
          async writeTree(entries) {
            const iterator = file(entries).content[Symbol.asyncIterator]();
            const first = iterator.next();
            let second: Promise<IteratorResult<Uint8Array>> | undefined;
            const queued = after(turns, () => {
              overlap = pending(first);
              second = iterator.next();
              void second.catch(() => {});
            });
            await Promise.allSettled([first, queued]);
            await second?.catch(() => {});
            try {
              while (!(await iterator.next()).done) { /* Drain any remaining content. */ }
            } catch { /* A caught explicit violation must still fail the operation. */ }
          },
        }, WORK);
      } catch (cause) {
        failure = cause;
      }
      if (overlap) {
        expect(Zip.Is.failure(failure), `offset ${turns}`).to.eql(true);
        expect(failure).to.include({ operation: 'extract', kind: 'sink-protocol' });
      } else expect(failure, `offset ${turns}`).to.eql(undefined);
    }
  });

  it('continuation-window early return joins pending demand without exposing its bytes', async () => {
    const archive = await Zip.open(
      zip([{ name: 'a', data: new Uint8Array(BLOCK * 2) }]).bytes,
      WORK,
    );
    for (let turns = 0; turns <= 10; turns++) {
      let wasPending = false;
      let exposed = false;
      await rejected(
        archive.extractTo({
          async writeTree(entries) {
            const iterator = file(entries).content[Symbol.asyncIterator]();
            const demand = iterator.next();
            let closing: Promise<IteratorResult<Uint8Array>> | undefined;
            const queued = after(turns, () => {
              wasPending = pending(demand);
              closing = iterator.return?.();
            });
            try {
              exposed = !(await demand).done;
            } catch { /* Incomplete cleanup. */ }
            await queued;
            await closing;
          },
        }, WORK),
        'sink-protocol',
      );
      expect(wasPending && exposed, `offset ${turns}`).to.eql(false);
    }
  });

  it('fulfilled incomplete sinks cannot be rescued by later acquisition or demand', async () => {
    const archive = await Zip.open(zip([{ name: 'empty' }]).bytes, WORK);
    for (const acquireFirst of [false, true]) {
      for (let turns = 1; turns <= 8; turns++) {
        let late: Promise<void> | undefined;
        const extraction = archive.extractTo({
          writeTree(entries) {
            const content = file(entries).content;
            const iterator = acquireFirst ? content[Symbol.asyncIterator]() : undefined;
            late = after(turns, async () => {
              await (iterator ?? content[Symbol.asyncIterator]()).next();
            });
            void late.catch(() => {});
            return Promise.resolve();
          },
        }, WORK);
        const observed = await Promise.allSettled([extraction]);
        await late?.catch(() => {});
        expect(observed[0].status, `offset ${turns}, acquired ${acquireFirst}`).to.eql('rejected');
        await rejected(extraction, 'sink-protocol');
      }
    }
  });

  it('successful cleanup callbacks cannot rewrite success through retained sources or iterators', async () => {
    const archive = await Zip.open(zip([{ name: 'empty' }]).bytes, WORK);
    let calls = 0;
    const late: Promise<unknown>[] = [];
    const result = await archive.extractTo({
      async writeTree(entries, options) {
        const content = file(entries).content;
        const iterator = content[Symbol.asyncIterator]();
        await iterator.next();
        options.until.addEventListener('abort', () => {
          calls++;
          try {
            content[Symbol.asyncIterator]();
          } catch { /* Revocation cannot rewrite success. */ }
          late.push(rejected(iterator.next(), 'sink-protocol'));
          late.push(rejected(Promise.resolve().then(() => iterator.return?.()), 'sink-protocol'));
        });
      },
    }, WORK);
    await Promise.all(late);
    expect(calls).to.eql(1);
    expect(result.kind).to.eql('extracted');
  });

  it('instance-shadowed signal listener methods never execute as trusted payload or cleanup work', async () => {
    const corrupt = await Zip.open(zip([{ name: 'bad', data: 'abc', crc32: 0 }]).bytes, WORK);
    let borrowed: unknown;
    try {
      await corrupt.test(WORK);
    } catch (cause) {
      borrowed = cause;
    }
    expect(Zip.Is.failure(borrowed)).to.eql(true);
    for (const method of [0, 8] as const) {
      const archive = await Zip.open(zip([{ name: 'a', data: 'payload', method }]).bytes, WORK);
      for (const property of ['addEventListener', 'removeEventListener']) {
        for (const accessor of [false, true]) {
          for (const cause of [new Error('sink callback'), borrowed]) {
            let calls = 0;
            const result = await archive.extractTo({
              async writeTree(entries, options) {
                const trap = () => {
                  calls++;
                  throw cause;
                };
                Object.defineProperty(
                  options.until,
                  property,
                  accessor ? { get: trap } : { value: trap },
                );
                await drain(entries);
              },
            }, WORK);
            expect(result.kind).to.eql('extracted');
            expect(calls).to.eql(0);
          }
        }
      }
    }
  });
});
