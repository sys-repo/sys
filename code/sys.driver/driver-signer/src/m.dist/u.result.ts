import type { t } from './common.ts';

export const ok = (data: t.Signer.ResultData): t.Signer.ResultOk => {
  return {
    ok: true,
    data,
    error: undefined,
  };
};

export const fail = (
  data: t.Signer.ResultData,
  stage: t.Signer.Stage,
  code: t.Signer.ErrorCode,
  error: t.StdError,
): t.Signer.ResultFail => ({ ok: false, data, error, code, stage });
