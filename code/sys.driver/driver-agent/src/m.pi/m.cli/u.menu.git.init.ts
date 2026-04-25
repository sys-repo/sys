import { c, Cli, Git, type t } from './common.ts';
import { GitInitFmt } from './u.fmt.git.init.ts';

type Action = 'create' | 'exit';

export const GitInitMenu = {
  async init(cwd: t.StringDir) {
    return await Git.init({ cwd });
  },

  async prompt(cwd: t.StringDir): Promise<Action> {
    console.info(GitInitFmt.block(cwd));
    const picked = await Cli.Input.Select.prompt<Action>({
      message: 'Action',
      options: [
        { name: c.cyan('create'), value: 'create' },
        { name: 'exit', value: 'exit' },
      ],
      default: 'create',
      hideDefault: true,
    });
    if (picked === 'create' || picked === 'exit') return picked;
    throw new Error(`Unexpected git init menu action: ${picked}`);
  },
} as const;
