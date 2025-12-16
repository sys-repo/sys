import { Prompt } from './libs.ts';
import type * as t from './t.ts';

export type PromptDirsMenuArgs<C extends string> = {
  readonly message: string;
  readonly prefix: string;
  readonly dirs: readonly { name: string; dir: t.StringDir }[];

  readonly cmdAdd: C;
  readonly cmdExit: C;
  readonly addLabel: string;

  /**
   * Render a branch marker for a row in a tree-like list.
   * Caller supplies the specific branching implementation (e.g. Fmt.Tree.branch).
   */
  readonly branch: (e: { readonly index: number; readonly total: readonly unknown[] }) => string;

  /** Optional name painter (e.g. c.green). */
  readonly paintName?: (name: string) => string;

  /** Optional side-effect hook for persisting "last used" etc. */
  readonly onSelectDir?: (dir: t.StringDir) => Promise<void>;
};

export type PromptMenuOption<C extends string> = {
  readonly name: string;
  readonly value: C;
};

/**
 * Prompt: choose a directory from a tree-like list (with optional add/exit items).
 */
export async function promptDirsMenu<C extends string>(args: PromptDirsMenuArgs<C>): Promise<C> {
  const { message, prefix, cmdAdd, cmdExit, addLabel, onSelectDir } = args;
  const paintName = args.paintName ?? ((s: string) => s);
  const opt = (name: string, value: C): PromptMenuOption<C> => ({ name, value });

  const listing: readonly PromptMenuOption<C>[] = args.dirs.map((item, index, total) => {
    const branch = args.branch({ index, total });
    const name = ` ${prefix} ${branch} ${paintName(item.name)}`;
    return opt(name, item.dir as unknown as C);
  });

  const defaultCommand = listing.length > 0 ? listing[0].value : cmdAdd;

  const picked = (await Prompt.Select.prompt<C>({
    message,
    options: [opt(addLabel, cmdAdd), ...listing, opt('(exit)', cmdExit)],
    default: defaultCommand,
    hideDefault: true,
  })) as C;

  if (picked !== cmdAdd && picked !== cmdExit) {
    await onSelectDir?.(picked as unknown as t.StringDir);
  }

  return picked;
}
