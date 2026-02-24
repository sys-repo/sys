import { type t, Err, Fs, SignEd25519 } from './common.ts';
import { fail, ok } from './u.result.ts';

export const run: t.DistSigner.Lib['run'] = async (args) => {
  const data: t.Signer.ResultData = {
    target: 'content-manifest',
    mode: args.mode,
  };

  const artifact = await readBytes(data, args.artifact.path, 'artifact');
  if (!artifact.ok) return artifact.res;
  const artifactBytes = artifact.bytes;

  if (args.mode === 'sign') {
    try {
      const signature = await SignEd25519.sign({
        bytes: artifactBytes,
        privateKey: args.privateKey,
      });
      const written = await Fs.write(args.signature.path, signature);
      if (written.error) return fail(data, 'write', 'E_WRITE', written.error);
      return ok(data);
    } catch (cause) {
      return fail(
        data,
        'sign',
        'E_SIGN',
        Err.std('Dist signer failed while signing artifact bytes.', { cause }),
      );
    }
  }

  if (args.mode === 'verify') {
    try {
      const sig = await readBytes(data, args.signature.path, 'signature');
      if (!sig.ok) return sig.res;

      const valid = await SignEd25519.verify({
        bytes: artifactBytes,
        signature: sig.bytes,
        publicKey: args.publicKey,
      });
      if (!valid) return verifyFailed(data);
      return ok(data);
    } catch (cause) {
      return fail(
        data,
        'verify',
        'E_VERIFY',
        Err.std('Dist signer failed while verifying artifact bytes.', { cause }),
      );
    }
  }

  try {
    const signature = await SignEd25519.sign({ bytes: artifactBytes, privateKey: args.privateKey });
    const written = await Fs.write(args.signature.path, signature);
    if (written.error) return fail(data, 'write', 'E_WRITE', written.error);

    const valid = await SignEd25519.verify({
      bytes: artifactBytes,
      signature,
      publicKey: args.publicKey,
    });
    if (!valid) return verifyFailed(data);
    return ok(data);
  } catch (cause) {
    return fail(
      data,
      'sign',
      'E_SIGN',
      Err.std('Dist signer failed during sign → verify operation.', { cause }),
    );
  }
};

/**
 * Helpers
 */
async function readBytes(
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

function verifyFailed(data: t.Signer.ResultData) {
  return fail(data, 'verify', 'E_VERIFY', {
    name: 'Error',
    message: 'Signature verification failed.',
  });
}
