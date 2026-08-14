import { c, type t } from '../common.ts';
import { Prompt } from '../m.Prompt/mod.ts';
import { promptSelect } from './u.select.ts';

export const Input: t.CliInput.Lib = Object.freeze({
  Text: Object.freeze<t.CliInput.Lib['Text']>({
    prompt: Prompt.Input.prompt.bind(Prompt.Input),
  }),
  Confirm: Object.freeze<t.CliInput.Lib['Confirm']>({
    prompt: Prompt.Confirm.prompt.bind(Prompt.Confirm),
  }),
  Number: Object.freeze<t.CliInput.Lib['Number']>({
    prompt: Prompt.Number.prompt.bind(Prompt.Number),
  }),
  Secret: Object.freeze<t.CliInput.Lib['Secret']>({
    prompt: Prompt.Secret.prompt.bind(Prompt.Secret),
  }),
  Toggle: Object.freeze<t.CliInput.Lib['Toggle']>({
    prompt: Prompt.Toggle.prompt.bind(Prompt.Toggle),
  }),
  MultiText: Object.freeze<t.CliInput.Lib['MultiText']>({
    prompt: Prompt.List.prompt.bind(Prompt.List),
  }),
  Select: Object.freeze<t.CliInput.Lib['Select']>({ prompt: promptSelect }),
  Checkbox: Object.freeze<t.CliInput.Lib['Checkbox']>({
    prompt(args) {
      return Prompt.Checkbox.prompt({
        check: c.green('●'),
        uncheck: c.gray('○'),
        ...args,
      });
    },
  }),
});
