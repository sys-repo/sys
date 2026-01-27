import { c, Cli } from './common.ts';
import type { YamlConfigMenuActionBase } from './t.menu.ts';

type PromptActionArgs<A extends string> = {
  name: string;
  valid: boolean;
  invalidLabel?: string;
  allow?: YamlConfigMenuActionBase[];
  defaultValue?: YamlConfigMenuActionBase | A;
  extra?: { name: string; value: A }[];
};

export async function promptAction<A extends string = string>(
  args: PromptActionArgs<A>,
): Promise<YamlConfigMenuActionBase | A> {
  const extras = args.extra ?? [];
  const base = [
    { name: '  config: edit', value: 'edit' },
    { name: '  config: reload', value: 'reload' },
    { name: '  config: rename', value: 'rename' },
    { name: c.dim(c.gray(' (delete)')), value: 'delete' },
    { name: `${c.cyan('←')} back`, value: 'back' },
  ];

  const all = [...extras.map((item) => ({ name: `  ${item.name}`, value: item.value })), ...base];

  const allowed = args.valid
    ? all
    : all.filter((opt) =>
        (args.allow ?? ['edit', 'reload', 'rename', 'delete', 'back']).includes(
          opt.value as YamlConfigMenuActionBase,
        ),
      );

  const answer = await Cli.Input.Select.prompt<YamlConfigMenuActionBase | A>({
    message: args.valid ? 'Actions:' : `Actions: ${c.yellow(args.invalidLabel ?? 'invalid yaml')}`,
    options: allowed,
    default: args.defaultValue,
    hideDefault: true,
  });
  return answer as YamlConfigMenuActionBase | A;
}
