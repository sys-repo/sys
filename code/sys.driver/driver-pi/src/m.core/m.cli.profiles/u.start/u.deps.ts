import { Cli, type t } from '../common.ts';
import { Dist, DistServer } from '@sys/server/dist';
import { Open } from '@sys/process';

/** Owner seams for focused UI-start runtime tests. */
export type StartUiDependencies = {
  readonly materialize: t.Dist.Materialize;
  readonly start: (args: t.DistServer.Start.Args) => Promise<Started>;
  readonly open: t.OpenLib['invokeDetached'];
  readonly bindKeyboard: t.Cli.Keyboard.Lib['bind'];
};

export const DEFAULT_DEPENDENCIES: StartUiDependencies = Object.freeze({
  materialize: Dist.materialize,
  start: DistServer.start,
  open: Open.invokeDetached,
  bindKeyboard: Cli.Keyboard.bind,
});

export type Started = t.HttpServer.Started;
export type Keyboard = t.Cli.Keyboard.Bind.Handle | undefined;
export type FailedMaterialization = t.Dist.Failed;
