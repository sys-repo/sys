import type { t } from './common.ts';

/**
 * Controller surface.
 */
export type SlugSheetControllerLib = {
  create(args: t.SlugSheetControllerProps): t.SlugSheetController;
};

/** Controller inputs: theme/debug + tree config. */
export type SlugSheetControllerProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  root?: t.TreeNodeList;
  split?: t.Percent[];
  docid?: string;
  baseUrl?: t.StringUrl;
  treeHostSlots?: t.TreeHostSlots;
};

export type SlugSheetViewModel = {
  readonly treeHostProps: t.TreeHostProps;
  readonly slots: t.SlugSheetSlots;
  readonly debug?: boolean;
  readonly theme?: t.CommonTheme;
};

/** SlugSheet runtime controller surface. */
export type SlugSheetController = t.DisposableLike & {
  readonly selectedPath: t.Signal<t.ObjectPath | undefined>;
  readonly treeRoot: t.Signal<t.TreeNodeList | undefined>;
  readonly split: t.Signal<t.Percent[]>;
  props(): t.SlugSheetProps;
  model(): SlugSheetViewModel;
};
