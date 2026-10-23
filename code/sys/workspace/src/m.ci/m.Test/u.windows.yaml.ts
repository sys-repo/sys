import { Json } from '../common.ts';
import { WorkflowSafe } from '../u/u.safe.ts';
import type { WindowsTestModule } from './u.windows.module.ts';

export function toWindowsMatrixItemYaml(module: WindowsTestModule) {
  const name = WorkflowSafe.scalar(module.name, 'matrix name');
  const path = WorkflowSafe.scalar(module.path, 'matrix path');
  return [`- name: ${Json.stringify(name)}`, `  path: ${Json.stringify(path)}`].join('\n');
}
