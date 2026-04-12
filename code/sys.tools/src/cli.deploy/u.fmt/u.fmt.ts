import { type t, c, Fmt as Base, Fs } from '../common.ts';
import { endpointTable } from './u.fmt.endpoint.ts';
import { endpointValidation } from './u.fmt.validation.ts';

export const Fmt = {
  ...Base,
  endpointValidation,
  endpointTable,

  async help(cwd: t.StringDir) {
    const cmd = Base.invoke('deploy');
    return await Base.help(cmd, {
      note: c.gray(`working dir: ${Fs.trimCwd(cwd)}`),
      usage: [
        `${cmd}`,
        `${cmd} --non-interactive --config ./my-config.yaml --action stage`,
        `${cmd} --non-interactive --config ./my-config.yaml --action stage+push`,
      ],
      options: [
        ['-h, --help', 'show help'],
        ['--non-interactive', 'disable prompts and require direct inputs'],
        ['--config <path>', 'load a saved deploy endpoint YAML'],
        ['--action <stage|push|stage+push>', 'run one direct endpoint action without prompts'],
      ],
      examples: [
        `${cmd} --non-interactive --config ./my-config.yaml --action stage`,
        `${cmd} --non-interactive --config ./my-config.yaml --action push`,
        `${cmd} --non-interactive --config ./my-config.yaml --action stage+push`,
      ],
    });
  },
} as const;
