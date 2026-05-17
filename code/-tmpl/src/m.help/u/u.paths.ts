import { CliFmt, type t } from '../common.ts';

export const HelpResource = {
  Dsl: {
    Root: chapter('dsl', 'yaml/dsl.yaml', [
      chapter('repo', 'yaml/dsl.repo.yaml'),
      chapter('pkg', 'yaml/dsl.pkg.yaml'),
      chapter('pkg.help', 'yaml/dsl.pkg.help.yaml'),
      chapter('m.mod', 'yaml/dsl.m.mod.yaml'),
      chapter('m.mod.ui', 'yaml/dsl.m.mod.ui.yaml'),
      chapter('m.mod.ui.controller', 'yaml/dsl.m.mod.ui.controller.yaml'),
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
  chapter: t.TmplHelp.Dsl.ChapterResource,
): readonly t.StringPath[] {
  return CliFmt.Chapters.files(chapter);
}

function chapter(
  id: string,
  file: t.StringPath,
  children: readonly t.TmplHelp.Dsl.ChapterResource[] = [],
): t.TmplHelp.Dsl.ChapterResource {
  return { id, file, children };
}
