import type { t } from '../../common.ts';

type O = Record<string, unknown>;
type D = t.TestPropListData;
type R = t.TestPropListRunData;
type S = t.TestPropListSpecsData;
type MarginInput = t.CssValue['Margin'];
type ModulesInput = D['modules'];
type KeyboardInput = D['keyboard'] | boolean;

export type DevBddRun = {
  ctx?: R['ctx'];
  infoUrl?: R['infoUrl'];
  label?: R['label'];
  button?: R['button'];
};

export type DevBddSpecs = {
  selectable?: S['selectable'];
  ellipsis?: S['ellipsis'];
};

/**
 * BDD (Behaviour Driven Development)
 */
export type DevBddHandler<S extends O = O> = (e: DevBddHandlerArgs<S>) => t.IgnoredResponse;
export type DevBddHandlerArgs<S extends O = O> = {
  ctx: t.DevCtx;
  localstore(id: string): DevBddHandlerArgs<S>;
  run(value: DevBddRun): DevBddHandlerArgs<S>;
  keyboard(value: KeyboardInput): DevBddHandlerArgs<S>;
  specs(value: DevBddSpecs): DevBddHandlerArgs<S>;
  modules(value: ModulesInput | t.BundleImport): DevBddHandlerArgs<S>;
  margin(value: MarginInput): DevBddHandlerArgs<S>;
  enabled(value: boolean | t.DevValueHandler<boolean, S>): DevBddHandlerArgs<S>;
  onChanged(fn: DevBddChangedHandler<S>): DevBddHandlerArgs<S>;
  redraw(subject?: boolean): void;
};

/**
 * BDD Click
 */
export type DevBddChangedHandler<S extends O = O> = (e: DevBDDClickHandlerArgs<S>) => void;
export type DevBDDClickHandlerArgs<S extends O = O> = DevBddHandlerArgs<S> &
  t.TestPropListChange & {
    dev: t.DevRenderProps;
    state: t.DevCtxState<S>;
    change: t.DevCtxState<S>['change'];
  };
