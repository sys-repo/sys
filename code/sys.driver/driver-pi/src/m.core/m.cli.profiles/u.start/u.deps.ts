import { Cli, type t } from '../common.ts';
import { Dist, DistServer } from '@sys/server/dist';
import { Open } from '@sys/process';
import {
  StartGuiScreen,
  type StartGuiScreenInput,
  type StartGuiScreenInstance,
} from './u.screen.ts';

/** Owner seams for focused GUI-start runtime tests. */
export type StartGuiDependencies = {
  readonly materialize: t.Dist.Materialize;
  readonly start: (args: t.DistServer.Start.Args) => Promise<Started>;
  readonly open: t.OpenLib['invokeDetached'];
  readonly bindKeyboard: t.Cli.Keyboard.Lib['bind'];
  readonly createScreen: (input: StartGuiScreenInput) => StartGuiScreenInstance;
};

export const DEFAULT_DEPENDENCIES: StartGuiDependencies = Object.freeze({
  materialize: Dist.materialize,
  start: DistServer.start,
  open: Open.invokeDetached,
  bindKeyboard: Cli.Keyboard.bind,
  createScreen: StartGuiScreen.create,
});

export type Started = t.HttpServer.Started;
export type Keyboard = t.Cli.Keyboard.Bind.Handle | undefined;
export type FailedMaterialization = t.Dist.Failed;
