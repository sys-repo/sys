import { type t, Err, Fs, FsPkg } from './common.ts';
import { fail } from './u.result.ts';
import { readBytes } from './u.run.io.ts';

export async function readArtifactBytes(
  data: t.Signer.ResultData,
  args: t.DistSigner.RunArgs,
): Promise<{ ok: true; bytes: Uint8Array } | { ok: false; res: t.Signer.ResultFail }> {
  const artifact = args.artifact;
  if (
    artifact.kind === 'dist.json' &&
    args.mode !== 'verify' &&
    wantsDistSignDescriptorWriteBack(args)
  ) {
    return await writeDistSignDescriptorAndReadBytes(data, args);
  }
  if (artifact.kind === 'dist.json') return await readDistBytes(data, artifact.path);
  return await readBytes(data, artifact.path, 'artifact');
}

function wantsDistSignDescriptorWriteBack(args: t.DistSigner.RunArgs): boolean {
  if (args.mode === 'verify') return false;
  if (args.artifact.kind !== 'dist.json') return false;
  return args.writeBack?.distSignDescriptor ?? true;
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

async function writeDistSignDescriptorAndReadBytes(
  data: t.Signer.ResultData,
  args: t.DistSigner.RunArgsSign | t.DistSigner.RunArgsSignVerify,
): Promise<{ ok: true; bytes: Uint8Array } | { ok: false; res: t.Signer.ResultFail }> {
  const loaded = await FsPkg.Dist.load(args.artifact.path);

  if (!loaded.exists || loaded.kind === 'missing') {
    return {
      ok: false,
      res: fail(
        data,
        'read',
        'E_READ',
        loaded.error ?? { name: 'Error', message: `dist.json does not exist: ${args.artifact.path}` },
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
    const descriptor = {
      path: signatureDescriptorPath(args.artifact.path, args.signature.path),
      scheme: 'Ed25519' as const,
      ...(args.identityRef ? { key: args.identityRef } : {}),
    };

    const dist = {
      ...loaded.dist,
      build: {
        ...loaded.dist.build,
        sign: descriptor,
      },
    };
    const value = canonicalizeJson(dist);
    const json = `${JSON.stringify(value)}\n`;
    const written = await Fs.write(args.artifact.path, json);
    if (written.error) return { ok: false, res: fail(data, 'write', 'E_WRITE', written.error) };
    return { ok: true, bytes: new TextEncoder().encode(json) };
  } catch (cause) {
    return {
      ok: false,
      res: fail(
        data,
        'canonicalize',
        'E_CANONICALIZE',
        Err.std('Failed to write dist.json detached signature descriptor.', { cause }),
      ),
    };
  }
}

function signatureDescriptorPath(artifactPath: t.StringPath, signaturePath: t.StringPath): t.StringPath {
  const artifactDir = Fs.dirname(artifactPath);
  const sigDir = Fs.dirname(signaturePath);
  if (artifactDir === sigDir) return `./${Fs.basename(signaturePath)}`;
  return signaturePath;
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
