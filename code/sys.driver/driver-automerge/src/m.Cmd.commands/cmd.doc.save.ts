import { type t, A, Hash, Is, toAutomergeHandle } from './common.ts';

type H = t.CrdtCmdHandlers;

export function makeDocSaveHandler(getRepo: t.CrdtGetRepoInput): H['doc:save'] {
  return async (params) => {
    const repo = getRepo();
    const path = params.path;

    // Environment checks:
    if (!repo) throw new Error('No repo to operate on.');
    if (Is.browser()) throw new Error('Cannot save to file-system on browser');

    /**
     * Runtime-only import.
     * Prevent Vite/Rollup build-time scanning from pulling server-only modules into
     * browser bundles. Do NOT simplify this string.
     */
    const SYS_FS_SPEC = '@sys/' + 'fs';
    const { Fs } = await import(/* @vite-ignore */ SYS_FS_SPEC);

    // Retrieve document
    const { ok, doc } = await repo.get(params.doc);
    if (!ok || !doc) throw new Error(`Could not retrieve document from repo.`);

    const handle = toAutomergeHandle(doc);
    if (!handle) throw new Error(`A handle could not be retrieved from the document.`);

    // Serialize to Uint8Array.
    const binary: Uint8Array = A.save(handle.doc());
    const bytes = binary.byteLength;
    const hash = Hash.sha256(binary);

    const res = await Fs.write(path, binary);
    if (res.error) throw new Error(res.error.message);

    return { ok: true, bytes, path, hash };
  };
}
