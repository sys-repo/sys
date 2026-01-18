import { type t, slug, Rx } from '../common.ts';
import type { TreeHostControllerLib, TreeHostController } from './t.controller.ts';

export const createController: TreeHostControllerLib['create'] = (args = {}) => {
  const id = `treehost-${slug()}`;

  const controller = Rx.toLifecycle<TreeHostController>({
    id,
    props() {
      return args.props?.() ?? {};
    },
  });

  return controller;
};
