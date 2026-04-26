export type PackageEdge = {
  readonly from: string;
  readonly to: string;
};

export type PassthroughTarget = {
  readonly upstream: {
    readonly name: string;
    readonly path: string;
  };
  readonly consumer: {
    readonly path: string;
    readonly fileFromRoot: string;
  };
  readonly pin: {
    readonly constName: string;
    readonly pattern: RegExp;
    readonly toSpecifier: (version: string) => string;
  };
};

export const PASSTHROUGH_TARGETS: readonly PassthroughTarget[] = [
  {
    upstream: {
      name: '@sys/tmpl',
      path: 'code/-tmpl',
    },
    consumer: {
      path: 'code/sys.tools',
      fileFromRoot: 'code/sys.tools/src/cli.tmpl/m.cli.ts',
    },
    pin: {
      constName: 'TMPL_JSR_SPECIFIER',
      pattern: /const TMPL_JSR_SPECIFIER = 'jsr:@sys\/tmpl(?:@[^']+)?';/,
      toSpecifier: (version) => `jsr:@sys/tmpl@${version}`,
    },
  },
  {
    upstream: {
      name: '@sys/driver-agent',
      path: 'code/sys.driver/driver-agent',
    },
    consumer: {
      path: 'code/sys.tools',
      fileFromRoot: 'code/sys.tools/src/cli.pi/mod.ts',
    },
    pin: {
      constName: 'DRIVER_AGENT_PI_CLI_JSR_SPECIFIER',
      pattern: /const DRIVER_AGENT_PI_CLI_JSR_SPECIFIER = 'jsr:@sys\/driver-agent(?:@[^']+)?\/pi\/cli';/,
      toSpecifier: (version) => `jsr:@sys/driver-agent@${version}/pi/cli`,
    },
  },
] as const;

export function toPassthroughCouplings(
  targets: readonly PassthroughTarget[] = PASSTHROUGH_TARGETS,
): readonly PackageEdge[] {
  return targets.map((target) => ({
    from: target.upstream.path,
    to: target.consumer.path,
  }));
}

export function pinPassthroughSpecifier(
  source: string,
  target: PassthroughTarget,
  version: string,
): string {
  if (!target.pin.pattern.test(source)) {
    throw new Error(
      `Could not locate ${target.pin.constName} constant in ${target.consumer.fileFromRoot}`,
    );
  }

  const specifier = target.pin.toSpecifier(version);
  return source.replace(
    target.pin.pattern,
    `const ${target.pin.constName} = '${specifier}';`,
  );
}
