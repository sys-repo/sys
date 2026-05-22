import { YamlPipeline, type t } from '../common.ts';

export function makeYaml(rev = 0, ast?: unknown): t.EditorYaml {
  return {
    rev,
    data: ast ? { ast } : undefined,
  } as unknown as t.EditorYaml;
}

export function makeEditorYamlFromText(text: string, rev = 1): t.EditorYaml {
  // Use the pipeline's canonical parser; path is irrelevant for EditorYaml construction.
  const { ast } = YamlPipeline.Slug.fromYaml(text, '');
  return { rev, data: { ast } } as unknown as t.EditorYaml;
}
