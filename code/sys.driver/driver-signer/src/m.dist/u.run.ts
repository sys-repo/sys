import { type t, Err, Fs, SignEd25519 } from './common.ts';
import { successData } from './u.audit.ts';
import { fail, ok } from './u.result.ts';
import { readArtifactBytes } from './u.run.dist.ts';
import { readBytes } from './u.run.io.ts';

export const run: t.DistSigner.Lib['run'] = async (args) => {
  const data: t.Signer.ResultData = {
    target: 'content-manifest',
    mode: args.mode,
  };

  const artifact = await readArtifactBytes(data, args);
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
      return ok(successData(data, args, artifactBytes, false));
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
      return ok(successData(data, args, artifactBytes, true));
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
    return ok(successData(data, args, artifactBytes, true));
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
 * Helpers:
 */
function verifyFailed(data: t.Signer.ResultData) {
  return fail(data, 'verify', 'E_VERIFY', {
    name: 'Error',
    message: 'Signature verification failed.',
  });
}
