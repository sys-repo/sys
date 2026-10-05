import { Hash, type t } from './common.ts';

export function successData(
  data: t.Signer.ResultData,
  args: t.DistSigner.Run.Args,
  artifactBytes: Uint8Array,
  verified: boolean,
): t.DistSigner.Run.DataSuccess {
  return {
    ...data,
    artifactPath: args.artifact.path,
    signaturePath: args.signature.path,
    artifactHash: Hash.sha256(artifactBytes) as t.StringHash,
    verified,
  };
}
