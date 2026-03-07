import { type t, Fs } from './common.ts';
import { fail } from './u.result.ts';

export async function readBytes(
  data: t.Signer.ResultData,
  path: t.StringPath,
  label: 'artifact' | 'signature',
): Promise<{ ok: true; bytes: Uint8Array } | { ok: false; res: t.Signer.ResultFail }> {
  const file = await Fs.read(path);
  if (!file.ok || !file.data) {
    const message =
      label === 'artifact' ? 'Failed to read artifact bytes.' : 'Failed to read signature bytes.';
    return {
      ok: false,
      res: fail(data, 'read', 'E_READ', file.error ?? { name: 'Error', message }),
    };
  }
  return { ok: true, bytes: file.data };
}
