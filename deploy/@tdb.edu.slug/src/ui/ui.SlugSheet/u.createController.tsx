import { type t, slug, Rx } from '../common.ts';

export const createController: t.SlugSheetControllerLib['create'] = (args = {}) => {
  const id = `sheet-${slug()}`;

  const controller = Rx.toLifecycle<t.SlugSheetController>({
    id,
    props() {
      return args.props?.() ?? {};
    },
  });

  return controller;
};
