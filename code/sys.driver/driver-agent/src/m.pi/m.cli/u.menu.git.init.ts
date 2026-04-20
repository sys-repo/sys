import { c, Cli, Git, type t } from './common.ts';

type Action = 'create' | 'exit';

export const GitInitMenu = {
  async init(cwd: t.StringDir) {
    return await Git.init({ cwd });
  },

  async prompt(cwd: t.StringDir): Promise<Action> {
    const title = c.cyan('Agent:Startup');
    const warning = c.yellow('This folder is not inside a git repository.');
    const message = `${title}\n\n${warning}`;
    const parent = Cli.Fmt.path(cwd, (e) => e.change(c.gray(e.part)));
    const dir = `${parent}${c.gray('/')}${c.white('.git')}`;
    const picked = await Cli.Input.Select.prompt<Action>({
      message,
      options: [
        { name: `${c.green('create:')} ${dir}`, value: 'create' },
        { name: 'exit', value: 'exit' },
      ],
      default: 'create',
      hideDefault: true,
    });
    if (picked === 'create' || picked === 'exit') return picked;
    throw new Error(`Unexpected git init menu action: ${picked}`);
  },
} as const;
