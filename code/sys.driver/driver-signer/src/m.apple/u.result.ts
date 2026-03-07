import type { t } from './common.ts';


type RunData = t.AppleSigner.RunData;
export type RunDataBase = Omit<RunData, 'signed' | 'verified' | 'notarized' | 'stapled'>;

export const ok = (data: RunData): t.AppleSigner.ResultOk => {
  return {
    ok: true,
    data,
    error: undefined,
  };
};

export const fail = (
  data: RunDataBase,
  stage: t.AppleSigner.Stage,
  code: t.AppleSigner.ErrorCode,
  error: t.StdError,
): t.AppleSigner.ResultFail => {
  return { ok: false, data, stage, code, error };
};
