import { CliFmt, type t } from '../common.ts';

export const HelpResource = {
  Dsl: {
    Root: chapter('dsl', 'yaml/dsl.yaml', [
      chapter('profile', 'yaml/dsl.profile.yaml'),
      chapter('tools', 'yaml/dsl.tools.yaml'),
      chapter('extensions', 'yaml/dsl.extensions.yaml'),
    ]),
  },
  Source: {
    get Files(): readonly t.StringPath[] {
      return [...chapterResourceFiles(HelpResource.Dsl.Root)];
    },
  },
} as const;

/**
 * Helpers:
 */

function chapterResourceFiles(
  chapter: t.PiHelp.Dsl.ChapterResource,
): readonly t.StringPath[] {
  return CliFmt.Chapters.files(chapter);
}

function chapter(
  id: string,
  file: t.StringPath,
  children: readonly t.PiHelp.Dsl.ChapterResource[] = [],
): t.PiHelp.Dsl.ChapterResource {
  return { id, file, children };
}
