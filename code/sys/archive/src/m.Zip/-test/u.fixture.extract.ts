import { expect, type t } from '../../-test.ts';
import { Zip } from '../mod.ts';

/** Consume every file through terminal next, including zero-byte files. */
export async function drain(entries: readonly t.Zip.Extract.TreeEntry[]): Promise<void> {
  for (const entry of entries) {
    if (entry.kind === 'file') {
      for await (const _bytes of entry.content) { /* Deliberately discard. */ }
    }
  }
}

/** Require a frozen owner-authenticated extraction failure, not a matching error message. */
export async function rejected(
  promise: Promise<unknown>,
  kind: t.Zip.Failure.Kind,
): Promise<t.Zip.Failure.Error> {
  try {
    await promise;
  } catch (error) {
    if (!Zip.Is.failure(error)) throw error;
    expect(error.operation).to.eql('extract');
    expect(error.kind).to.eql(kind);
    expect(Object.isFrozen(error)).to.eql(true);
    return error;
  }
  throw new Error(`Expected extract/${kind}`);
}
