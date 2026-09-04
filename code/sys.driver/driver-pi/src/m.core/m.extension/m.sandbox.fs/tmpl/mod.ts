import type { ExtensionApi, SandboxFsPolicy } from './t.ts';
import { guardCopy, guardMove, guardRemove } from './u.guard.ts';
import { registerCopy, registerMove, registerRemove } from './u.tool.ts';

declare const __SANDBOX_FS_POLICY__: SandboxFsPolicy;
const POLICY: SandboxFsPolicy = __SANDBOX_FS_POLICY__;

export default function sandboxFs(pi: ExtensionApi) {
  if (POLICY.remove.enabled) registerRemove(pi, POLICY);
  if (POLICY.move.enabled) registerMove(pi, POLICY);
  if (POLICY.copy.enabled) registerCopy(pi, POLICY);
}

export const __sandboxFsTest = {
  guardRemove,
  guardMove,
  guardCopy,
} as const;
