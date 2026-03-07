import { type t, c, Cli, opt } from './common.ts';

/**
 * Prompt for which template variant to generate.
 */
export async function promptTemplateVariant(): Promise<t.__NAME__Tool.TemplateVariant | undefined> {
  while (true) {
    const picked = (await Cli.Input.Select.prompt<t.__NAME__Tool.MenuCmd>({
      message: '\nTemplate Variant:',
      options: [
        opt(`  clone: ${c.green('stateless')} template`, 'option-a:stateless'),
        opt(`  clone: ${c.green('stateful (yaml-config)')} template`, 'option-a:yaml'),
        opt(`${c.cyan('←')} back`, 'back'),
      ],
      hideDefault: true,
    })) as t.__NAME__Tool.MenuCmd;

    if (picked === 'option-a:stateless') return 'stateless';
    if (picked === 'option-a:yaml') return 'yaml';
    if (picked === 'back') return;
  }
}
