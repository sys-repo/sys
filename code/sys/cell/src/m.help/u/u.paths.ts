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
  Root: 'yaml/root.yaml',
  Info: 'yaml/info.yaml',
  Init: 'yaml/init.yaml',
  Migrate: 'yaml/migrate.yaml',
  Task: 'yaml/task.yaml',
  Start: 'yaml/start.yaml',
  Kill: 'yaml/kill.yaml',
  Dsl: {
    Root: chapter('dsl', 'yaml/dsl.yaml', [
      chapter('pulled-view', 'yaml/dsl.pulled-view.yaml'),
      chapter('static-serve-service', 'yaml/dsl.service.static-serve.yaml'),
      chapter('service', 'yaml/dsl.service.yaml'),
      chapter('proxy-service', 'yaml/dsl.proxy-service.yaml'),
      chapter('start-services', 'yaml/dsl.start-services.yaml'),
      chapter('examples', 'yaml/dsl.examples.yaml'),
    ]),
  },
  Source: {
    get Files(): readonly t.StringPath[] {
      return [
        HelpResource.Root,
        HelpResource.Info,
        HelpResource.Init,
        HelpResource.Migrate,
        HelpResource.Task,
        HelpResource.Start,
        HelpResource.Kill,
        ...chapterResourceFiles(HelpResource.Dsl.Root),
      ];
    },
  },
} as const;

/**
 * Helpers:
 */
function chapter(
  id: string,
  file: t.StringPath,
  children: readonly t.CellHelp.Dsl.ChapterResource[] = [],
): t.CellHelp.Dsl.ChapterResource {
  return { id, file, children };
}
