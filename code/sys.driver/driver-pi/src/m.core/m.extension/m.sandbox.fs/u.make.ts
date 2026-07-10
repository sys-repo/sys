import { json } from './-bundle/-bundle.ts';
import { Json, Path, Str, TmplEngine, type t } from './common.ts';

const SOURCE_ROOT = 'tmpl.sandbox.fs';
const TARGET_ENTRY = 'mod.ts';
const POLICY_MARKER = Str.dedent(
  `
  declare const __SANDBOX_FS_POLICY__: SandboxFsPolicy;
  const POLICY: SandboxFsPolicy = __SANDBOX_FS_POLICY__;
  `,
).trim();

/** Create the generated sandbox filesystem extension template. */
export function makeTmpl(policy: t.PiSandboxFsExtension.Policy) {
  const processFile: t.TmplProcessFile = (e) => {
    if (!e.path.startsWith(`${SOURCE_ROOT}/`)) return;

    const relative = e.path.slice(SOURCE_ROOT.length + 1);
    if (!relative) return e.skip('empty template path');
    assertSafeRelativePath(relative);
    e.target.rename(relative, true);
    if (typeof e.text !== 'string') return e.skip('sandbox.fs template must be text');
    if (relative !== TARGET_ENTRY) return;

    const next = e.text.replace(
      POLICY_MARKER,
      `const POLICY: SandboxFsPolicy = ${formatPolicy(policy)};`,
    );
    if (next === e.text || next.includes('__SANDBOX_FS_POLICY__')) {
      throw new Error('Unresolved sandbox.fs template marker.');
    }
    e.modify(next);
  };

  return TmplEngine
    .makeTmpl(json, processFile)
    .filter((e) => e.path.startsWith(`${SOURCE_ROOT}/`));
}

/**
 * Helpers:
 */
function formatPolicy(policy: t.PiSandboxFsExtension.Policy) {
  return Json.stringify(policy, 2);
}

function assertSafeRelativePath(path: string) {
  if (!path) throw new Error('Sandbox filesystem template contains an empty path.');
  if (Path.Is.absolute(path)) {
    throw new Error(`Sandbox filesystem template path must be relative: ${path}`);
  }
  if (path.split('/').includes('..')) {
    throw new Error(`Sandbox filesystem template path escapes root: ${path}`);
  }
}
