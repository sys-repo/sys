import { Fs, type t, Yaml } from '../common.ts';

/**
 * Run a function inside a temporary directory.
 * The directory is created before execution and always removed after.
 */
export async function withTmpDir<T>(
  fn: (dir: string) => Promise<T>,
  options: { prefix?: string } = {},
): Promise<T> {
  const { prefix = 'sys.tools.deploy.' } = options;
  const dir = await Fs.makeTempDir({ prefix });
  const canonical = await Fs.realPath(dir.absolute);
  try {
    return await fn(canonical);
  } finally {
    await Fs.remove(dir.absolute);
  }
}

/** Capture console.info output while preserving the original sink. */
export async function captureInfo<T>(
  fn: () => Promise<T>,
): Promise<{ readonly value: T; readonly output: string }> {
  const original = console.info;
  const lines: string[] = [];
  console.info = (...data: unknown[]) => void lines.push(data.map(String).join(' '));
  try {
    const value = await fn();
    return { value, output: lines.join('\n') };
  } finally {
    console.info = original;
  }
}

/** Providerless copy-stage endpoint for prebuilt artifact staging. */
export function providerlessPrebuiltStageDoc(): t.DeployTool.Config.EndpointYaml.Doc {
  return {
    source: { dir: '.' },
    staging: { dir: './.tmp/deploy/stage' },
    mappings: [
      {
        mode: 'copy',
        dir: { source: 'view/.pulled/ui.components', staging: '.' },
      },
    ],
  };
}

/** Providerless copy-stage YAML used by non-interactive deploy tests. */
export function providerlessPrebuiltStageYaml(): string {
  const yaml = Yaml.stringify(providerlessPrebuiltStageDoc());
  if (yaml.error || !yaml.data) {
    throw new Error('Failed to stringify providerless prebuilt stage fixture YAML.');
  }
  return yaml.data;
}
