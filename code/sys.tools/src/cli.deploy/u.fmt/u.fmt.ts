import { type t, Fmt as Base, c, D, Fs, Str } from '../common.ts';
import { getConfig } from '../u.config.ts';
import { endpointTable } from './u.fmt.endpoint.ts';
import { endpointValidation } from './u.fmt.validation.ts';

export const Fmt = {
  ...Base,
  endpointValidation,
  endpointTable,

  async help(toolname: string = D.tool.name, cwd: t.StringDir) {
    const config = await getConfig(cwd);
    const str = Str.builder()
      .line(c.gray(`working dir: ${Fs.trimCwd(cwd)}`))
      .line(await Base.help(toolname))
      .line();
    return String(str);
  },
} as const;
