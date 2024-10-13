import { DEFAULTS, R, type t } from './common.ts';
import { fromBinary } from './Doc.u.binary.ts';
import { get } from './Doc.u.get.ts';
import { Handle, Mutate } from './u.ts';

type O = Record<string, unknown>;

/**
 * Find or initialize a new document from the repo.
 */
export async function getOrCreate<T extends O>(args: {
  repo: t.AutomergeRepo;
  initial: t.ImmutableMutator<T> | Uint8Array;
  uri?: t.StringUri;
  dispose$?: t.UntilObservable;
  timeout?: t.Msecs;
}): Promise<t.DocWithHandle<T>> {
  const { initial, repo, uri, timeout, dispose$ } = args;

  /**
   * Lookup existing URI requested.
   */
  if (uri) {
    const res = await get({ repo, uri, timeout, dispose$, throw: true });
    return res as t.DocWithHandle<T>;
  }

  /**
   * From binary: "hard-coded byte array hack"
   */
  if (initial instanceof Uint8Array) {
    const binary = initial;
    return fromBinary({ repo, binary, uri, dispose$ });
  }

  /**
   * New document initialization.
   */
  const handle = repo.create<T>();
  await handle.whenReady();

  handle.change((d: any) => {
    initial(d);

    // Ensure the initializer function caused a change such that the
    // initial genesis timestamp is written into the commit history.
    if (R.equals(d, {})) Mutate.emptyChange(d);
  }, DEFAULTS.genesis.options());

  // Finish up.
  return Handle.wrap<T>(handle, { dispose$ });
}
