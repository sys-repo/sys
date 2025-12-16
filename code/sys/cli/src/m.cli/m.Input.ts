import { type t, c } from './common.ts';
import { Prompt } from './m.Prompt.ts';

export const Input: t.CliInputLib = {
  Text: { prompt: Prompt.Input.prompt.bind(Prompt.Input) },
  Confirm: { prompt: Prompt.Confirm.prompt.bind(Prompt.Confirm) },
  Number: { prompt: Prompt.Number.prompt.bind(Prompt.Number) },
  Secret: { prompt: Prompt.Secret.prompt.bind(Prompt.Secret) },
  Toggle: { prompt: Prompt.Toggle.prompt.bind(Prompt.Toggle) },
  MultiText: { prompt: Prompt.List.prompt.bind(Prompt.List) },
  Select: { prompt: Prompt.Select.prompt.bind(Prompt.Select) },

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
