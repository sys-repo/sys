import { describe, expect, it } from '../../-test.ts';

type Result = {
  readonly descriptorsRestored: boolean;
  readonly namespaceClassifies: boolean;
  readonly poisonCalls: number;
};

type Reply = { ok: true; value: Result } | { ok: false; error: string };

describe('Is.Native capture authority', () => {
  it('module evaluation → later host-classifier replacement cannot redirect predicates', async () => {
    expect(await runFixture()).to.eql({
      descriptorsRestored: true,
      namespaceClassifies: true,
      poisonCalls: 0,
    });
  });
});

async function runFixture(): Promise<Result> {
  const url = new URL('./u.fixture.native-capture.worker.ts', import.meta.url);
  const worker = new Worker(url, { type: 'module' });
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await new Promise<Result>((resolve, reject) => {
      timer = setTimeout(() => reject(new Error('Is.Native capture fixture timed out.')), 5_000);
      worker.onerror = (event) => {
        event.preventDefault();
        reject(new Error(`Is.Native capture fixture failed: ${event.message}`));
      };
      worker.onmessage = (event: MessageEvent<Reply>) => {
        const reply = event.data;
        if (reply.ok) resolve(reply.value);
        else reject(new Error(reply.error));
      };
      worker.postMessage(undefined);
    });
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    worker.onerror = null;
    worker.onmessage = null;
    worker.terminate();
  }
}
