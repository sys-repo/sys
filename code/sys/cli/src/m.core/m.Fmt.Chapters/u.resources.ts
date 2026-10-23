import type { t } from '../common.ts';

export function files<TFile extends string>(
  chapter: t.CliFormatChapters.Chapter.Resource<TFile>,
): readonly TFile[] {
  return [chapter.file, ...chapter.children.flatMap(files)];
}

export function resolve<TFile extends string>(
  root: t.CliFormatChapters.Chapter.Resource<TFile>,
  path: readonly string[],
): t.CliFormatChapters.Chapter.Resource<TFile> | undefined {
  let resource = root;

  for (const id of path) {
    const child = resource.children.find((item) => item.id === id);
    if (!child) return undefined;
    resource = child;
  }

  return resource;
}
