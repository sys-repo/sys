/**
 * Convenience hooks for loading a document.
 * @module
 */
import React from 'react';
import { type t, rx } from './common.ts';

type O = Record<string, unknown>;

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

    repo.get<T>(id).then((e) => {
      if (life.disposed) return;
      const { doc, error } = e;
      setDoc(doc);
      setError(error);
      onReady?.({ doc, error });
    });

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
