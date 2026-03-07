import { type t, Hash } from './common.ts';

export function successData(
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
