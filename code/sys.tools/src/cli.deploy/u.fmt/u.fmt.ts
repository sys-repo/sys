import { c, Fmt as Base, Fs, type t } from '../common.ts';
import { endpointTable, previewUnavailable } from './u.fmt.endpoint.ts';
import { endpointValidation } from './u.fmt.validation.ts';

/**
 * Deploy presentation helpers.
 */
export const Fmt = {
  ...Base,
  endpointValidation,
  endpointTable,
  previewUnavailable,

  /** Render Deploy command help. */
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
        ['--force', 'force push repair mode (rewrite staged files)'],
      ],
      examples: [
        `${cmd} --non-interactive --config ./my-config.yaml --action stage`,
        `${cmd} --non-interactive --config ./my-config.yaml --action push`,
        `${cmd} --non-interactive --config ./my-config.yaml --action push --force`,
        `${cmd} --non-interactive --config ./my-config.yaml --action stage+push`,
      ],
    });
  },
} as const;
