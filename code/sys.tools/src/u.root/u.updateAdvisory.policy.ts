export type RootUpdateAdvisoryOptions = {
  readonly noUpdateCheck?: boolean;
  readonly argv?: readonly string[];
  readonly env?: (name: string) => string | undefined;
};

export const RootUpdateAdvisoryPolicy = {
  flag: {
    noUpdateCheck: '--no-update-check',
    noUpdateCheckKey: 'no-update-check',
  },
  env: {
    noUpdateCheck: 'SYS_TOOLS_NO_UPDATE_CHECK',
  },

  isDisabled(deps: RootUpdateAdvisoryOptions = {}) {
    if (deps.noUpdateCheck) return true;
    if ((deps.argv ?? Deno.args).includes(RootUpdateAdvisoryPolicy.flag.noUpdateCheck)) return true;
    try {
      const env = deps.env ?? ((name: string) => Deno.env.get(name));
      return env(RootUpdateAdvisoryPolicy.env.noUpdateCheck)?.trim() === '1';
    } catch {
      return false;
    }
  },
} as const;
