import { useEffect, useState } from 'react';
import { type t, CrdtCmd, Rx } from './common.ts';

/**
 * Hook that computes and tracks stats for the given CRDT doc.
 *
 * Accepts either:
 * - a document ref (`t.Crdt.Ref`), or
 * - a document-id (`t.StringDocumentId`) to resolve via `repo.get`.
 */
export const useDocStats: t.UseCrdtDocStats = (repo, docid) => {
  const [info, setInfo] = useState<t.DocumentStats>();
  const [error, setError] = useState<t.StdError>();

    }

    update();
    return life.dispose;
  }, [repo?.id, docid]);

  return { info, error };
};
