import { Testing } from '../../-test.ts';
import { type t, Yaml } from '../common.ts';

/**
 * Pass a fresh canonical temporary-directory path to the callback; does not change cwd.
 * Delegate lifetime to Testing.withTmpDir, awaiting cleanup before settlement.
 */
export async function withTmpDir<T>(
  fn: (dir: string) => Promise<T>,
  options: { prefix?: string } = {},
): Promise<T> {
  const { prefix = 'sys.tools.deploy.' } = options;
  return await Testing.withTmpDir(fn, { prefix });
}

/**
 * Temporarily replace console.info to capture output without forwarding it.
 * Restore the original global sink afterward; do not overlap other captures.
 */
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
