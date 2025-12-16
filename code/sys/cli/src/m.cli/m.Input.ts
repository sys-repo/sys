import { type t } from './common.ts';
import { Prompt } from './m.Prompt.ts';
import { c } from './common.ts';

export const Input: t.CliInputLib = {
  Text: { prompt: Prompt.Input.prompt },
  Confirm: { prompt: Prompt.Confirm.prompt },
  Number: { prompt: Prompt.Number.prompt },
  Secret: { prompt: Prompt.Secret.prompt },
  Toggle: { prompt: Prompt.Toggle.prompt },
  MultiText: { prompt: Prompt.List.prompt },
  Select: { prompt: Prompt.Select.prompt },

  Checkbox: {
    prompt(args) {
      return Prompt.Checkbox.prompt({
        check: c.green('●'),
        uncheck: c.gray('○'),
        ...args,
      });
    },
  },
};
