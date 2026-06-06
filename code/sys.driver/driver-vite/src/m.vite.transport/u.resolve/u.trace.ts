import { Fmt } from '../../common/u.fmt.ts';

const TRACE_RESOLVE_ENV = 'SYS_VITE_TRACE_RESOLVE';

export const trace = {
  enabled() {
    const value = Deno.env.get(TRACE_RESOLVE_ENV)?.trim().toLowerCase();
    return value !== undefined && value !== '' && value !== '0' && value !== 'false' &&
      value !== 'off' && value !== 'no';
  },

  resolve(label: string, meta: Record<string, unknown>) {
    if (!trace.enabled()) return;
    const suffix = Object.entries(meta)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => Fmt.Diag.meta(key, value))
      .filter(Boolean)
      .join(' ');
    const prefix = Fmt.Diag.prefix('trace', { detail: `resolve.${label}` });
    console.info(`${prefix}${suffix ? ` ${suffix}` : ''}`);
  },
} as const;
