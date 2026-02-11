import { type t, D, Is } from './common.ts';

export function toSlotSpinner(
  props: t.TreeHostProps,
  slot: t.TreeHostSlot,
): t.TreeHostSlotSpinner | undefined {
  const defaults = D.spinner;

  const targetSlot: t.TreeHostSpinnerSlot = slot === 'empty' ? 'main' : slot;
  const input = props.spinner;
  if (!input) return undefined;

  const list = Array.isArray(input) ? input : [input];
  const normalized = list.map((item): t.TreeHostSlotSpinner => {
    if (Is.str(item)) return { slot: item };
    return item;
  });

  const match = normalized.findLast((item) => {
    if (targetSlot === 'tree' && item.slot === 'treeLeaf') return true;
    return item.slot === targetSlot;
  });

  if (!match) return undefined;
  return { ...defaults, ...match };
}

export function shouldRenderEmpty(args: {
  props: t.TreeHostProps;
  slot: t.TreeHostSlot;
  hasContent: boolean;
}) {
  if (args.hasContent) return false;
  const spinner = toSlotSpinner(args.props, args.slot);
  if (spinner) return false;
  return true;
}

export function toSlotNode(
  input: t.TreeHostSlotInput | undefined,
  args: t.TreeHostRenderSlotArgs,
): t.ReactNode | undefined {
  if (input === undefined) return undefined;
  if (Is.func(input)) return input(args);
  return input;
}
