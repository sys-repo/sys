import type { t } from '../common.ts';

export type CliFormatCommitLib = {
  suggestion(message: string, options?: {
    readonly title?: string | false;
    readonly indent?: number;
    readonly message?: {
      readonly color?: t.AnsiForegroundColorName;
      readonly bold?: boolean;
      readonly italic?: boolean;
    };
  }): string;
};
