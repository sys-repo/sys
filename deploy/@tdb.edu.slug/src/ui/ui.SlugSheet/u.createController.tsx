import { type t, slug } from '../common.ts';

export const createController: t.SlugSheetControllerLib['create'] = (args) => {
  let disposed = false;
  const id = `sheet-${slug()}`;

  const controller: t.SlugSheetController = {
    id,
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
