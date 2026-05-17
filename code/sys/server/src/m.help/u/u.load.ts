import { json } from '../-bundle/-bundle.ts';
import { CliFmt, FileMap, Is, type t } from '../common.ts';
import { HelpResource } from './u.paths.ts';
import { HelpYaml } from './u.yaml.ts';

export const RootHelp: t.ServerHelp.Root.Lib = {
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

const DslBook = CliFmt.Chapters.Book.create<t.StringPath>({
  root: HelpResource.Dsl.Root,
  label: 'ServerHelp',
  noun: 'DSL chapter',
  recordKind: 'YAML record',
  read: readParsedRecord,
});

export const DslHelp: t.ServerHelp.Dsl.Lib = {
  load(path = []) {
    return DslBook.load(path);
  },
};

/**
 * Helpers:
 */
function readRecord(path: t.StringPath, fields: readonly string[]) {
  const data = readParsedRecord(path);
  HelpYaml.require(data, fields);
  return data;
}

function readParsedRecord(path: t.StringPath) {
  const text = readText(path);
  return HelpYaml.record(text, path);
}

function readText(path: t.StringPath): string {
  const dataUri = json[path];
  if (!Is.str(dataUri)) throw new Error(`ServerHelp: resource not found: ${path}`);

  const data = FileMap.Data.decode(dataUri);
  if (!Is.str(data)) throw new Error(`ServerHelp: resource is not text: ${path}`);
  return data;
}
