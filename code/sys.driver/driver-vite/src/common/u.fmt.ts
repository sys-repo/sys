import { Json, c } from './libs.ts';

type Channel = 'perf' | 'trace';

type PrefixOptions = {
  detail?: string;
};

const Diag = {
  prefix(channel: Channel, options: PrefixOptions = {}) {
    const detail = options.detail?.trim();
    return `${c.dim(c.cyan('['))}${Diag.channel(channel)}${detail ? ` ${c.gray(detail)}` : ''}${c.dim(c.cyan(']'))}`;
  },

  channel(channel: Channel) {
    if (channel === 'perf') return c.cyan('driver-vite:perf');
    return c.cyan('driver-vite:trace');
  },

  meta(key: string, value: unknown) {
    if (value === undefined) return '';
    return `${c.gray(`${key}=`)}${Diag.value(key, value)}`;
  },

  value(key: string, input: unknown) {
    const formatted = Diag.stringify(input);
    return key === 'id' ? c.cyan(formatted) : formatted;
  },

  stringify(input: unknown) {
    if (typeof input === 'string') return Json.stringify(input.length > 220 ? `${input.slice(0, 217)}...` : input);
    if (typeof input === 'number' || typeof input === 'boolean') return String(input);
    if (input === null) return 'null';
    try {
      return Json.stringify(input);
    } catch {
      return Json.stringify(String(input));
    }
  },
} as const;

export const Fmt = { Diag } as const;
