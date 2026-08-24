import { Err, Is, Json, type t } from '../common.ts';

const YAML_PLAIN_TRIGGER = /^[A-Za-z0-9._/][A-Za-z0-9._/@*?+-]*$/u;
const YAML_IMPLICIT_WORD = /^(?:false|n|no|null|off|on|true|y|yes)$/iu;
const YAML_NON_TEXT = /[\u0000-\u001F\u007F-\u009F\u2028\u2029]/u;

export const wrangle = Object.freeze(
  {
    indent(text: string, indent: number) {
      return text
        .split('\n')
        .map((line) => `${' '.repeat(indent)}${line}`)
        .filter((line) => (!line.trim() ? line.trim() : line))
        .join('\n');
    },

    map(entries: Readonly<Record<string, string>>, indent: number) {
      return Object.entries(entries)
        .map(([key, value]) => `${' '.repeat(indent)}${key}: ${value}`)
        .join('\n');
    },

    triggerList(values: readonly unknown[], indent: number) {
      if (!Is.array(values)) throw Err.std('Invalid workflow trigger list');
      return values
        .map((value) => `${' '.repeat(indent)}- ${triggerScalar(value)}`)
        .join('\n');
    },

    on(value?: t.WorkspaceCi.WorkflowOn) {
      const on = value ?? { push: { branches: ['main'] as const } };
      const lines = ['on:'];
      if (on.push?.branches?.length || on.push?.tags?.length) {
        lines.push('  push:');
        if (on.push?.branches?.length) {
          lines.push('    branches:', wrangle.triggerList(on.push.branches, 6));
        }
        if (on.push?.tags?.length) {
          lines.push('    tags:', wrangle.triggerList(on.push.tags, 6));
        }
        if (on.push?.paths_ignore?.length) {
          lines.push('    paths-ignore:', wrangle.triggerList(on.push.paths_ignore, 6));
        }
      }
      if (on.pull_request?.branches?.length) {
        lines.push(
          '  pull_request:',
          '    branches:',
          wrangle.triggerList(on.pull_request.branches, 6),
        );
        if (on.pull_request?.paths_ignore?.length) {
          lines.push(
            '    paths-ignore:',
            wrangle.triggerList(on.pull_request.paths_ignore, 6),
          );
        }
      }
      if (on.workflow_dispatch) lines.push('  workflow_dispatch:');
      return lines.join('\n');
    },
  } as const,
);

function triggerScalar(value: unknown) {
  if (
    !Is.str(value) ||
    !value.trim() ||
    YAML_NON_TEXT.test(value) ||
    value.includes('${{')
  ) {
    throw Err.std('Invalid workflow trigger value');
  }

  const startsWithDigit = /^[0-9]/u.test(value);
  const plain = YAML_PLAIN_TRIGGER.test(value) &&
    !startsWithDigit &&
    !YAML_IMPLICIT_WORD.test(value) &&
    value !== '~' &&
    value !== '...' &&
    !/^\.(?:inf|nan)$/iu.test(value);
  return plain ? value : Json.stringify(value);
}
