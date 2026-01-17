import type { t } from './common.ts';

/**
 * Controller surface.
 */
export type SlugSheetControllerLib = {
  create(args: t.SlugSheetControllerProps): t.SlugSheetController;
};

/** Controller inputs: theme/debug + tree config. */
export type SlugSheetControllerProps = {
  readonly debug?: boolean;
  readonly theme?: t.CommonTheme;
  readonly root?: t.TreeNodeList;
  readonly split?: t.Percent[];
  readonly docId?: string;
  readonly baseUrl?: t.StringUrl;
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
