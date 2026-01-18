import type { t } from './common.ts';

/**
 * Controller surface.
 */
export type TreeHostControllerLib = {
  create(args?: { props?: () => TreeHostControllerProps }): TreeHostController;
};

/** Controller inputs: slots. */
export type TreeHostControllerProps = {
  slots?: t.TreeHostSlots;
};

/** TreeHost runtime controller surface. */
export type TreeHostController = t.Lifecycle & {
  readonly id: t.StringId;
  props(): TreeHostControllerProps;
};
