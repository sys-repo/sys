export type RootUpgradeAdvisoryOptions = {
  readonly noUpgradeCheck?: boolean;
  readonly argv?: readonly string[];
  readonly env?: (name: string) => string | undefined;
};

export const RootUpgradeAdvisoryPolicy = {
  flag: {
    noUpgradeCheck: '--no-upgrade-check',
    noUpgradeCheckKey: 'no-upgrade-check',
  },
  env: {
    noUpgradeCheck: 'SYS_TOOLS_NO_UPGRADE_CHECK',
  },

  isDisabled(deps: RootUpgradeAdvisoryOptions = {}) {
    if (deps.noUpgradeCheck) return true;
    if ((deps.argv ?? Deno.args).includes(RootUpgradeAdvisoryPolicy.flag.noUpgradeCheck)) {
      return true;
    }
    try {
      const env = deps.env ?? ((name: string) => Deno.env.get(name));
      return env(RootUpgradeAdvisoryPolicy.env.noUpgradeCheck)?.trim() === '1';
    } catch {
      return false;
    }
  },
} as const;
