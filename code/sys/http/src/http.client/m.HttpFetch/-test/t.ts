import type { t } from '../../../-test.ts';
import type { Operation } from '../u/t.ts';

/** Per-test body reader ownership; read preserves the production promise without another hop. */
export type BodyFixture = t.Disposable & {
  readonly controller: AbortController;
  readonly operation: Operation;
  readonly timeout: t.Msecs;
  readonly read: (
    body: ReadableStream<Uint8Array>,
    onProgress: t.HttpFetch.ResponsePolicy.ProgressHandler,
  ) => Promise<Uint8Array<ArrayBuffer>>;
};
