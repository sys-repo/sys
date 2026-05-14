import { Fmt as CliFmt } from '@sys/cli/fmt';
import type { t } from '../common.ts';

export function chapterResourceFiles(
  chapter: t.CellHelp.Dsl.ChapterResource,
): readonly t.StringPath[] {
  return CliFmt.Chapters.files(chapter);
}

export function resolveChapterResource(
  root: t.CellHelp.Dsl.ChapterResource,
  path: readonly string[],
): t.CellHelp.Dsl.ChapterResource | undefined {
  return CliFmt.Chapters.resolve(root, path);
}

export const HelpResource = {
  Root: path('yaml/root.yaml'),
  Init: path('yaml/init.yaml'),
  Task: path('yaml/task.yaml'),
  Start: path('yaml/start.yaml'),
  Dsl: {
    Root: chapter('dsl', 'yaml/dsl.yaml', [
      chapter('pulled-view', 'yaml/dsl.pulled-view.yaml'),
      chapter('static-serve-service', 'yaml/dsl.service.static-serve.yaml'),
      chapter('service', 'yaml/dsl.service.yaml'),
      chapter('proxy-service', 'yaml/dsl.proxy-service.yaml'),
      chapter('start-services', 'yaml/dsl.start-services.yaml'),
    ]),
  },
  Source: {
    get Files(): readonly t.StringPath[] {
      return [
        HelpResource.Root,
        HelpResource.Init,
        HelpResource.Task,
        HelpResource.Start,
        ...chapterResourceFiles(HelpResource.Dsl.Root),
      ];
    },
  },
} as const;

/**
 * Helpers:
 */
function path(value: string): t.StringPath {
  return value;
}

function chapter(
  id: string,
  file: string,
  children: readonly t.CellHelp.Dsl.ChapterResource[] = [],
): t.CellHelp.Dsl.ChapterResource {
  return { id, file: path(file), children };
}
