import { WorkspaceCli } from '@sys/workspace/cli';

/**
 * Deliberate dependency upgrade holds.
 *
 * esbuild@0.28.0 currently ships a darwin-arm64 binary that is killed by the OS
 * in this runtime path, which breaks @sys/driver-vite transport transforms.
 * Keep the canonical deps.yaml pin at 0.27.1 until that toolchain issue is
 * debugged and released cleanly.
 */
const UPGRADE_HOLDS = ['esbuild'] as const;

const holdArgs = UPGRADE_HOLDS.map((name) => `--exclude=${name}`);
await WorkspaceCli.run({ argv: ['upgrade', ...holdArgs, ...Deno.args] });
