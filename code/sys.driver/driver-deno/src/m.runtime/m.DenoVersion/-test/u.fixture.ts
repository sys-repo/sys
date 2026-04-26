import { type t } from '../common.ts';

export function procOutput(
  text: string,
  props: Partial<{ success: boolean; code: number; stderr: string }> = {},
): t.DenoVersion.Output {
  const stderrText = props.stderr ?? '';
  return {
    cmd: 'deno',
    args: [],
    code: props.code ?? 0,
    success: props.success ?? true,
    signal: null,
    stdout: new TextEncoder().encode(text),
    stderr: new TextEncoder().encode(stderrText),
    text: {
      stdout: text,
      stderr: stderrText,
    },
    toString() {
      return text || stderrText;
    },
  };
}
