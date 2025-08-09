/**
 * Convenience hooks for loading a document.
 * @module
 */
import React from 'react';
import { type t, rx, Time } from './common.ts';

type O = Record<string, unknown>;

/**
 * Fetch retry policy:
 */
const RETRY = {
  LIMIT: 5, //          ← maximum attempts (initial + 4 retries)
  DELAY: 1_000, //      ← first retry after 1s
  DELAY_MAX: 30_000, // ← cap the back-off delay
} as const;

export const useDoc: t.UseCrdtDoc = <T extends O = O>(
  repo?: t.Crdt.Repo,
  id?: t.StringDocumentId,
  onReady?: t.CrdtDocHookReadyHandler,
) => {
  /**
   * Hooks:
   */
  const [doc, setDoc] = React.useState<t.Crdt.Ref<T>>();
  const [error, setError] = React.useState<t.StdError>();

  /**
   * Effect: retrieve document.
   */
  React.useEffect(() => {
    if (!(repo && id)) return;

    const life = rx.lifecycle();
    const time = Time.until(life);
    let timer: t.TimeDelayPromise | undefined;
    let attempt = 0;

    const fetch = () => {
      repo.get<T>(id).then(({ doc, error }) => {
        if (life.disposed) return;

        if (error) {
          /**
           * Error: decide whether to retry.
           */
          attempt += 1;
          setDoc(undefined);
          setError(error);
          onReady?.({ doc: undefined, error });

          if (attempt <= RETRY.LIMIT) {
            const delay = Math.min(RETRY.DELAY * 2 ** (attempt - 1), RETRY.DELAY_MAX);
            timer = time.delay(delay, fetch);
          }
          return;
        }

        /**
         * Success: clear any existing timer and publish result.
         */
        timer?.cancel();
        setDoc(doc);
        setError(undefined);
        onReady?.({ doc, error: undefined });
      });
    };

    fetch(); // Kick-off immediately.

    return () => {
      life.dispose();
      setDoc(undefined);
      setError(undefined);
    };
  }, [repo?.id, id]);

  /**
   * API:
   */
  return { doc, error };
};
