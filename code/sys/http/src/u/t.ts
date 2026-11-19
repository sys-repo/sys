import type { t } from '../common.ts';

/** Package-private HTTP deadline and body-lease ownership; no transport classification. */
export type HttpOperation<TCause> = t.Disposable & {
  readonly signal: AbortSignal;
  readonly terminal: TCause | undefined;
  stop(cause: TCause): void;
  /** Observe elapsed synchronous work without throwing the terminal cause. */
  checkDeadline(): void;
  throwIfStopped(): void;
  race<V>(input: PromiseLike<V>): Promise<V>;
  raceFetch(input: Promise<Response>): Promise<Response>;
  cancelBody(body: ReadableStream<Uint8Array> | null): Promise<void>;
  cancelReader(
    body: ReadableStream<Uint8Array>,
    reader: ReadableStreamDefaultReader<Uint8Array>,
  ): Promise<void>;
  cancelResponse(response: Response): Promise<void>;
};
