import { json } from '../-bundle/-bundle.ts';
import { CliFmt, FileMap, Is, type t } from '../common.ts';
import { HelpResource } from './u.paths.ts';
import { HelpYaml } from './u.yaml.ts';

export const Dsl: t.TmplHelp.Dsl.Lib = {
  load(path = []) {
    return Book.load(path);
  },
};

const Book = CliFmt.Chapters.Book.create<t.StringPath>({
  root: HelpResource.Dsl.Root,
  label: 'TmplHelp',
  noun: 'DSL chapter',
  recordKind: 'YAML record',
  read: readParsedRecord,
});

/**
 * Helpers:
 */

function readParsedRecord(path: t.StringPath) {
  const text = readText(path);
  return HelpYaml.record(text, path);
}

function readText(path: t.StringPath): string {
  const dataUri = json[path];
  if (!Is.str(dataUri)) throw new Error(`TmplHelp: resource not found: ${path}`);

  const data = FileMap.Data.decode(dataUri);
  if (!Is.str(data)) throw new Error(`TmplHelp: resource is not text: ${path}`);
  return data;
}
