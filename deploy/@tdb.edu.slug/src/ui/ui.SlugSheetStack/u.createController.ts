import { type t, Signal } from '../common.ts';

export const createController: t.SlugSheetStackControllerLib['create'] = (initial) => {
  const stack = Signal.create<t.SlugSheetStackSheet[]>(initial ? [initial] : []);
  let disposed = false;

  const controller: t.SlugSheetStackController = {
    stack,
    push(model) {
      if (disposed) return;
      stack.value = [...stack.value, model];
    },
    pop(count = 1) {
      if (disposed) return;
      const current = stack.value;
      if (current.length <= 1) return;

      const clampCount = Math.max(0, Math.min(count, current.length - 1));
      const remove = clampCount;
      const remaining = current.slice(0, current.length - remove);
      const dropped = current.slice(current.length - remove);
      dropped.forEach((item) => item.sheet.dispose('popped'));
      stack.value = remaining;
    },
    dispose(reason) {
      if (disposed) return;
      disposed = true;
      stack.value.forEach((item) => item.sheet.dispose(reason));
      stack.value = [];
    },
    props() {
      const items: readonly t.SlugSheetStackItem[] = stack.value.map((item) => ({
        id: item.id,
        props: item.sheet.props(),
      }));
      return {
        items,
        onPop: () => controller.pop(1),
      };
    },
  };

  return controller;
};
