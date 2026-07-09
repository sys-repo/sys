import { json } from './-bundle/-bundle.ts';
import { Json, Path, Str, type t, TmplEngine } from './common.ts';

const SOURCE_ROOT = 'tmpl.ocr';
const TARGET_FILE = 'ocr.ts';
const POLICY_MARKER = Str.dedent(
  `
  declare const __OCR_POLICY__: OcrPolicy;
  const POLICY: OcrPolicy = __OCR_POLICY__;
  `,
).trim();

export function makeTmpl(policy: t.PiOcrExtension.Extension.Policy) {
  const processFile: t.TmplProcessFile = (e) => {
    if (!e.path.startsWith(`${SOURCE_ROOT}/`)) return;

    const relative = e.path.slice(SOURCE_ROOT.length + 1);
    if (!relative) return e.skip('empty template path');
    assertSafeRelativePath(relative);
    if (relative !== TARGET_FILE) return e.skip(`unsupported OCR template file: ${relative}`);

    e.target.rename(relative, true);
    if (typeof e.text !== 'string') return e.skip('OCR template must be text');

    const next = e.text.replace(
      POLICY_MARKER,
      `const POLICY: OcrPolicy = ${formatPolicy(policy)};`,
    );
    if (next === e.text || next.includes('__OCR_POLICY__')) {
      throw new Error('Unresolved OCR template marker.');
    }
    e.modify(next);
  };

  return TmplEngine
    .makeTmpl(json, processFile)
    .filter((e) => e.path.startsWith(`${SOURCE_ROOT}/`));
}

function formatPolicy(policy: t.PiOcrExtension.Extension.Policy) {
  return Json.stringify(policy, 2);
}

function assertSafeRelativePath(path: string) {
  if (!path) throw new Error('OCR template contains an empty path.');
  if (Path.Is.absolute(path)) throw new Error(`OCR template path must be relative: ${path}`);
  if (path.split('/').includes('..')) throw new Error(`OCR template path escapes root: ${path}`);
}
