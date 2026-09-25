import { Fs, Json, type t, Testing } from '../../../-test.ts';

type O = Record<string, unknown>;

export async function testProject(tasks: O) {
  const fs = await Testing.dir('DenoTask', { slug: true });
  await Fs.write(
    fs.join('deno.json'),
    Json.stringify({ tasks }),
    { force: true, throw: true },
  );
  return fs;
}

export type CapturedInfo = {
  readonly result: t.DenoTask.Menu.Result;
  readonly text: string;
  readonly exitCode: number;
};

export async function captureInfo(
  fn: () => Promise<t.DenoTask.Menu.Result>,
): Promise<CapturedInfo> {
  const info = console.info;
  const previousExitCode = Deno.exitCode;
  const lines: string[] = [];
  try {
    Deno.exitCode = 0;
    console.info = (...data: unknown[]) => lines.push(data.map(String).join(' '));
    const result = await fn();
    return { result, text: lines.join('\n'), exitCode: Deno.exitCode };
  } finally {
    console.info = info;
    Deno.exitCode = previousExitCode;
  }
}
