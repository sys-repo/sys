import { Is, type t } from '../common.ts';
import { Prompt } from '../m.Prompt/mod.ts';

/** Prompts for one value, omitting title chrome by default. */
export function promptSelect<TValue>(options: t.CliInput.Select.Options<TValue>) {
  const message = options.message ?? '';
  const prefix = Is.string(options.prefix) ? options.prefix : message === '' ? '' : undefined;
  return InputSelect.prompt<TValue>({ ...options, message, prefix });
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
