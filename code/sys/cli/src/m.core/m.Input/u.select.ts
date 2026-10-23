import { Is, type t } from '../common.ts';
import { Prompt } from '../m.Prompt/mod.ts';
import { selectPromptDependency } from './u.select.scope.ts';

type SelectOptions<T> = Omit<t.CliInput.Select.Options<T>, 'message'>;
type PromptResult<T> = ReturnType<typeof InputSelect.prompt<T>>;

/** Package-internal normalized options passed to Cliffy's Select implementation. */
export type NormalizedSelectOptions<T> = SelectOptions<T> & { message: string };

type SelectPrompt<T> = (options: NormalizedSelectOptions<T>) => PromptResult<T>;
type InjectedPrompt<T> = (options: t.CliInput.Select.Options<T>) => PromptResult<T>;

/** Prompts for one value, omitting title chrome by default. */
export function promptSelect<TValue>(
  options: t.CliInput.Select.Options<TValue>,
): PromptResult<TValue> {
  const dependency = selectPromptDependency();
  if (dependency) {
    const prompt = dependency as InjectedPrompt<TValue>;
    return prompt(options);
  }
  return promptSelectWith((input) => InputSelect.prompt<TValue>(input), options);
}

/** Package-internal prompt dependency seam. */
export function promptSelectWith<TValue>(
  prompt: SelectPrompt<TValue>,
  options: t.CliInput.Select.Options<TValue>,
): PromptResult<TValue> {
  return prompt(normalizeSelectOptions(options));
}

/** Package-internal normalization shared by immediate and lifecycle-owned Select prompts. */
export function normalizeSelectOptions<TValue>(
  options: t.CliInput.Select.Options<TValue>,
): NormalizedSelectOptions<TValue> {
  const message = options.message ?? '';
  let prefix = Is.string(options.prefix) ? options.prefix : undefined;
  if (prefix === undefined && message === '') prefix = '';
  return { ...options, message, prefix };
}

/** Helpers: */

/**
 * Adapts Cliffy's Select renderer for titleless prompts.
 *
 * Cliffy's styled empty message survives its falsy-row filter. This class uses the
 * framework's protected `message()` seam to suppress that row without rewriting the
 * renderer or filtering terminal output.
 *
 * Defaults and search retain their rows. The adapter stays package-internal;
 * `Cli.Prompt.Select` remains raw Cliffy access.
 */
export class InputSelect<TValue> extends Prompt.Select<TValue> {
  protected override message(): string {
    const isTitleless = this.settings.message === '' && this.settings.prefix === '';
    const hasVisibleDefault = typeof this.settings.default !== 'undefined' &&
      this.settings.hideDefault !== true;
    const hasSearch = this.settings.search === true;
    return isTitleless && !hasVisibleDefault && !hasSearch ? '' : super.message();
  }
}
