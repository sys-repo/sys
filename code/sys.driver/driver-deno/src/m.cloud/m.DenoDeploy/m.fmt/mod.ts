import { type t } from './common.ts';
import { InfoFmt } from './u.info.ts';
import { ListenFmt } from './u.listen.ts';

export const Fmt: t.DenoDeploy.Fmt.Lib = {
  spinnerText: ListenFmt.spinnerText,
  spinner: ListenFmt.spinner,
  listen: ListenFmt.listen,
};

export const FmtInternal = {
  blocked: InfoFmt.blocked,
  envVarsNotFound: InfoFmt.envVarsNotFound,
  info: InfoFmt.info,
  deployConfig: InfoFmt.deployConfig,
  stagedEntrypoint: InfoFmt.stagedEntrypoint,
  deployResult: InfoFmt.deployResult,
  pipelineFailure: InfoFmt.pipelineFailure,
} as const;
