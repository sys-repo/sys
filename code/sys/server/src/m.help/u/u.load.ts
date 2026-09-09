import { json } from '../-bundle/-bundle.ts';
import { CliFmt, type t } from '../common.ts';
import { HelpResource } from './u.paths.ts';
import { HelpYaml } from './u.yaml.ts';

const Resource = CliFmt.Chapters.Resources.create<t.StringPath>({
  json,
  label: 'ServerHelp',
  parse: HelpYaml.record,
});

export const RootHelp: t.ServerHelp.Root.Lib = Object.freeze({
  load() {
    const data = Resource.readRecord(HelpResource.Root, [
      'summary',
      'usage',
      'commands',
      'options',
    ]);
    return Promise.resolve({
      summary: HelpYaml.string(data, 'summary'),
      usage: HelpYaml.list(data, 'usage'),
      commands: HelpYaml.pairs(data, 'commands'),
      options: HelpYaml.pairs(data, 'options'),
    });
  },
});

const DslBook = CliFmt.Chapters.Book.create<t.StringPath>({
  root: HelpResource.Dsl.Root,
  label: 'ServerHelp',
  noun: 'DSL chapter',
  recordKind: 'YAML record',
  read: Resource.readParsedRecord,
});

export const DslHelp: t.ServerHelp.Dsl.Lib = Object.freeze({
  load(path = []) {
    return DslBook.load(path);
  },
});
