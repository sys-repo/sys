import type { t } from '../common.ts';

const path = (value: string) => value as t.StringPath;
const chapter = (
  id: string,
  file: string,
  children: readonly t.CellHelp.Dsl.ChapterResource[] = [],
): t.CellHelp.Dsl.ChapterResource => ({ id, file: path(file), children });

export function chapterResourceFiles(
  chapter: t.CellHelp.Dsl.ChapterResource,
): readonly t.StringPath[] {
  return [chapter.file, ...chapter.children.flatMap(chapterResourceFiles)];
}

export function resolveChapterResource(
  root: t.CellHelp.Dsl.ChapterResource,
  path: readonly string[],
): t.CellHelp.Dsl.ChapterResource | undefined {
  let resource = root;

  for (const id of path) {
    const child = resource.children.find((item) => item.id === id);
    if (!child) return undefined;
    resource = child;
  }

  return resource;
}

export const HelpResource = {
  Root: path('yaml/root.yaml'),
  Init: path('yaml/init.yaml'),
  Dsl: {
    Root: chapter('dsl', 'yaml/dsl.yaml', [
      chapter('pulled-view', 'yaml/dsl.pulled-view.yaml'),
    ]),
  },
  Source: {
    get Files(): readonly t.StringPath[] {
      return [
        HelpResource.Root,
        HelpResource.Init,
        ...chapterResourceFiles(HelpResource.Dsl.Root),
      ];
    },
  },
} as const;
