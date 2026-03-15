import type { t } from '../common.ts';

export declare namespace DenoImports {
  export type TargetKind = 'imports' | 'importMap';
  export type ApplyResult = {
    readonly kind: TargetKind;
    readonly denoFilePath: t.StringPath;
    readonly targetPath: t.StringPath;
    readonly imports: Record<string, t.StringModuleSpecifier>;
  };
}
