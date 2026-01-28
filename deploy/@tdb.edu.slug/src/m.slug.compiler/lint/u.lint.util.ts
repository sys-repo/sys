import { type t, Fs } from './common.ts';
import { LintProfileSchema } from './u.lint.schema.ts';

export async function readLintProfile(path: t.StringFile): Promise<t.LintProfileDoc> {
  const res = await Fs.readYaml<t.LintProfileDoc>(path);
  if (!res.ok || !res.exists) return LintProfileSchema.initial();
  const doc = res.data ?? {};
  return LintProfileSchema.validate(doc).ok ? doc : LintProfileSchema.initial();
}

export async function writeLintProfile(path: t.StringFile, doc: t.LintProfileDoc) {
  await Fs.write(path, LintProfileSchema.stringify(doc));
}
