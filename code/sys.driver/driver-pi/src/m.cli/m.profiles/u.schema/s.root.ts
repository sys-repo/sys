import { Type } from './common.ts';
import { prompt } from './s.prompt.ts';
import { sandbox } from './s.sandbox.ts';
import { tools } from './s.tools.ts';

/** Complete profile YAML schema. */
export const schema = Type.Object(
  {
    prompt,
    sandbox,
    tools,
  },
  { additionalProperties: false },
);
