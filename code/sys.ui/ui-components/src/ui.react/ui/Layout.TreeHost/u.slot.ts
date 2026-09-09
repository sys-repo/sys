import { type t, D, Is } from './common.ts';

export function toSlotSpinner(
  props: t.TreeHost.Props,
  slot: t.TreeHost.Slot,
): t.TreeHost.SlotSpinner | undefined {
  const defaults = D.spinner;

  const targetSlot: t.TreeHost.SpinnerSlot = slot === 'empty' ? 'main:body' : slot;
  const input = props.spinner;
  if (!input) return undefined;

  const list: t.TreeHost.Spinner[] = Is.array(input) ? [...input] : [input];
  const normalized = list.map((item): t.TreeHost.SlotSpinner => {
    if (Is.str(item)) return { slot: item };
    return item;
  });

  const match = normalized.findLast((item) => {
    if (targetSlot === 'nav:tree' && item.slot === 'nav:leaf') return true;
    return item.slot === targetSlot;
  });

  if (!match) return undefined;
  return { ...defaults, ...match };
}

export function shouldRenderEmpty(args: {
  props: t.TreeHost.Props;
  slot: t.TreeHost.Slot;
  hasContent: boolean;
}) {
  if (args.hasContent) return false;
  const spinner = toSlotSpinner(args.props, args.slot);
  if (spinner) return false;
  return true;
}

export function toSlotNode(
  input: t.TreeHost.SlotInput | undefined,
  args: t.TreeHost.RenderSlotArgs,
): t.ReactNode | undefined {
  if (input === undefined) return undefined;
  if (Is.func(input)) return input(args);
  return input;
}
