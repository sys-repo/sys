import { type t, c, D, Fmt as Base, Fs } from '../common.ts';
import { endpointTable } from './u.fmt.endpoint.ts';
import { endpointValidation } from './u.fmt.validation.ts';

export const Fmt = {
  ...Base,
  endpointValidation,
  endpointTable,

  async help(toolname: string = D.tool.name, cwd: t.StringDir) {
    return await Base.help(toolname, {
      note: c.gray(`working dir: ${Fs.trimCwd(cwd)}`),
      usage: [
        `${toolname}`,
        `${toolname} --no-interactive --config ./my-config.yaml --action stage`,
        `${toolname} --no-interactive --config ./my-config.yaml --action stage+push`,
      ],
      options: [
        ['-h, --help', 'show help'],
        ['--no-interactive', 'disable prompts and require direct inputs'],
        ['--config <path>', 'load a saved deploy endpoint YAML'],
        ['--action <stage|push|stage+push>', 'run one direct endpoint action without prompts'],
      ],
      examples: [
        `${toolname}`,
        `${toolname} --no-interactive --config ./my-config.yaml --action stage`,
        `${toolname} --no-interactive --config ./my-config.yaml --action push`,
        `${toolname} --no-interactive --config ./my-config.yaml --action stage+push`,
      ],
    });
  },
} as const;
