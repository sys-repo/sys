import { type t, Err, Fs, SignEd25519 } from './common.ts';
import { fail, ok } from './u.result.ts';

export const run: t.DistSigner.Lib['run'] = async (args) => {
  const data: t.Signer.ResultData = {
    target: 'content-manifest',
    mode: args.mode,
  };

  const artifact = await Fs.read(args.artifact.path);
  if (!artifact.ok || !artifact.data) {
    return fail(
      data,
      'read',
      'E_READ',
      artifact.error ?? { name: 'Error', message: 'Failed to read artifact bytes.' },
    );
  }

  if (args.mode === 'sign') {
    try {
      const signature = await SignEd25519.sign({
        bytes: artifact.data,
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
      const sig = await Fs.read(args.signature.path);
      if (!sig.ok || !sig.data) {
        return fail(
          data,
          'read',
          'E_READ',
          sig.error ?? { name: 'Error', message: 'Failed to read signature bytes.' },
        );
      }

      const valid = await SignEd25519.verify({
        bytes: artifact.data,
        signature: sig.data,
        publicKey: args.publicKey,
      });
      if (!valid)
        return fail(data, 'verify', 'E_VERIFY', {
          name: 'Error',
          message: 'Signature verification failed.',
        });
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
    const signature = await SignEd25519.sign({
      bytes: artifact.data,
      privateKey: args.privateKey,
    });
    const written = await Fs.write(args.signature.path, signature);
    if (written.error) return fail(data, 'write', 'E_WRITE', written.error);

    const valid = await SignEd25519.verify({
      bytes: artifact.data,
      signature,
      publicKey: args.publicKey,
    });
    if (!valid)
      return fail(data, 'verify', 'E_VERIFY', {
        name: 'Error',
        message: 'Signature verification failed.',
      });
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
