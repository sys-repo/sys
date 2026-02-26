import { type t, Err, Fs, FsPkg, Hash, SignEd25519 } from './common.ts';
import { fail, ok } from './u.result.ts';

export const run: t.DistSigner.Lib['run'] = async (args) => {
  const data: t.Signer.ResultData = {
    target: 'content-manifest',
    mode: args.mode,
  };

  const artifact = await readArtifactBytes(data, args.artifact);
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

async function readArtifactBytes(
  data: t.Signer.ResultData,
  artifact: t.DistSigner.Artifact,
): Promise<{ ok: true; bytes: Uint8Array } | { ok: false; res: t.Signer.ResultFail }> {
  if (artifact.kind === 'dist.json') return await readDistBytes(data, artifact.path);
  return await readBytes(data, artifact.path, 'artifact');
}

async function readDistBytes(
  data: t.Signer.ResultData,
  path: t.StringPath,
): Promise<{ ok: true; bytes: Uint8Array } | { ok: false; res: t.Signer.ResultFail }> {
  const loaded = await FsPkg.Dist.load(path);

  if (!loaded.exists || loaded.kind === 'missing') {
    return {
      ok: false,
      res: fail(
        data,
        'read',
        'E_READ',
        loaded.error ?? { name: 'Error', message: `dist.json does not exist: ${path}` },
      ),
    };
  }

  if (!loaded.dist || loaded.kind !== 'canonical') {
    return {
      ok: false,
      res: fail(
        data,
        'parse',
        'E_PARSE',
        loaded.error ?? { name: 'Error', message: `Expected a canonical dist.json: ${loaded.path}` },
      ),
    };
  }

  try {
    const value = canonicalizeJson(loaded.dist);
    const json = `${JSON.stringify(value)}\n`;
    return { ok: true, bytes: new TextEncoder().encode(json) };
  } catch (cause) {
    return {
      ok: false,
      res: fail(
        data,
        'canonicalize',
        'E_CANONICALIZE',
        Err.std('Failed to canonicalize dist.json for signing.', { cause }),
      ),
    };
  }
}

function canonicalizeJson(input: unknown): unknown {
  if (Array.isArray(input)) return input.map(canonicalizeJson);
  if (input === null) return null;
  if (typeof input !== 'object') return input;

  const src = input as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(src).sort()) {
    out[key] = canonicalizeJson(src[key]);
  }
  return out;
}

function verifyFailed(data: t.Signer.ResultData) {
  return fail(data, 'verify', 'E_VERIFY', {
    name: 'Error',
    message: 'Signature verification failed.',
  });
}

function successData(
  data: t.Signer.ResultData,
  args: t.DistSigner.RunArgs,
  artifactBytes: Uint8Array,
  verified: boolean,
): t.DistSigner.RunDataSuccess {
  return {
    ...data,
    artifactPath: args.artifact.path,
    signaturePath: args.signature.path,
    artifactHash: Hash.sha256(artifactBytes) as t.StringHash,
    verified,
  };
}
