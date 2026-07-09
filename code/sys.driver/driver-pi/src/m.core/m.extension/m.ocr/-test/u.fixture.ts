import { type t } from '../common.ts';

type CommandHandler = (input: t.PiOcrExtension.Command.Input) => t.PiOcrExtension.Command.Output;

/** Test seams for OCR dependency resolution. */
export function depsFixture(input: {
  readonly existing?: readonly t.StringPath[];
  readonly command?: CommandHandler;
} = {}) {
  const existing = new Set<t.StringPath>(input.existing ?? []);
  const commands: t.PiOcrExtension.Command.Input[] = [];

  return {
    commands,
    exists(path: t.StringPath) {
      return existing.has(path);
    },
    async command(commandInput: t.PiOcrExtension.Command.Input) {
      commands.push(commandInput);
      return input.command?.(commandInput) ?? { code: 1, stdout: '', stderr: '' };
    },
  } as const;
}
