import { Path, pkg, type t } from '../common.ts';
import { shouldExclude } from '../u.exclude.ts';
import { finalizeDistTree } from './u.finalizeDistTree.ts';
import { executeStaging } from './u.staging.execute.ts';
import { stagingConcurrencyDefault } from './u.stagingConcurrency.ts';

export type StageMappingsArgs = {
  readonly cwd: t.StringDir;
  readonly mappings: t.Ary<t.DeployTool.Staging.Mapping>;
  readonly stagingRoot: t.StringRelativeDir;
  readonly sourceRoot?: string;
  readonly clear?: boolean;
  readonly indexBaseDomain?: string;
  readonly buildResetHtml?: boolean;
  readonly onProgress?: (e: t.DeployTool.Staging.ProgressEvent) => void;
};

export type StageMappingsResult = {
  readonly stagingRoot: t.StringDir;
};

/** Stage resolved endpoint mappings without presentation side-effects. */
export async function stageMappings(args: StageMappingsArgs): Promise<StageMappingsResult> {
  const total = args.mappings.length;
  const stagingRoot = Path.resolve(args.cwd, args.stagingRoot) as t.StringDir;

  await executeStaging({
    cwd: args.cwd,
    mappings: args.mappings,
    stagingRoot: args.stagingRoot,
    sourceRoot: args.sourceRoot,
    indexBaseDomain: args.indexBaseDomain,
    buildResetHtml: args.buildResetHtml,
    concurrency: stagingConcurrencyDefault({ total }),
    cleanStagingRoot: args.clear ?? false,
    writeDistJson: true,

    async onWriteDistJson(e) {
      // Regenerate dist metadata for the entire staging tree.
      await finalizeDistTree({
        dir: e.stagingRoot,
        pkg,
        builder: pkg,
        baseDomain: args.indexBaseDomain,
        buildResetToken: e.buildResetToken,
        filter: (path) => !shouldExclude(Path.basename(path)),
      });
    },

    onProgress: args.onProgress,
  });

  return { stagingRoot };
}
