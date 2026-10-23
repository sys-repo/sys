import { CliFmt, type t } from '../common.ts';

export function chapterResourceFiles(
  chapter: t.ServerHelp.Dsl.ChapterResource,
): readonly t.StringPath[] {
  return CliFmt.Chapters.files(chapter);
}

export const HelpResource = {
  Root: 'yaml/root.yaml',
  Dsl: {
    Root: chapter('dsl', 'yaml/dsl.yaml', [
      chapter('websocket', 'yaml/dsl.websocket.yaml'),
      chapter('websocket.cmd', 'yaml/dsl.websocket.cmd.yaml'),
      chapter('websocket.lifecycle', 'yaml/dsl.websocket.lifecycle.yaml'),
      chapter('websocket.service', 'yaml/dsl.websocket.service.yaml'),
      chapter('files.websocket', 'yaml/dsl.files.websocket.yaml'),
    ]),
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
  children: readonly t.ServerHelp.Dsl.ChapterResource[] = [],
): t.ServerHelp.Dsl.ChapterResource {
  return { id, file, children };
}
