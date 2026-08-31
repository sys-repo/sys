import { Path, pkg, type t } from '../common.ts';
import { shouldExclude } from '../u.exclude.ts';
import { finalizeDistTree } from './u.finalizeDistTree.ts';
import { executeStaging } from './u.staging.execute.ts';
import { stagingConcurrencyDefault } from './u.stagingConcurrency.ts';

export type StageMappingsArgs = {
  cwd: t.StringDir;
  mappings: t.Ary<t.DeployTool.Staging.Mapping>;
  stagingRoot: t.StringRelativeDir;
  sourceRoot?: string;
  clear?: boolean;
  buildResetHtml?: boolean;
  onProgress?: (e: t.DeployTool.Staging.ProgressEvent) => void;
};

export type StageMappingsResult = {
  readonly stagingRoot: t.StringDir;
};

/** Stage resolved endpoint mappings without presentation side-effects. */
export async function stageMappings(args: StageMappingsArgs): Promise<StageMappingsResult> {
  const total = args.mappings.length;
  const stagingRoot: t.StringDir = Path.resolve(args.cwd, args.stagingRoot);

  await executeStaging({
    cwd: args.cwd,
    mappings: args.mappings,
    stagingRoot: args.stagingRoot,
    sourceRoot: args.sourceRoot,
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
        buildResetToken: e.buildResetToken,
        filter: (path) => !shouldExclude(Path.basename(path)),
      });
    },

    onProgress: args.onProgress,
  });

  return { stagingRoot };
}
