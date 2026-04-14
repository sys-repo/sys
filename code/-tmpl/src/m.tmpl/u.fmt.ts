import { type t, Cli, Fs } from './common.ts';

type FinalCommitArgs = {
  tmpl: t.TemplateName;
  targetDir: t.StringAbsoluteDir;
  cwd: t.StringDir;
  ops?: t.TmplWriteResult['ops'];
  options?: {
    pkgName?: string;
    name?: string;
    dryRun?: boolean;
  };
};

export const Fmt = {
  finalCommit(args: FinalCommitArgs) {
    const message = wrangle.commitMessage(args);
    const title = args.options?.dryRun ? 'preview commit msg:' : 'commit msg:';

    return [
      Cli.Fmt.hr('cyan'),
      Cli.Fmt.Commit.suggestion(message, {
        title: { text: title, color: 'cyan', bold: false },
        message: { color: 'white' },
      }),
    ].join('\n');
  },
} as const;

const wrangle = {
  commitMessage(args: FinalCommitArgs) {
    const path = Fs.trimCwd(args.targetDir, { cwd: args.cwd });
    const count = (args.ops ?? []).filter((op) => op.kind === 'create' || op.kind === 'modify').length;
    const files = count === 1 ? '1 file' : `${count} files`;

    if (args.tmpl === 'repo') return `repo scaffold created at ${Fs.basename(path)} (${files})`;
    if (args.tmpl === 'pkg') {
      if (args.options?.pkgName) return `pkg scaffold created at ${path} for ${args.options.pkgName} (${files})`;
    }

    if (args.tmpl === 'm.mod') return `m.mod scaffold created at ${path} (${files})`;

    if (args.tmpl === 'm.mod.ui' && args.options?.name) {
      return `m.mod.ui scaffold created at ${path} for ${args.options.name} (${files})`;
    }

    if (args.tmpl === 'm.mod.ui.controller' && args.options?.name) {
      return `m.mod.ui.controller scaffold created at ${path} for ${args.options.name} (${files})`;
    }

    return `${args.tmpl} scaffold created at ${path} (${files})`;
  },
} as const;
