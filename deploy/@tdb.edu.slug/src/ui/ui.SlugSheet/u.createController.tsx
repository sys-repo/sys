import { type t } from '../common.ts';

export const createController: t.SlugSheetControllerLib['create'] = (args) => {
  let disposed = false;

  const controller: t.SlugSheetController = {
    props() {
      return {
        slots: args.slots,
      };
    },
    dispose() {
      disposed = true;
    },
  };

  return controller;
};
