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
  Action: path('yaml/action.yaml'),
  Start: path('yaml/start.yaml'),
  Dsl: {
    Root: chapter('dsl', 'yaml/dsl.yaml', [
      chapter('pulled-view', 'yaml/dsl.pulled-view.yaml'),
      chapter('static-http-service', 'yaml/dsl.static-http-service.yaml'),
      chapter('runtime-service', 'yaml/dsl.runtime-service.yaml'),
      chapter('proxy-service', 'yaml/dsl.proxy-service.yaml'),
      chapter('start-runtime', 'yaml/dsl.start-runtime.yaml'),
    ]),
  },
  Source: {
    get Files(): readonly t.StringPath[] {
      return [
        HelpResource.Root,
        HelpResource.Init,
        HelpResource.Action,
        HelpResource.Start,
        ...chapterResourceFiles(HelpResource.Dsl.Root),
      ];
    },
  },
} as const;

/**
 * Helpers:
 */

function path(value: string) {
  return value as t.StringPath;
}

function chapter(
  id: string,
  file: string,
  children: readonly t.CellHelp.Dsl.ChapterResource[] = [],
): t.CellHelp.Dsl.ChapterResource {
  return { id, file: path(file), children };
}
