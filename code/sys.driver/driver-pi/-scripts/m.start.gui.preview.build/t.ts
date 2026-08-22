import type { Vite as DriverVite } from '@sys/driver-vite/t';

export type PreviewBuildPaths = DriverVite.Build.Response['paths'];

export type PreviewBuildInput = Readonly<
  Required<Pick<DriverVite.Build.Args, 'cwd' | 'paths' | 'pkg'>> & {
    readonly exitOnError: false;
  }
>;

export type PreviewBuildResponse = Readonly<
  Pick<DriverVite.Build.Response, 'ok' | 'paths' | 'manifest'>
>;
