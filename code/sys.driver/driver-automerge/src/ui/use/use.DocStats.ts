import { useEffect, useState } from 'react';
import { type t, CrdtCmd, Rx } from './common.ts';

/**
 * Hook that computes and tracks stats for the given CRDT doc-id.
 */
export const useDocStats: t.UseCrdtDocStats = (repo, docid) => {
  const [info, setInfo] = useState<t.DocumentStats>();

  useEffect(() => {
    // Reset whenever the driving inputs change.
    setInfo(undefined);

    if (!repo || !docid) return;
    const life = Rx.lifecycle();
    const cmd = CrdtCmd.fromRepo(repo, life);

    (async () => {
      try {
        const stats = await cmd.send('stats', { doc: docid });
        if (!life.disposed) setInfo(stats);
      } catch {}
    })();

    return life.dispose;
  }, [repo?.id, docid]);

  return { info };
};
