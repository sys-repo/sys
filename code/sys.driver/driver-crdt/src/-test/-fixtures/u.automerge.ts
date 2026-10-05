import { clone, free, from } from '@automerge/automerge';
import { initialNote } from './u.note.ts';

/** Clone native history into a separate writer; this is a control, not a driver facade. */
export function automergePair() {
  const owner = from(initialNote());
  const peer = clone(owner);
  return {
    owner,
    peer,
    [Symbol.dispose]() {
      free(owner);
      free(peer);
    },
  };
}
