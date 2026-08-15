import { Is, type t } from '../common.ts';
import { Prompt } from '../m.Prompt/mod.ts';
import { selectPromptDependency } from './u.select.scope.ts';

type NormalizedSelectOptions<TValue> = Omit<t.CliInput.Select.Options<TValue>, 'message'> & {
  message: string;
};

type SelectPrompt<TValue> = (
  options: NormalizedSelectOptions<TValue>,
) => ReturnType<typeof InputSelect.prompt<TValue>>;

/** Prompts for one value, omitting title chrome by default. */
export function promptSelect<TValue>(
  options: t.CliInput.Select.Options<TValue>,
): ReturnType<typeof InputSelect.prompt<TValue>> {
  const dependency = selectPromptDependency();
  if (dependency) {
    return dependency(options as t.CliInput.Select.Options<unknown>) as ReturnType<
      typeof InputSelect.prompt<TValue>
    >;
  }
  return promptSelectWith((input) => InputSelect.prompt<TValue>(input), options);
}

/** Package-internal prompt dependency seam. */
export function promptSelectWith<TValue>(
  prompt: SelectPrompt<TValue>,
  options: t.CliInput.Select.Options<TValue>,
): ReturnType<typeof InputSelect.prompt<TValue>> {
  const message = options.message ?? '';
  const prefix = Is.string(options.prefix) ? options.prefix : message === '' ? '' : undefined;
  return prompt({ ...options, message, prefix });
}

/**
 * Adapts Cliffy's Select renderer for titleless prompts.
 *
 * Cliffy's styled empty message survives its falsy-row filter. This class uses the
 * framework's protected `message()` seam to suppress that row without rewriting the
 * renderer or filtering terminal output.
 *
 * Defaults and search retain their rows. The adapter stays private; `Cli.Prompt.Select`
 * remains raw Cliffy access.
 */
class InputSelect<TValue> extends Prompt.Select<TValue> {
  protected override message() {
    const isTitleless = this.settings.message === '' && this.settings.prefix === '';
    const hasVisibleDefault = typeof this.settings.default !== 'undefined' &&
      this.settings.hideDefault !== true;
    const hasSearch = this.settings.search === true;
    return isTitleless && !hasVisibleDefault && !hasSearch ? '' : super.message();
  }
}
