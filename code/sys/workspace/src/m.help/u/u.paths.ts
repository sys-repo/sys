import { CliFmt, type t } from '../common.ts';

export function chapterResourceFiles(
  chapter: t.WorkspaceHelp.Dsl.ChapterResource,
): readonly t.StringPath[] {
  return CliFmt.Chapters.files(chapter);
}

export function resolveChapterResource(
  root: t.WorkspaceHelp.Dsl.ChapterResource,
  path: readonly string[],
): t.WorkspaceHelp.Dsl.ChapterResource | undefined {
  return CliFmt.Chapters.resolve(root, path);
}

export const HelpResource = {
  Root: 'yaml/root.yaml',
  Dsl: {
    Root: chapter('dsl', 'yaml/dsl.yaml'),
  },
  Source: {
    get Files(): readonly t.StringPath[] {
      return [HelpResource.Root, ...chapterResourceFiles(HelpResource.Dsl.Root)];
    },
  },
} as const;

/**
 * Helpers:
 */
function chapter(
  id: string,
  file: t.StringPath,
  children: readonly t.WorkspaceHelp.Dsl.ChapterResource[] = [],
): t.WorkspaceHelp.Dsl.ChapterResource {
  return { id, file, children };
}
