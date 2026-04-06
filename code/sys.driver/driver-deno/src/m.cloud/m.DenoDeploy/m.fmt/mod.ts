import { type t } from './common.ts';
import { InfoFmt } from './u.info.ts';
import { ListenFmt } from './u.listen.ts';

export const Fmt: t.DenoDeploy.Fmt.Lib = {
  Spinner: {
    text: ListenFmt.spinnerText,
    create: ListenFmt.spinner,
  },
  Deploy: {
    config: InfoFmt.Deploy.config,
    result: InfoFmt.Deploy.result,
    failure: InfoFmt.Deploy.failure,
  },
  listen: ListenFmt.listen,
};

export const FmtInternal = {
  blocked: InfoFmt.blocked,
  envVarsNotFound: InfoFmt.envVarsNotFound,
  info: InfoFmt.info,
  Deploy: {
    config: InfoFmt.Deploy.config,
    result: InfoFmt.Deploy.result,
    failure: InfoFmt.Deploy.failure,
  },
  Staged: {
    entrypoint: InfoFmt.Staged.entrypoint,
  },
} as const;
