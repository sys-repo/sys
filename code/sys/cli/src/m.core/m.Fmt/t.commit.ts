import type { t } from '../common.ts';

/** Commit suggestion text styling options. */
export type CliFormatCommitText = {
  readonly color?: t.AnsiForegroundColorName;
  readonly bold?: boolean;
  readonly italic?: boolean;
};

/** Commit suggestion title options. */
export type CliFormatCommitTitle = false | string | ({
  readonly text?: string;
} & CliFormatCommitText);

/** Commit suggestion formatter signature. */
export type CliFormatCommitLib = {
  suggestion(message: string, options?: {
    readonly title?: CliFormatCommitTitle;
    readonly indent?: number;
    readonly message?: CliFormatCommitText;
  }): string;
};
