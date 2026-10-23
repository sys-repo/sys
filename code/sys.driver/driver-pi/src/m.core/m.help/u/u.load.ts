import { json } from '../-bundle/-bundle.ts';
import { CliFmt, type t } from '../common.ts';
import { HelpResource } from './u.paths.ts';
import { HelpYaml } from './u.yaml.ts';

const Resource = CliFmt.Chapters.Resources.create<t.StringPath>({
  json,
  label: 'PiHelp',
  parse: HelpYaml.record,
});

export const Dsl: t.PiHelp.Dsl.Lib = {
  load(path = []) {
    return Book.load(path);
  },
};

const Book = CliFmt.Chapters.Book.create<t.StringPath>({
  root: HelpResource.Dsl.Root,
  label: 'PiHelp',
  noun: 'DSL chapter',
  recordKind: 'YAML record',
  read: Resource.readParsedRecord,
});
