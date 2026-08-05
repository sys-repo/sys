import { c, type t } from '../common.ts';
import { Prompt } from '../m.Prompt/mod.ts';
import { promptSelect } from './u.select.ts';

export const Input: t.CliInput.Lib = {
  Text: { prompt: Prompt.Input.prompt.bind(Prompt.Input) },
  Confirm: { prompt: Prompt.Confirm.prompt.bind(Prompt.Confirm) },
  Number: { prompt: Prompt.Number.prompt.bind(Prompt.Number) },
  Secret: { prompt: Prompt.Secret.prompt.bind(Prompt.Secret) },
  Toggle: { prompt: Prompt.Toggle.prompt.bind(Prompt.Toggle) },
  MultiText: { prompt: Prompt.List.prompt.bind(Prompt.List) },
  Select: { prompt: promptSelect },
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
