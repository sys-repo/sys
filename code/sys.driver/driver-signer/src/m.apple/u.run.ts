import { Err, type t } from './common.ts';
import { execStage } from './u.exec.ts';
import { fail, ok, type RunDataBase } from './u.result.ts';

export type RuntimeExecOk = { readonly ok: true };
export type RuntimeExecFail = {
  readonly ok: false;
  readonly error: t.StdError;
  readonly code: t.AppleSigner.ErrorCode;
};
export type RuntimeExecResult = RuntimeExecOk | RuntimeExecFail;
export type RuntimeDeps = {
  exec(stage: t.AppleSigner.Stage, input: t.AppleSigner.RunInput): Promise<RuntimeExecResult>;
};

export const run = async (
  input: t.AppleSigner.RunInput,
  deps: RuntimeDeps = runtime,
): Promise<t.AppleSigner.Result> => {
  const base: RunDataBase = {
    target: 'apple',
    mode: input.mode,
    artifactPath: input.artifactPath,
    artifactKind: input.artifactKind,
  };

  if (input.mode === 'sign-notarize-verify' && !input.notary) {
    return fail(
      base,
      'input',
      'E_INPUT',
      Err.std('Notarization mode requires `notary` auth input.'),
    );
  }

  const signed = await runStage('sign', input, base, deps);
  if (!signed.ok) return signed.res;

  if (input.mode === 'sign-only') {
    return ok({
      ...base,
      signed: true,
      verified: false,
      notarized: false,
      stapled: false,
    });
  }

  if (input.mode === 'sign-notarize-verify') {
    const notarized = await runStage('notarize', input, base, deps);
    if (!notarized.ok) return notarized.res;

    const stapled = await runStage('staple', input, base, deps);
    if (!stapled.ok) return stapled.res;

    const verified = await runStage('verify', input, base, deps);
    if (!verified.ok) return verified.res;

    return ok({
      ...base,
      signed: true,
      verified: true,
      notarized: true,
      stapled: true,
    });
  }

  const verified = await runStage('verify', input, base, deps);
  if (!verified.ok) return verified.res;

  return ok({
    ...base,
    signed: true,
    verified: true,
    notarized: false,
    stapled: false,
  });
};

/**
 * Internal:
 */
const runtime: RuntimeDeps = {
  exec: execStage,
};

async function runStage(
  stage: t.AppleSigner.Stage,
  input: t.AppleSigner.RunInput,
  data: RunDataBase,
  deps: RuntimeDeps,
): Promise<{ ok: true } | { ok: false; res: t.AppleSigner.ResultFail }> {
  const result = await deps.exec(stage, input);
  if (result.ok) return { ok: true };
  return {
    ok: false,
    res: fail(data, stage, result.code, result.error),
  };
}
