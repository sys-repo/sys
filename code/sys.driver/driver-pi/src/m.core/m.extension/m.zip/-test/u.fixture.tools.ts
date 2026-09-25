import { FsCapability } from '@sys/fs/capability';
import { registerZipExtract } from '../source/u.extract.ts';
import { registerZipRead } from '../source/u.read.ts';
import { resolvePolicy } from '../u/u.policy.ts';
import { expect, type t } from './common.ts';

// Direct caller seam only; no evidence about the real host's queue implementation.
export const immediate: t.MutationQueue = (_path, run) => run();

export async function readTools(root?: string): Promise<readonly t.Tool[]> {
  const tools: t.Tool[] = [];
  const policy = await resolvePolicy({ readRoots: root ? [root] : [], protectedRoots: [] });
  registerZipRead({
    registerTool(tool) {
      tools.push(tool);
    },
  }, policy);
  return tools;
}

export async function extractTool(
  root: string,
  options: {
    queue?: t.MutationQueue;
    rooted?: t.FsRooted.Lib;
    timeout?: t.Policy['operationTimeoutMs'];
  } = {},
): Promise<t.Tool> {
  const tools: t.Tool[] = [];
  const policy = await resolvePolicy({
    enabled: true,
    extract: 'cooperative',
    readRoots: [root],
    writeRoots: [root],
    protectedRoots: [],
  });
  registerZipExtract(
    {
      registerTool(tool) {
        tools.push(tool);
      },
    },
    { ...policy, operationTimeoutMs: options.timeout ?? policy.operationTimeoutMs },
    options.queue ?? immediate,
    options.rooted ?? FsCapability.Rooted,
  );
  expect(tools.length).to.eql(1);
  return tools[0];
}
