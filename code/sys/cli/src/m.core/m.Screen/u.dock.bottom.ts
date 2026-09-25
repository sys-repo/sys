import { Num, type t } from '../common.ts';

/**
 * Keep a complete optional footer at the bottom of a bounded screen region.
 *
 * The footer is omitted as a whole when it cannot coexist with the flowing rows.
 */
export function bottom(args: t.CliScreen.Dock.Bottom.Args): string[] {
  const capacity = Num.Is.finite(args.capacity) ? Math.max(0, Math.floor(args.capacity)) : 0;
  const { flow, footer = [] } = args;
  if (footer.length === 0 || flow.length + footer.length > capacity) {
    return flow.slice(0, capacity);
  }

  return [
    ...flow,
    ...Array.from({ length: capacity - flow.length - footer.length }, () => ''),
    ...footer,
  ];
}
