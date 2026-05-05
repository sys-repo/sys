import { json } from '../-bundle/-bundle.ts';
import { FileMap, Is, type t } from '../common.ts';
import { HelpResource, resolveChapterResource } from './u.paths.ts';
import { HelpYaml } from './u.yaml.ts';

export const RootHelp: t.CellHelp.Root.Lib = {
  load() {
    const data = readRecord(HelpResource.Root, ['summary', 'usage', 'commands', 'options']);
    return Promise.resolve({
      summary: HelpYaml.string(data, 'summary'),
      usage: HelpYaml.list(data, 'usage'),
      commands: HelpYaml.pairs(data, 'commands'),
      options: HelpYaml.pairs(data, 'options'),
    });
  },
};

export const InitHelp: t.CellHelp.Init.Lib = {
  load() {
    const data = readRecord(HelpResource.Init, ['summary', 'usage', 'options', 'safety', 'agent']);
    return Promise.resolve({
      summary: HelpYaml.string(data, 'summary'),
      usage: HelpYaml.list(data, 'usage'),
      options: HelpYaml.pairs(data, 'options'),
      safety: HelpYaml.list(data, 'safety'),
      agent: HelpYaml.list(data, 'agent'),
    });
  },
};

export const DslHelp: t.CellHelp.Dsl.Lib = {
  load(path = []) {
    return Promise.resolve(readDslChapter(path));
  },
};

/**
 * Helpers:
 */

function readDslChapter(path: readonly string[]): t.CellHelp.Dsl.Chapter {
  const resource = resolveChapterResource(HelpResource.Dsl.Root, path);
  if (!resource) throw new Error(`CellHelp: DSL chapter not found: ${path.join(' ')}`);
  return readChapter(resource, path);
}

function readChapter(
  resource: t.CellHelp.Dsl.ChapterResource,
  path: readonly string[],
): t.CellHelp.Dsl.Chapter {
  const data = readRecord(resource.file, ['id', 'title', 'summary', 'sections']);
  const id = HelpYaml.string(data, 'id');
  assertChapterId(resource.file, id, resource.id);

  return {
    id,
    path,
    title: HelpYaml.string(data, 'title'),
    summary: HelpYaml.string(data, 'summary'),
    sections: HelpYaml.sections(data, 'sections'),
    chapters: readChapterLinks(path, resource.children),
  };
}

function readChapterLinks(
  parentPath: readonly string[],
  resources: readonly t.CellHelp.Dsl.ChapterResource[],
): readonly t.CellHelp.Dsl.ChapterLink[] {
  return resources.map((resource) => {
    const data = readRecord(resource.file, ['id', 'title', 'summary']);
    const id = HelpYaml.string(data, 'id');
    assertChapterId(resource.file, id, resource.id);
    return {
      id,
      path: [...parentPath, id],
      title: HelpYaml.string(data, 'title'),
      summary: HelpYaml.string(data, 'summary'),
    };
  });
}

function assertChapterId(file: t.StringPath, id: string, expected: string) {
  if (id !== expected) {
    throw new Error(`CellHelp: DSL chapter id mismatch: ${file} (${id} !== ${expected})`);
  }
}

function readRecord(path: t.StringPath, fields: readonly string[]) {
  const text = readText(path);
  const data = HelpYaml.record(text, path);
  HelpYaml.require(data, fields);
  return data;
}

function readText(path: t.StringPath): string {
  const dataUri = json[path];
  if (!Is.str(dataUri)) throw new Error(`CellHelp: resource not found: ${path}`);

  const data = FileMap.Data.decode(dataUri);
  if (!Is.str(data)) throw new Error(`CellHelp: resource is not text: ${path}`);
  return data;
}
